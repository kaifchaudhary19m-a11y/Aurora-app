import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { Provider, ProviderConfig, Persona, Fandom, Character, Post, DM, EnergyState, Settings, CancelEvent } from '../types';
import { DEFAULT_PROVIDERS } from '../llm/providers';
import { buildSeedCharacters, SEED_FANDOMS } from '../personality/seed';
import {
  kvGet, kvSet, upsertRow, loadAll, loadPostsForPersona, loadDMsForThread, deleteFromTable,
} from '../db/database';

interface StoreState {
  ready: boolean;
  energy: EnergyState;
  settings: Settings;
  personas: Persona[];
  fandoms: Fandom[];
  characters: Character[];

  activePersona?: Persona;

  // caches
  feed: Post[];
  threadsCache: Record<string, Post[]>;     // parentId -> replies
  dmThreads: Record<string, DM[]>;          // `${personaId}:${characterId}` -> DMs
  cancelEvents: CancelEvent[];

  // actions
  hydrate: () => Promise<void>;
  setActivePersona: (id: string) => Promise<void>;
  createPersona: (input: Partial<Persona>) => Promise<Persona>;
  updatePersona: (p: Persona) => Promise<void>;
  saveCharacter: (c: Character) => Promise<void>;
  saveFandom: (f: Fandom) => Promise<void>;
  joinFandom: (fandomId: string) => Promise<void>;
  leaveFandom: (fandomId: string) => Promise<void>;

  addPost: (post: Post) => Promise<void>;
  reloadFeed: () => Promise<void>;
  loadReplies: (postId: string) => Promise<Post[]>;
  likePost: (postId: string, characterId?: string) => Promise<void>;

  sendDM: (characterId: string, text: string) => Promise<DM>;
  addDM: (dm: DM) => Promise<void>;
  loadDMThread: (characterId: string) => Promise<DM[]>;
  markThreadRead: (characterId: string) => Promise<void>;
  setCharacterTyping: (personaId: string, characterId: string, typing: boolean) => void;

  spendEnergy: (amount?: number) => boolean;
  regenEnergy: () => void;

  saveSettings: (patch: Partial<Settings>) => Promise<void>;
  setProviderKey: (id: Provider, apiKey: string) => Promise<void>;
  setProviderEnabled: (id: Provider, enabled: boolean) => Promise<void>;
  setProviderModel: (id: Provider, model: string) => Promise<void>;
  setProviderBaseUrl: (id: Provider, url: string) => Promise<void>;
  bumpProviderUsage: (id: Provider, n: number) => void;
  setProviderCooldown: (id: Provider, until: number) => void;

  addCancelEvent: (e: CancelEvent) => Promise<void>;
  resolveCancelEvent: (id: string, outcome: CancelEvent['resolvedOutcome']) => Promise<void>;
}

const DEFAULT_ENERGY: EnergyState = {
  current: 200, max: 200,
  lastRegenAt: Date.now(),
  regenIntervalMs: 5 * 60 * 1000,
  dailySpent: 0,
  dailyCap: 9999,   // effectively unlimited for solo user
  dailyResetAt: nextMidnight(),
};

const DEFAULT_SETTINGS: Settings = {
  activePersonaId: undefined,
  contentRating: 'edgy',
  autopilot: true,
  autopilotIntervalMs: 90_000,   // characters do their own thing every ~90s
  providers: DEFAULT_PROVIDERS,
  routerStrategy: 'round_robin',
  showReadReceipts: true,
  showTyping: true,
  monetizationUnlocked: true,
  betaFeatures: true,
};

