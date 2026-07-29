import { Character, Persona, Relationship, Post } from '../types';
import { callLLM } from '../llm/router';
import {
  characterSystemPrompt, replyPrompt, dmPrompt, autoPostPrompt,
  cancelPostPrompt, personalityUpdateJsonPrompt,
} from './prompts';
import { useStore } from '../store/useStore';

function ensureRelationship(c: Character, personaId: string): Relationship {
  if (!c.relationships[personaId]) {
    c.relationships[personaId] = {
      affinity: 0, trust: 20, drama: 0, interactions: 0, lastInteractionAt: 0,
      grudges: [], fondMemories: [], status: 'stranger',
    };
  }
  return c.relationships[personaId];
}

export async function generateReply(c: Character, persona: Persona, post: Post, thread: Post[]): Promise<string> {
  const settings = useStore.getState().settings;
  const sys = characterSystemPrompt(c, settings.contentRating);
  const user = replyPrompt(persona, c, post, thread);
  const text = await callLLM({
    messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
    preferredProvider: c.providerId,
    preferredModel: c.model,
    temperature: 0.95,
    maxTokens: 220,
  });
  return cleanReply(text);
}

export async function generateDM(c: Character, persona: Persona, history: any[], userMsg: string): Promise<string> {
  const settings = useStore.getState().settings;
  const sys = characterSystemPrompt(c, settings.contentRating);
  const user = dmPrompt(persona, c, history, userMsg);
  const text = await callLLM({
    messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
    preferredProvider: c.providerId,
    preferredModel: c.model,
    temperature: 0.95,
    maxTokens: 280,
  });
  return cleanReply(text);
}

export async function generateAutopilotPost(c: Character, persona?: Persona): Promise<string> {
  const settings = useStore.getState().settings;
  const sys = characterSystemPrompt(c, settings.contentRating);
  const user = autoPostPrompt(c, persona);
  const text = await callLLM({
    messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
    preferredProvider: c.providerId,
    preferredModel: c.model,
    temperature: 1.0,
    maxTokens: 200,
  });
  return cleanReply(text);
}

export async function generateCancelPost(c: Character, persona: Persona, triggerText: string, reason: string): Promise<string> {
  const settings = useStore.getState().settings;
  const sys = characterSystemPrompt(c, settings.contentRating);
  const user = cancelPostPrompt(c, persona, triggerText, reason);
  const text = await callLLM({
    messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
    preferredProvider: c.providerId,
    preferredModel: c.model,
    temperature: 1.05,
    maxTokens: 220,
  });
  return cleanReply(text);
}

// Update the character's relationship state after an interaction (using a small LLM call).
// Falls back to a deterministic heuristic if the LLM refuses / fails.
export async function updateRelationshipFromInteraction(c: Character, persona: Persona, summary: string) {
  ensureRelationship(c, persona.id);
  const r = c.relationships[persona.id];
  r.interactions += 1;
  r.lastInteractionAt = Date.now();

  try {
    const raw = await callLLM({
      messages: [{ role: 'user', content: personalityUpdateJsonPrompt(persona, c, summary) }],
      preferredProvider: c.providerId,
      preferredModel: c.model,
      temperature: 0.5,
      maxTokens: 220,
      json: true,
    });
    const j = safeParse(raw);
    if (j) {
      r.affinity = clamp(r.affinity + (int(j.affinityDelta)), -100, 100);
      r.trust = clamp(r.trust + int(j.trustDelta), 0, 100);
      r.drama = clamp(r.drama + int(j.dramaDelta), 0, 100);
      if (j.newGrudge && String(j.newGrudge).trim()) r.grudges = [...r.grudges, String(j.newGrudge).slice(0, 140)].slice(-8);
      if (j.newFondMemory && String(j.newFondMemory).trim()) r.fondMemories = [...r.fondMemories, String(j.newFondMemory).slice(0, 140)].slice(-8);
      if (j.statusChange && j.statusChange !== 'null') r.status = j.statusChange;
    }
  } catch {
    // heuristic fallback
    const spice = /you're|lol|lmao|based|fr/i.test(summary) ? 3 : 0;
    r.affinity = clamp(r.affinity + spice, -100, 100);
  }

  // status derivation if the model didn't set it
  if (r.affinity <= -60) r.status = 'nemesis';
  else if (r.affinity <= -30) r.status = 'rival';
  else if (r.affinity >= 70) r.status = 'bestie';
  else if (r.affinity >= 30) r.status = 'friend';
  else if (r.interactions > 3) r.status = 'follower';
  else if (r.interactions > 0) r.status = 'acquaintance';
}

function cleanReply(t: string): string {
  return t
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/^\*.+?\*\s*/g, '')
    .trim()
    .slice(0, 500);
}
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function int(v: any) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : 0; }
function safeParse(s: string) {
  try { return JSON.parse(s); } catch {}
  const m = s.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}
