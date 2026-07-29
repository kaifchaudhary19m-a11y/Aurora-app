export type Provider = 'gemini' | 'groq' | 'openrouter' | 'cerebras' | 'mistral' | 'together' | 'ollama' | 'openai' | 'anthropic';

export interface ProviderConfig {
  id: Provider;
  label: string;
  apiKey?: string;
  baseUrl?: string;      // for ollama / custom
  enabled: boolean;
  cooldownUntil?: number;
  dailyCount: number;
  dailyResetAt: number;
  models: string[];
  defaultModel: string;
}

export interface Persona {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarColor: string;
  fandomIds: string[];
  followers: number;
  aura: number;
  humour: number;
  controversy: number;   // 0..100
  createdAt: number;
  active: boolean;
}

export interface Fandom {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  joinedByPersona: Record<string, boolean>;
  memberCount: number;
}

export interface Character {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarColor: string;
  fandomIds: string[];
  // personality
  traits: {
    openness: number;      // 0..1
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  archetype: string;       // e.g. "chaotic gremlin", "world-weary cynic"
  values: string[];        // things they care about
  quirks: string[];        // verbal tics, catchphrases
  taboos: string[];        // topics that will set them off
  humourStyle: string;     // "dry", "absurd", "mean", "wholesome"
  edgeLevel: number;       // 0..1  how spicy they can get
  // provider pinning
  providerId: Provider;
  model: string;
  // relationship state, per persona
  relationships: Record<string, Relationship>;
  createdAt: number;
}

export interface Relationship {
  affinity: number;    // -100..100
  trust: number;       // 0..100
  drama: number;       // 0..100
  interactions: number;
  lastInteractionAt: number;
  grudges: string[];   // short memory strings
  fondMemories: string[];
  status: 'stranger' | 'acquaintance' | 'follower' | 'friend' | 'bestie' | 'rival' | 'nemesis' | 'ex-friend';
}

export interface Post {
  id: string;
  authorType: 'persona' | 'character';
  authorId: string;
  personaId?: string;    // which persona's world this belongs to
  text: string;
  fandomId?: string;
  parentId?: string;     // reply target
  quoteId?: string;      // quote-post target
  createdAt: number;
  likes: number;
  reposts: number;
  replies: number;
  auraDelta: number;
  humourDelta: number;
  controversyDelta: number;
  likedByCharacterIds: string[];
  isCancelPost?: boolean;
  cancelEventId?: string;
}

export interface DM {
  id: string;
  personaId: string;
  characterId: string;
  fromType: 'persona' | 'character';
  text: string;
  createdAt: number;
  readByCharacter?: number;   // ts when the char "read" persona's msg
  readByUser?: number;
  typing?: boolean;
}

export interface Thread {
  personaId: string;
  characterId: string;
  lastMessageAt: number;
  unread: number;
  characterTyping?: boolean;
}

export interface CancelEvent {
  id: string;
  personaId: string;
  triggerPostId: string;
  reason: string;
  startedAt: number;
  endedAt?: number;
  severity: number;  // 0..100
  participantCharacterIds: string[];
  resolvedOutcome?: 'survived' | 'apologised' | 'doubled_down' | 'cancelled';
  followerLossPct: number;
  auraDelta: number;
}

export interface EnergyState {
  current: number;
  max: number;
  lastRegenAt: number;
  regenIntervalMs: number;
  dailySpent: number;
  dailyCap: number;
  dailyResetAt: number;
}

export interface Settings {
  activePersonaId?: string;
  contentRating: 'chill' | 'edgy' | 'unhinged';
  autopilot: boolean;         // characters post & interact on their own
  autopilotIntervalMs: number;
  providers: Record<Provider, ProviderConfig>;
  routerStrategy: 'round_robin' | 'least_used' | 'pinned_only';
  showReadReceipts: boolean;
  showTyping: boolean;
  monetizationUnlocked: boolean;   // always true, ships unlocked
  betaFeatures: boolean;
}
