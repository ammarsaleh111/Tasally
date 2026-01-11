import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'server');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const ACTIVITY_FILE = path.join(DATA_DIR, 'activity.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

// In-memory cache to handle read-only filesystems (Vercel)
const memoryStore = {
  players: null,
  activity: null,
  admin: null
};

async function ensureDataFiles() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await Promise.all([
      ensureFile(PLAYERS_FILE, '[]'),
      ensureFile(ACTIVITY_FILE, '{"sessions":[]}'),
      ensureFile(ADMIN_FILE, '{"account":null,"sessions":[]}'),
    ]);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[serverData] Failed ensuring data files', error.message);
    }
  }
}

async function ensureFile(filePath, defaultContent) {
  try {
    await fs.access(filePath);
  } catch {
    try {
      await fs.writeFile(filePath, defaultContent, 'utf-8');
    } catch (e) {
      // Ignore write errors (read-only fs)
    }
  }
}

async function readJson(key, filePath, fallback) {
  if (memoryStore[key]) return memoryStore[key];

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw || fallback);
    memoryStore[key] = data;
    return data;
  } catch (error) {
    const data = JSON.parse(fallback);
    memoryStore[key] = data;
    return data;
  }
}

async function writeJson(key, filePath, data) {
  memoryStore[key] = data;
  
  try {
    await ensureDataFiles();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    // Silently fail on read-only systems
    if (process.env.NODE_ENV !== 'production') {
       console.warn(`[serverData] Failed to write ${key}`, error.message);
    }
  }
}

export async function getAllPlayers() {
  return readJson('players', PLAYERS_FILE, '[]');
}

export async function savePlayers(players) {
  return writeJson('players', PLAYERS_FILE, players);
}

export async function getActivityStore() {
  return readJson('activity', ACTIVITY_FILE, '{"sessions":[]}');
}

export async function saveActivityStore(store) {
  return writeJson('activity', ACTIVITY_FILE, store);
}

export async function getAdminStore() {
  return readJson('admin', ADMIN_FILE, '{"account":null,"sessions":[]}');
}

export async function saveAdminStore(store) {
  return writeJson('admin', ADMIN_FILE, store);
}
