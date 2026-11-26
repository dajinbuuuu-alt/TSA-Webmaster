import { setSession } from "./auth";

/**
 * Device-local accounts: real sign-up and sign-in, hashed with PBKDF2, stored
 * in this browser only. Server accounts (and cross-device sync) come later.
 */
export type Account = {
  id: string;
  email: string;
  handle: string;
  createdAt: number;
};

type StoredAccount = Account & { salt: string; hash: string };

const ACCOUNTS_KEY = "synapse.accounts.v1";
const ITERATIONS = 120_000;

export type AuthResult = { account: Account } | { error: string };

function readAll(): StoredAccount[] {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredAccount[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(accounts: StoredAccount[]) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function hashPassword(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return toBase64(bits);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function findAccount(accountId: string): Account | null {
  const stored = readAll().find((account) => account.id === accountId);
  if (!stored) return null;
  const { id, email, handle, createdAt } = stored;
  return { id, email, handle, createdAt };
}

export function accountCount() {
  return readAll().length;
}

export async function signUp(rawEmail: string, password: string): Promise<AuthResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "That email doesn't look right." };
  if (password.length < 8) return { error: "Use at least 8 characters." };

  const all = readAll();
  if (all.some((account) => account.email === email)) {
    return { error: "That email already has an account." };
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashPassword(password, salt);
  const account: StoredAccount = {
    id: crypto.randomUUID(),
    email,
    handle: email.split("@")[0].slice(0, 24),
    createdAt: Date.now(),
    salt: toBase64(salt.buffer as ArrayBuffer),
    hash,
  };

  writeAll([...all, account]);
  setSession({ kind: "account", accountId: account.id });

  const { id, handle, createdAt } = account;
  return { account: { id, email, handle, createdAt } };
}

export async function signIn(rawEmail: string, password: string): Promise<AuthResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !password) return { error: "Enter your email and password." };

  const stored = readAll().find((account) => account.email === email);
  if (!stored) return { error: "Email or password is wrong." };

  const salt = Uint8Array.from(atob(stored.salt), (char) => char.charCodeAt(0));
  const hash = await hashPassword(password, salt);
  if (hash !== stored.hash) return { error: "Email or password is wrong." };

  setSession({ kind: "account", accountId: stored.id });

  const { id, handle, createdAt } = stored;
  return { account: { id, email, handle, createdAt } };
}
