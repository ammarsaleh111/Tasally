import crypto from 'crypto';
import { getAdminStore, saveAdminStore } from './serverData';

const HASH_ITERATIONS = 120000;
const HASH_KEY_LENGTH = 64;
const HASH_DIGEST = 'sha512';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 6; // 6 hours
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SecureAdmin#2026';

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST).toString('hex');
}

function pruneSessions(sessions = []) {
  const now = Date.now();
  return sessions.filter(session => new Date(session.expiresAt).getTime() > now);
}

export async function ensureAdminAccount() {
  const store = await getAdminStore();
  if (store.account?.username && store.account?.passwordHash && store.account?.salt) {
    return store.account;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(DEFAULT_ADMIN_PASSWORD, salt);
  const account = {
    username: DEFAULT_ADMIN_USERNAME,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  await saveAdminStore({ ...store, account });
  return account;
}

export async function verifyAdminCredentials(username, password) {
  const store = await getAdminStore();
  const account = store.account || (await ensureAdminAccount());
  if (!account) return false;

  const attemptedHash = hashPassword(password, account.salt);
  return account.username === username && attemptedHash === account.passwordHash;
}

export async function createAdminSession() {
  const store = await getAdminStore();
  const sessions = pruneSessions(store.sessions);
  const token = crypto.randomBytes(48).toString('hex');
  const now = Date.now();
  const expiresAt = new Date(now + SESSION_DURATION_MS).toISOString();

  sessions.push({ token, createdAt: new Date(now).toISOString(), expiresAt });
  await saveAdminStore({ ...store, sessions });
  return token;
}

export async function validateAdminSession(token) {
  if (!token) return false;
  const store = await getAdminStore();
  const sessions = pruneSessions(store.sessions);
  const isValid = sessions.some(session => session.token === token);

  if (sessions.length !== (store.sessions || []).length) {
    await saveAdminStore({ ...store, sessions });
  }

  return isValid;
}

export async function invalidateAdminSession(token) {
  if (!token) return;
  const store = await getAdminStore();
  const sessions = pruneSessions(store.sessions).filter(session => session.token !== token);
  await saveAdminStore({ ...store, sessions });
}

export function getDefaultAdminCredentials() {
  return {
    username: DEFAULT_ADMIN_USERNAME,
    password: DEFAULT_ADMIN_PASSWORD,
  };
}
