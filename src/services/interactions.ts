import { v4 as uuid } from 'uuid';
import { Character, Persona, Post, DM, CancelEvent } from '../types';
import { useStore } from '../store/useStore';
import { generateReply, generateDM, generateAutopilotPost, generateCancelPost, updateRelationshipFromInteraction } from '../personality/engine';
import { upsertRow } from '../db/database';

// This module orchestrates side-effectful game logic:
// posting from the user, characters replying, DMs, likes, cancellation storms.

export async function createUserPost(text: string, fandomId?: string, parentId?: string, quoteId?: string) {
  const s = useStore.getState();
  const p = s.activePersona; if (!p) throw new Error('no persona');
  if (!s.spendEnergy(1)) throw new Error('out of energy');

  const auraDelta = scoreAura(text);
  const humourDelta = scoreHumour(text);
  const controversyDelta = scoreControversy(text);

  const post: Post = {
    id: `post_${uuid()}`,
    authorType: 'persona', authorId: p.id, personaId: p.id,
    text, fandomId, parentId, quoteId,
    createdAt: Date.now(),
    likes: 0, reposts: 0, replies: 0,
    auraDelta, humourDelta, controversyDelta,
    likedByCharacterIds: [],
  };
  await s.addPost(post);

  // apply persona stat changes
  const np: Persona = {
    ...p,
    aura: clamp(p.aura + auraDelta, 0, 999),
    humour: clamp(p.humour + humourDelta, 0, 999),
    controversy: clamp(p.controversy + controversyDelta, 0, 100),
  };
  await s.updatePersona(np);

  // trigger character reactions in background (fire & forget)
  reactToPostInBackground(post).catch(() => {});
  // possibly trigger a cancellation event
  maybeTriggerCancellation(np, post).catch(() => {});
  return post;
}

async function reactToPostInBackground(post: Post) {
  const s = useStore.getState();
  const p = s.activePersona!;
  const chars = s.characters;
  if (!chars.length) return;

  // Pick 2–5 characters to react, weighted by fandom overlap + affinity + drama love
  const candidates = chars
    .map((c) => ({ c, w: reactionWeight(c, p, post) }))
    .filter((x) => x.w > 0)
    .sort((a, b) => b.w - a.w)
    .slice(0, 8);

  const toReply = pickN(candidates, 2 + Math.floor(Math.random() * 3));
  const toLike = candidates.filter((x) => !toReply.includes(x)).slice(0, 3);

  for (const { c } of toLike) {
    await sleep(400 + Math.random() * 1200);
    await s.likePost(post.id, c.id);
  }

  for (const { c } of toReply) {
    await sleep(800 + Math.random() * 2500);
    try {
      const text = await generateReply(c, p, post, [post]);
      if (!text) continue;
      const auraDelta = 0, humourDelta = 0, controversyDelta = 0;
      const reply: Post = {
        id: `post_${uuid()}`,
        authorType: 'character', authorId: c.id, personaId: p.id,
        text, parentId: post.id,
        createdAt: Date.now(),
        likes: Math.floor(Math.random() * 20),
        reposts: 0, replies: 0,
        auraDelta, humourDelta, controversyDelta,
        likedByCharacterIds: [],
      };
      await s.addPost(reply);
      // update relationship
      updateRelationshipFromInteraction(c, p, `They posted: "${post.text}" — you replied: "${text}"`)
        .then(() => s.saveCharacter(c)).catch(() => {});
    } catch (e) {
      // provider might've all failed; skip silently
    }
  }
}

function reactionWeight(c: Character, p: Persona, post: Post): number {
  let w = 0.4;
  // fandom overlap
  const overlap = c.fandomIds.filter((f) => (post.fandomId ? f === post.fandomId : p.fandomIds.includes(f))).length;
  w += overlap * 0.5;
  // relationship affinity
  const r = c.relationships[p.id];
  if (r) {
    w += Math.abs(r.affinity) / 100;    // both love and hate → engagement
    w += r.drama / 200;
  } else {
    w += 0.15; // strangers curious sometimes
  }
  // controversial posts spike engagement
  if (post.controversyDelta > 3) w += 0.6;
  // extraverts talk more
  w += c.traits.extraversion * 0.3;
  return w;
}

export async function sendDMWithReply(characterId: string, text: string): Promise<void> {
  const s = useStore.getState();
  const p = s.activePersona!;
  const c = s.characters.find((x) => x.id === characterId); if (!c) return;
  if (!s.spendEnergy(1)) throw new Error('out of energy');

  await s.sendDM(characterId, text);

  // start typing indicator
  s.setCharacterTyping(p.id, c.id, true);

  await sleep(900 + Math.random() * 2000);

  // char "reads" the message
  const key = `${p.id}:${c.id}`;
  const thread = s.dmThreads[key] || [];
  const last = thread[thread.length - 1];
  if (last && last.fromType === 'persona' && !last.readByCharacter) {
    last.readByCharacter = Date.now();
    await upsertRow('dms', last.id, last, { persona_id: last.personaId, character_id: last.characterId, created_at: last.createdAt });
  }

  try {
    const history = thread.map((d) => ({ fromType: d.fromType, text: d.text }));
    const replyText = await generateDM(c, p, history, text);
    if (replyText) {
      const dm: DM = {
        id: `dm_${uuid()}`, personaId: p.id, characterId,
        fromType: 'character', text: replyText, createdAt: Date.now(),
      };
      await s.addDM(dm);
      updateRelationshipFromInteraction(c, p, `In DMs, they said: "${text}" — you replied: "${replyText}"`)
        .then(() => s.saveCharacter(c)).catch(() => {});
    }
  } catch {}
  finally {
    s.setCharacterTyping(p.id, c.id, false);
  }
}

