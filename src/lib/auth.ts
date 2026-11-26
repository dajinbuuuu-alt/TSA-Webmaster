import { useSyncExternalStore } from "react";

/**
 * Who is learning right now: a signed-in account, a guest on this device, or
 * nobody yet. Accounts themselves live in `accounts.ts`.
 */
export type Session =
  | { kind: "guest" }
  | { kind: "account"; accountId: string }
  | null;

export const GATE_EVENT = "synapse:gate";

export type GateDetail = {
  next?: () => void;
};

const SESSION_KEY = "synapse.session";
const listeners = new Set<() => void>();

function readStoredSession(): Session {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (parsed?.kind === "guest") return { kind: "guest" };
    if (parsed?.kind === "account" && typeof parsed.accountId === "string") {
      return { kind: "account", accountId: parsed.accountId };
    }
  } catch {
    /* blocked storage: start signed out */
  }
  return null;
}

let session: Session = typeof window === "undefined" ? null : readStoredSession();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getSession(): Session {
  return session;
}

export function setSession(next: Session) {
  session = next;
  try {
    if (next) window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* session still works for this tab */
  }
  emit();
}

export function subscribeAuth(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isGuest() {
  return session?.kind === "guest";
}

export function isSignedIn() {
  return session?.kind === "account";
}

export function continueAsGuest() {
  setSession({ kind: "guest" });
}

export function signOut() {
  setSession(null);
}

export function useSession() {
  return useSyncExternalStore(subscribeAuth, getSession, () => null);
}

export function useGuest() {
  return useSession()?.kind === "guest";
}

/** Ask for an account or guest mode, then run the action the learner tried. */
export function requestAuth(next?: () => void) {
  window.dispatchEvent(new CustomEvent<GateDetail>(GATE_EVENT, { detail: { next } }));
}
