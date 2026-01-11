import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'server');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const ACTIVITY_FILE = path.join(DATA_DIR, 'activity.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

async function ensureDataFiles() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await Promise.all([
      ensureFile(PLAYERS_FILE, '[]'),
      ensureFile(ACTIVITY_FILE, '{"sessions":[]}'),
      ensureFile(ADMIN_FILE, '{"account":null,"sessions":[]}'),
    ]);
  } catch (error) {
    console.error('[serverData] Failed ensuring data files', error);
  }
}

async function ensureFile(filePath, defaultContent) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, defaultContent, 'utf-8');
  }
}

async function readJson(filePath, fallback) {
  await ensureDataFiles();
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw || fallback);
  } catch (error) {
    console.error(`[serverData] Failed to read ${filePath}`, error);
    return JSON.parse(fallback);
  }
}

async function writeJson(filePath, data) {
  await ensureDataFiles();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getAllPlayers() {
  return readJson(PLAYERS_FILE, '[]');
}

export async function savePlayers(players) {
  return writeJson(PLAYERS_FILE, players);
}

export async function getActivityStore() {
  return readJson(ACTIVITY_FILE, '{"sessions":[]}');
}

export async function saveActivityStore(store) {
  return writeJson(ACTIVITY_FILE, store);
}

export async function getAdminStore() {
  return readJson(ADMIN_FILE, '{"account":null,"sessions":[]}');
}

export async function saveAdminStore(store) {
  return writeJson(ADMIN_FILE, store);
}
