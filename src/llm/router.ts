import { Provider, ProviderConfig } from '../types';
import { useStore } from '../store/useStore';

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string; }

export interface CallOptions {
  messages: ChatMessage[];
  preferredProvider?: Provider;
  preferredModel?: string;
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
}

const COOLDOWN_MS = 3 * 60 * 1000;

export async function callLLM(opts: CallOptions): Promise<string> {
  const settings = useStore.getState().settings;
  const order = buildProviderOrder(settings.providers, opts.preferredProvider, settings.routerStrategy);

  let lastErr: any = null;
  for (const pid of order) {
    const cfg = settings.providers[pid];
    if (!cfg.enabled) continue;
    if (pid !== 'ollama' && !cfg.apiKey) continue;
    if (cfg.cooldownUntil && cfg.cooldownUntil > Date.now()) continue;

    const model = opts.preferredModel && cfg.models.includes(opts.preferredModel) ? opts.preferredModel : cfg.defaultModel;

    try {
      const text = await callProvider(cfg, model, opts);
      useStore.getState().bumpProviderUsage(pid, 1);
      return text;
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message || e);
      const isRate = /429|rate|quota|exceed/i.test(msg);
      useStore.getState().setProviderCooldown(pid, Date.now() + (isRate ? COOLDOWN_MS : 30_000));
      continue;
    }
  }
  throw new Error(`All providers failed. Last error: ${lastErr?.message ?? lastErr}`);
}

function buildProviderOrder(providers: Record<Provider, ProviderConfig>, preferred: Provider | undefined, strategy: string): Provider[] {
  const enabled = (Object.values(providers) as ProviderConfig[]).filter((p) => p.enabled && (p.id === 'ollama' || p.apiKey));
  const rest = enabled.filter((p) => p.id !== preferred);

  if (strategy === 'pinned_only' && preferred) return preferred ? [preferred] : [];

  const sortByLeastUsed = (arr: ProviderConfig[]) => [...arr].sort((a, b) => a.dailyCount - b.dailyCount);
  const ordered = strategy === 'least_used' ? sortByLeastUsed(rest) : rest;

  const list: Provider[] = [];
  if (preferred && providers[preferred]?.enabled) list.push(preferred);
  for (const p of ordered) list.push(p.id);
  return list;
}

async function callProvider(cfg: ProviderConfig, model: string, opts: CallOptions): Promise<string> {
  const { messages, maxTokens = 320, temperature = 0.95, json } = opts;

  switch (cfg.id) {
    case 'gemini': return callGemini(cfg, model, messages, maxTokens, temperature, json);
    case 'anthropic': return callAnthropic(cfg, model, messages, maxTokens, temperature);
    // Every other provider we ship speaks OpenAI-compatible chat/completions
    default: return callOpenAICompatible(cfg, model, messages, maxTokens, temperature, json);
  }
}

async function callOpenAICompatible(cfg: ProviderConfig, model: string, messages: ChatMessage[], maxTokens: number, temperature: number, json?: boolean) {
  const url = `${cfg.baseUrl!.replace(/\/$/, '')}/chat/completions`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cfg.apiKey) headers['Authorization'] = `Bearer ${cfg.apiKey}`;
  if (cfg.id === 'openrouter') {
    headers['HTTP-Referer'] = 'https://aurora.local';
    headers['X-Title'] = 'Aurora Social Sim';
  }
  const body: any = { model, messages, max_tokens: maxTokens, temperature };
  if (json) body.response_format = { type: 'json_object' };
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${cfg.id} ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content?.trim() ?? '';
}

async function callGemini(cfg: ProviderConfig, model: string, messages: ChatMessage[], maxTokens: number, temperature: number, json?: boolean) {
  const sys = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const contents = messages.filter((m) => m.role !== 'system').map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const url = `${cfg.baseUrl}/models/${model}:generateContent?key=${cfg.apiKey}`;
  const body: any = {
    contents,
    systemInstruction: sys ? { parts: [{ text: sys }] } : undefined,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: json ? 'application/json' : 'text/plain',
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
}

async function callAnthropic(cfg: ProviderConfig, model: string, messages: ChatMessage[], maxTokens: number, temperature: number) {
  const sys = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const rest = messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content }));
  const res = await fetch(`${cfg.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, temperature, system: sys, messages: rest }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.content?.[0]?.text ?? '';
}

// --- health check used by "Test all providers" button
export async function pingProvider(cfg: ProviderConfig): Promise<{ ok: boolean; msg: string }> {
  try {
    const out = await callProvider(cfg, cfg.defaultModel, {
      messages: [
        { role: 'system', content: 'reply with exactly the word: ok' },
        { role: 'user', content: 'ping' },
      ],
      maxTokens: 8,
      temperature: 0,
    });
    return { ok: /ok/i.test(out), msg: out.slice(0, 80) || '(empty)' };
  } catch (e: any) {
    return { ok: false, msg: String(e?.message || e).slice(0, 160) };
  }
}
