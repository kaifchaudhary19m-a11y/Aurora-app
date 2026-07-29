import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase() {
  db = await SQLite.openDatabaseAsync('aurora.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY,
      json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fandoms (
      id TEXT PRIMARY KEY,
      json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      persona_id TEXT,
      author_id TEXT,
      created_at INTEGER,
      json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_posts_persona ON posts(persona_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS dms (
      id TEXT PRIMARY KEY,
      persona_id TEXT,
      character_id TEXT,
      created_at INTEGER,
      json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_dms_thread ON dms(persona_id, character_id, created_at);

    CREATE TABLE IF NOT EXISTS cancel_events (
      id TEXT PRIMARY KEY,
      persona_id TEXT,
      json TEXT NOT NULL
    );
  `);
}

export function getDb() {
  if (!db) throw new Error('DB not initialised');
  return db;
}

export async function kvGet<T = any>(key: string): Promise<T | null> {
  const row = await getDb().getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', [key]);
  if (!row) return null;
  try { return JSON.parse(row.value) as T; } catch { return null; }
}

export async function kvSet(key: string, value: any) {
  await getDb().runAsync(
    'INSERT INTO kv(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
    [key, JSON.stringify(value)]
  );
}

export async function upsertRow(table: string, id: string, obj: any, extra: Record<string, any> = {}) {
  const cols = ['id', ...Object.keys(extra), 'json'];
  const placeholders = cols.map(() => '?').join(',');
  const values = [id, ...Object.values(extra), JSON.stringify(obj)];
  const updates = [...Object.keys(extra), 'json'].map((c) => `${c}=excluded.${c}`).join(',');
  await getDb().runAsync(
    `INSERT INTO ${table}(${cols.join(',')}) VALUES(${placeholders})
     ON CONFLICT(id) DO UPDATE SET ${updates}`,
    values as any
  );
}

export async function loadAll<T = any>(table: string): Promise<T[]> {
  const rows = await getDb().getAllAsync<{ json: string }>(`SELECT json FROM ${table}`);
  return rows.map((r) => JSON.parse(r.json) as T);
}

export async function loadPostsForPersona(personaId: string, limit = 200) {
  const rows = await getDb().getAllAsync<{ json: string }>(
    'SELECT json FROM posts WHERE persona_id = ? ORDER BY created_at DESC LIMIT ?',
    [personaId, limit]
  );
  return rows.map((r) => JSON.parse(r.json));
}

export async function loadDMsForThread(personaId: string, characterId: string) {
  const rows = await getDb().getAllAsync<{ json: string }>(
    'SELECT json FROM dms WHERE persona_id = ? AND character_id = ? ORDER BY created_at ASC',
    [personaId, characterId]
  );
  return rows.map((r) => JSON.parse(r.json));
}

export async function deleteFromTable(table: string, id: string) {
  await getDb().runAsync(`DELETE FROM ${table} WHERE id = ?`, [id]);
}