export async function characterAutopilotTick() {
  const s = useStore.getState();
  if (!s.settings.autopilot) return;
  const p = s.activePersona; if (!p) return;
  const c = pickWeighted(s.characters, (x) => 0.5 + x.traits.extraversion);
  if (!c) return;
  try {
    const text = await generateAutopilotPost(c, p);
    if (!text) return;
    const post: Post = {
      id: `post_${uuid()}`,
      authorType: 'character', authorId: c.id, personaId: p.id,
      text,
      createdAt: Date.now(),
      likes: Math.floor(Math.random() * 40),
      reposts: 0, replies: 0,
      auraDelta: 0, humourDelta: 0, controversyDelta: 0,
      likedByCharacterIds: [],
    };
    await s.addPost(post);
  } catch {}
}

async function maybeTriggerCancellation(p: Persona, post: Post) {
  const s = useStore.getState();
  if (post.controversyDelta < 5) return;
  if (p.controversy < 60) return;
  if (Math.random() > 0.5) return;

  const reason = detectReason(post.text);
  const ev: CancelEvent = {
    id: `ce_${uuid()}`,
    personaId: p.id,
    triggerPostId: post.id,
    reason,
    startedAt: Date.now(),
    severity: Math.min(100, 40 + post.controversyDelta * 4),
    participantCharacterIds: [],
    followerLossPct: 0,
    auraDelta: 0,
  };
  await s.addCancelEvent(ev);

  // pile-on: 3–7 characters post about it
  const chars = s.characters.slice().sort(() => Math.random() - 0.5).slice(0, 4 + Math.floor(Math.random() * 3));
  for (const c of chars) {
    await sleep(1500 + Math.random() * 3000);
    try {
      const text = await generateCancelPost(c, p, post.text, reason);
      if (!text) continue;
      const cancelPost: Post = {
        id: `post_${uuid()}`,
        authorType: 'character', authorId: c.id, personaId: p.id,
        text,
        createdAt: Date.now(),
        likes: Math.floor(Math.random() * 200),
        reposts: Math.floor(Math.random() * 40),
        replies: 0,
        auraDelta: 0, humourDelta: 0, controversyDelta: 0,
        likedByCharacterIds: [],
        isCancelPost: true, cancelEventId: ev.id,
      };
      await s.addPost(cancelPost);
      ev.participantCharacterIds.push(c.id);
    } catch {}
  }

  // apply damage after the storm settles (10s later)
  setTimeout(async () => {
    const lossPct = Math.min(30, Math.floor(ev.severity / 4));
    const auraDelta = -Math.floor(ev.severity / 3);
    const now = useStore.getState();
    const persona = now.personas.find((x) => x.id === p.id);
    if (persona) {
      const followerLoss = Math.floor(persona.followers * (lossPct / 100));
      const np: Persona = { ...persona, followers: Math.max(0, persona.followers - followerLoss), aura: Math.max(0, persona.aura + auraDelta), controversy: Math.max(0, persona.controversy - 20) };
      await now.updatePersona(np);
      await now.resolveCancelEvent(ev.id, 'survived');
    }
  }, 10_000);
}

// --- scoring heuristics (kept simple; you can tune)
function scoreAura(t: string): number {
  let s = 0;
  if (/thank|kind|love|proud|beautiful|grateful/i.test(t)) s += 2;
  if (t.length > 180) s += 1;
  if (/lol|lmao/i.test(t)) s -= 1;
  return s;
}
function scoreHumour(t: string): number {
  let s = 0;
  if (/lol|lmao|😂|💀|kek|fr fr|no cap/i.test(t)) s += 2;
  if (/joke|funny|cursed/i.test(t)) s += 1;
  if (t.endsWith('.')) s -= 1;
  return s;
}
function scoreControversy(t: string): number {
  let s = 0;
  if (/hot take|unpopular|actually|imo/i.test(t)) s += 3;
  if (/[Aa]ll .{3,20} are/i.test(t)) s += 4;
  if (/never|always/i.test(t)) s += 1;
  if (/politic|religion|gun|abortion|crypto|nft/i.test(t)) s += 4;
  if (/!!/i.test(t)) s += 1;
  return s;
}
function detectReason(t: string): string {
  if (/crypto|nft/i.test(t)) return 'crypto shill vibes';
  if (/politic/i.test(t)) return 'political post';
  if (/hot take|unpopular/i.test(t)) return 'contrarian bait';
  return 'you said something and the algorithm loved it';
}

function pickN<T>(arr: T[], n: number) {
  const shuffled = arr.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function pickWeighted<T>(arr: T[], w: (t: T) => number): T | undefined {
  if (!arr.length) return undefined;
  const weights = arr.map(w);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) { r -= weights[i]; if (r <= 0) return arr[i]; }
  return arr[arr.length - 1];
}
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
