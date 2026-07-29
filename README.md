# Aurora — a solo social simulation for Android

Aurora is a **downloadable, offline-first social media simulator** where every follower is a real LLM-driven character with their own personality, opinions, memories, and grudges. Post, DM, join fandoms, chase aura & humour points, survive cancel storms — all in a private, single-player world that lives on your phone.

Inspired by the "sims but social media" genre. **No paywalls, no ads, no accounts** — this ships with every gate wide open because it's yours.

---

## ✨ What's inside

- **Feed** — X/Twitter-style timeline of your posts + character replies + autopilot posts
- **Personas** — create multiple, switch between them; each has their own world
- **Fandoms** — 10 seeded communities (Music, Film Bros, Tech Weirdos, Book Girlies, Gym Freaks, Art Hoes, Gamers, Fashion, Politics, Shitposters)
- **DMs** — 1:1 chats with read receipts + typing indicators
- **Energy system** — 200 max, regenerates 1 per 5 min (defaults deliberately generous for solo use; tweak in `store/useStore.ts`)
- **Aura / Humour / Controversy** — every post moves these; controversy > 60 can trigger cancel storms
- **Cancel storms** — 4–7 characters pile on with real LLM-generated cancel posts; follower loss + aura hit resolve automatically
- **15 hand-crafted seed characters** with distinct archetypes, quirks, taboos, values, edge levels, and pinned model providers so their *voices* differ
- **Relationship state** — every character remembers you: affinity, trust, drama, grudges, fond memories, status (stranger → nemesis)
- **Personality growth** — after every interaction, an LLM state-tracker updates their relationship with you (with a heuristic fallback)
- **Local SQLite persistence** — everything survives restarts

---

## 🔌 The LLM multi-provider router

Aurora ships with **9 configurable providers**. Fill in as few or as many as you like — the router auto-rotates and fails over on rate limits. Recommended: paste 2–3 **free-tier** keys and you're set forever.

| Provider | Free tier? | Where to get a key |
|---|---|---|
| Google Gemini | ✅ generous | https://aistudio.google.com/apikey |
| Groq | ✅ fast | https://console.groq.com/keys |
| Cerebras | ✅ fastest inference | https://cloud.cerebras.ai |
| OpenRouter | ✅ has `:free` models | https://openrouter.ai/keys |
| Mistral La Plateforme | ✅ | https://console.mistral.ai/api-keys |
| Together AI | ✅ some free endpoints + trial credit | https://api.together.ai/settings/api-keys |
| Ollama (local) | ✅ unlimited, runs on your PC | https://ollama.com |
| OpenAI | 💳 paid | https://platform.openai.com/api-keys |
| Anthropic Claude | 💳 paid | https://console.anthropic.com/settings/keys |

Router strategies:
- **round_robin** (default): spreads load evenly
- **least_used**: prefers the provider with the fewest calls today
- **pinned_only**: strict — use only the character's assigned provider

Each character is **pre-pinned** to a preferred provider so different followers naturally sound different (Gemini-Jaz doesn't talk like Groq-Marcus).

There's a **"Test all providers"** button in Settings that pings every configured key and shows green/red.

---

## 📱 How to run on Android

### Option A — Expo Go (no compile step, easiest)

1. Install **Node 18+** on your computer.
2. Install **Expo Go** on your Android phone from Play Store.
3. In this folder:
   ```
   npm install
   npx expo start
   ```
4. Scan the QR code with Expo Go. Aurora loads on your phone instantly.

### Option B — Real installable APK

1. `npm install -g eas-cli`
2. `eas login` (free Expo account)
3. `eas build -p android --profile preview`
4. Wait ~10 minutes. EAS emails you an APK download link. Install it directly.

You can then delete the project. The APK lives on your phone forever.

### Option C — Ollama for fully offline / unlimited / uncensored

1. On your PC: install [Ollama](https://ollama.com), run `ollama pull llama3.1` (or `dolphin-mistral` for zero-filter).
2. On the same Wi-Fi network, find your PC's LAN IP (e.g. `192.168.1.42`).
3. In Aurora → Settings → Ollama → paste `http://192.168.1.42:11434`, enable it.
4. All character brains now run locally. Zero API cost. No rate limits.

---

## ⚙️ Common tweaks

- **Energy cap / regen speed**: `src/store/useStore.ts` → `DEFAULT_ENERGY`
- **Autopilot post frequency**: Settings → autopilot toggle, and `autopilotIntervalMs` in `useStore.ts`
- **Content rating** (chill / edgy / unhinged): Settings screen → world
- **Add characters**: append to `src/personality/seed.ts` → `SEEDS`
- **Add fandoms**: append to `SEED_FANDOMS` in the same file

---

## 🗂 Project structure

```
App.tsx                     — root, hydrates store, starts loops
src/
  navigation/               — tabs + stacks
  screens/                  — Feed, Compose, Thread, Fandoms, DMs, Profile, Settings, etc.
  components/               — Avatar, PostCard, EnergyBar
  store/useStore.ts         — Zustand store, all game state + persistence
  db/database.ts            — expo-sqlite wrapper (kv + tables)
  llm/
    providers.ts            — 9 default provider configs
    router.ts               — rotation, failover, per-provider protocol adapters
  personality/
    seed.ts                 — 15 seed characters + 10 fandoms
    prompts.ts              — system prompts, reply prompts, DM prompts, cancel prompts
    engine.ts               — orchestrates generation + relationship-state updates
  services/
    interactions.ts         — user post → replies → likes → maybe-cancel pipeline
    backgroundLoops.ts      — energy regen + character autopilot ticks
  types/index.ts            — every domain type
  theme/theme.ts            — colors
```

---

## 🎛 Notes on the design

- **No yes-men.** Every character's system prompt explicitly forbids sycophancy and demands opinionated, in-character responses. Traits (Big-Five), quirks, taboos, and edge levels are injected on every call.
- **Room for growth.** Relationships mutate after every interaction using a small LLM JSON call (with a heuristic fallback). Grudges and fond memories accumulate and get re-injected into future prompts, so characters *actually* remember what happened.
- **Different voices from different models.** Because each character is pinned to a different provider/model, their linguistic textures are genuinely different, not just prompt-different.
- **Solo-friendly.** No login, no server, no cloud sync (by design — your world is yours). Everything is stored in a local SQLite database (`aurora.db`).

Have fun in the world.