export const useStore = create<StoreState>((set, get) => ({
  ready: false,
  energy: DEFAULT_ENERGY,
  settings: DEFAULT_SETTINGS,
  personas: [],
  fandoms: [],
  characters: [],
  activePersona: undefined,
  feed: [],
  threadsCache: {},
  dmThreads: {},
  cancelEvents: [],

  hydrate: async () => {
    const savedSettings = (await kvGet<Settings>('settings')) || DEFAULT_SETTINGS;
    // deep-merge providers so newly added providers appear even in old saves
    savedSettings.providers = { ...DEFAULT_PROVIDERS, ...(savedSettings.providers || {}) };
    for (const k of Object.keys(DEFAULT_PROVIDERS) as Provider[]) {
      savedSettings.providers[k] = { ...DEFAULT_PROVIDERS[k], ...(savedSettings.providers[k] || {}) };
    }

    let savedEnergy = (await kvGet<EnergyState>('energy')) || DEFAULT_ENERGY;
    if (savedEnergy.dailyResetAt < Date.now()) {
      savedEnergy = { ...savedEnergy, dailySpent: 0, dailyResetAt: nextMidnight() };
    }

    let personas = await loadAll<Persona>('personas');
    let fandoms = await loadAll<Fandom>('fandoms');
    let characters = await loadAll<Character>('characters');
    const cancelEvents = await loadAll<CancelEvent>('cancel_events');

    // Seed on first launch
    if (!fandoms.length) {
      fandoms = SEED_FANDOMS.map((f) => ({ ...f }));
      for (const f of fandoms) await upsertRow('fandoms', f.id, f);
    }
    if (!characters.length) {
      characters = buildSeedCharacters();
      for (const c of characters) await upsertRow('characters', c.id, c);
    }

    let activePersona = personas.find((p) => p.id === savedSettings.activePersonaId) || personas[0];

    set({
      ready: true,
      settings: savedSettings,
      energy: savedEnergy,
      personas, fandoms, characters,
      cancelEvents,
      activePersona,
    });
    if (activePersona) await get().reloadFeed();
  },

  setActivePersona: async (id) => {
    const p = get().personas.find((x) => x.id === id);
    if (!p) return;
    set({ activePersona: p });
    await get().saveSettings({ activePersonaId: id });
    await get().reloadFeed();
  },

  createPersona: async (input) => {
    const p: Persona = {
      id: `p_${uuid()}`,
      handle: (input.handle || 'you').replace(/[^a-z0-9_]/gi, '').toLowerCase() || 'you',
      displayName: input.displayName || 'You',
      bio: input.bio || '',
      avatarColor: input.avatarColor || '#8b5cf6',
      fandomIds: input.fandomIds || [],
      followers: 0,
      aura: 50,
      humour: 50,
      controversy: 0,
      createdAt: Date.now(),
      active: true,
    };
    await upsertRow('personas', p.id, p);
    const personas = [...get().personas, p];
    set({ personas, activePersona: p });
    await get().saveSettings({ activePersonaId: p.id });
    return p;
  },

  updatePersona: async (p) => {
    await upsertRow('personas', p.id, p);
    const personas = get().personas.map((x) => (x.id === p.id ? p : x));
    set({ personas, activePersona: get().activePersona?.id === p.id ? p : get().activePersona });
  },

  saveCharacter: async (c) => {
    await upsertRow('characters', c.id, c);
    const characters = get().characters.map((x) => (x.id === c.id ? c : x));
    // If not in the list (new), add
    if (!characters.find((x) => x.id === c.id)) characters.push(c);
    set({ characters });
  },

  saveFandom: async (f) => {
    await upsertRow('fandoms', f.id, f);
    const fandoms = get().fandoms.map((x) => (x.id === f.id ? f : x));
    set({ fandoms });
  },

  joinFandom: async (fandomId) => {
    const p = get().activePersona; if (!p) return;
    if (!p.fandomIds.includes(fandomId)) {
      const np = { ...p, fandomIds: [...p.fandomIds, fandomId] };
      await get().updatePersona(np);
    }
    const f = get().fandoms.find((x) => x.id === fandomId); if (!f) return;
    const nf = { ...f, joinedByPersona: { ...f.joinedByPersona, [p.id]: true } };
    await get().saveFandom(nf);
  },

  leaveFandom: async (fandomId) => {
    const p = get().activePersona; if (!p) return;
    const np = { ...p, fandomIds: p.fandomIds.filter((x) => x !== fandomId) };
    await get().updatePersona(np);
    const f = get().fandoms.find((x) => x.id === fandomId); if (!f) return;
    const jp = { ...f.joinedByPersona }; delete jp[p.id];
    await get().saveFandom({ ...f, joinedByPersona: jp });
  },

  addPost: async (post) => {
    await upsertRow('posts', post.id, post, {
      persona_id: post.personaId ?? null,
      author_id: post.authorId,
      created_at: post.createdAt,
    });
    // update caches
    if (post.parentId) {
      const list = get().threadsCache[post.parentId] || [];
      set({ threadsCache: { ...get().threadsCache, [post.parentId]: [...list, post] } });
      // bump parent reply count
    } else {
      set({ feed: [post, ...get().feed] });
    }
  },

  reloadFeed: async () => {
    const p = get().activePersona; if (!p) { set({ feed: [] }); return; }
    const posts = await loadPostsForPersona(p.id, 300);
    const feed = posts.filter((x: Post) => !x.parentId);
    set({ feed });
  },

  loadReplies: async (postId) => {
    // pull from cache if we have; else query
    if (get().threadsCache[postId]) return get().threadsCache[postId];
    const p = get().activePersona; if (!p) return [];
    const posts = await loadPostsForPersona(p.id, 500);
    const replies = posts.filter((x: Post) => x.parentId === postId);
    set({ threadsCache: { ...get().threadsCache, [postId]: replies } });
    return replies;
  },

  likePost: async (postId, characterId) => {
    // find in feed or cache
    const state = get();
    const bump = (p: Post): Post => {
      if (p.id !== postId) return p;
      const already = characterId ? p.likedByCharacterIds.includes(characterId) : false;
      if (already) return p;
      return {
        ...p,
        likes: p.likes + 1,
        likedByCharacterIds: characterId ? [...p.likedByCharacterIds, characterId] : p.likedByCharacterIds,
      };
    };
    const feed = state.feed.map(bump);
    const threadsCache: any = {};
    for (const k of Object.keys(state.threadsCache)) threadsCache[k] = state.threadsCache[k].map(bump);
    set({ feed, threadsCache });
    const post = feed.find((x) => x.id === postId) || Object.values(threadsCache).flat().find((x: any) => x.id === postId);
    if (post) await upsertRow('posts', post.id, post, { persona_id: (post as any).personaId ?? null, author_id: (post as any).authorId, created_at: (post as any).createdAt });
  },

  sendDM: async (characterId, text) => {
    const p = get().activePersona!;
    const dm: DM = {
      id: `dm_${uuid()}`, personaId: p.id, characterId,
      fromType: 'persona', text, createdAt: Date.now(),
      readByCharacter: undefined, readByUser: Date.now(),
    };
    await get().addDM(dm);
    return dm;
  },

  addDM: async (dm) => {
    await upsertRow('dms', dm.id, dm, {
      persona_id: dm.personaId, character_id: dm.characterId, created_at: dm.createdAt,
    });
    const key = `${dm.personaId}:${dm.characterId}`;
    const list = get().dmThreads[key] || [];
    set({ dmThreads: { ...get().dmThreads, [key]: [...list, dm] } });
  },

  loadDMThread: async (characterId) => {
    const p = get().activePersona; if (!p) return [];
    const key = `${p.id}:${characterId}`;
    const list = await loadDMsForThread(p.id, characterId);
    set({ dmThreads: { ...get().dmThreads, [key]: list } });
    return list;
  },

  markThreadRead: async (characterId) => {
    const p = get().activePersona; if (!p) return;
    const key = `${p.id}:${characterId}`;
    const list = (get().dmThreads[key] || []).map((d) =>
      d.fromType === 'character' && !d.readByUser ? { ...d, readByUser: Date.now() } : d
    );
    for (const d of list) await upsertRow('dms', d.id, d, { persona_id: d.personaId, character_id: d.characterId, created_at: d.createdAt });
    set({ dmThreads: { ...get().dmThreads, [key]: list } });
  },

  setCharacterTyping: (personaId, characterId, typing) => {
    // stored ephemerally in cache using a synthetic marker on a wrapper key
    const key = `typing:${personaId}:${characterId}`;
    (get() as any)[key] = typing;
    // trigger a light rerender by touching dmThreads
    set({ dmThreads: { ...get().dmThreads } });
  },

  spendEnergy: (amount = 1) => {
    const e = get().energy;
    if (e.current < amount || e.dailySpent + amount > e.dailyCap) return false;
    const next = { ...e, current: e.current - amount, dailySpent: e.dailySpent + amount };
    set({ energy: next });
    kvSet('energy', next);
    return true;
  },

  regenEnergy: () => {
    const e = get().energy;
    const now = Date.now();
    const elapsed = now - e.lastRegenAt;
    const ticks = Math.floor(elapsed / e.regenIntervalMs);
    if (ticks <= 0) return;
    const next = { ...e, current: Math.min(e.max, e.current + ticks), lastRegenAt: e.lastRegenAt + ticks * e.regenIntervalMs };
    set({ energy: next });
    kvSet('energy', next);
  },

  saveSettings: async (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    await kvSet('settings', next);
  },

  setProviderKey: async (id, apiKey) => {
    const settings = get().settings;
    const providers = { ...settings.providers, [id]: { ...settings.providers[id], apiKey } };
    await get().saveSettings({ providers });
  },
  setProviderEnabled: async (id, enabled) => {
    const settings = get().settings;
    const providers = { ...settings.providers, [id]: { ...settings.providers[id], enabled } };
    await get().saveSettings({ providers });
  },
  setProviderModel: async (id, model) => {
    const settings = get().settings;
    const providers = { ...settings.providers, [id]: { ...settings.providers[id], defaultModel: model } };
    await get().saveSettings({ providers });
  },
  setProviderBaseUrl: async (id, url) => {
    const settings = get().settings;
    const providers = { ...settings.providers, [id]: { ...settings.providers[id], baseUrl: url } };
    await get().saveSettings({ providers });
  },
  bumpProviderUsage: (id, n) => {
    const settings = get().settings;
    const p = settings.providers[id];
    const dailyResetAt = p.dailyResetAt < Date.now() ? nextMidnight() : p.dailyResetAt;
    const dailyCount = (p.dailyResetAt < Date.now() ? 0 : p.dailyCount) + n;
    const providers = { ...settings.providers, [id]: { ...p, dailyCount, dailyResetAt } };
    set({ settings: { ...settings, providers } });
    kvSet('settings', { ...settings, providers });
  },
  setProviderCooldown: (id, until) => {
    const settings = get().settings;
    const providers = { ...settings.providers, [id]: { ...settings.providers[id], cooldownUntil: until } };
    set({ settings: { ...settings, providers } });
    kvSet('settings', { ...settings, providers });
  },

  addCancelEvent: async (e) => {
    await upsertRow('cancel_events', e.id, e, {} as any);
    set({ cancelEvents: [e, ...get().cancelEvents] });
  },
  resolveCancelEvent: async (id, outcome) => {
    const ev = get().cancelEvents.find((x) => x.id === id); if (!ev) return;
    const nev = { ...ev, resolvedOutcome: outcome, endedAt: Date.now() };
    await upsertRow('cancel_events', id, nev);
    set({ cancelEvents: get().cancelEvents.map((x) => (x.id === id ? nev : x)) });
  },
}));

function nextMidnight() {
  const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime();
}
