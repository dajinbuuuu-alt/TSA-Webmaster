import { useSyncExternalStore } from "react";

const STORAGE_KEY = "synapse.guest";

export const GATE_EVENT = "synapse:gate";

export type GateDetail = {
  next?: () => void;
};

function readStoredGuest() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

let guest = typeof window === "undefined" ? false : readStoredGuest();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function isGuest() {
  return guest;
}

export function subscribeAuth(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Guest progress lives in this browser only, so the flag is persisted locally. */
export function continueAsGuest() {
  guest = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* storage can be blocked; session still works for this tab */
  }
  emit();
}

export function useGuest() {
  return useSyncExternalStore(subscribeAuth, isGuest, () => false);
}

/** Ask for an account or guest mode, then run the action the learner tried. */
export function requestAuth(next?: () => void) {
  window.dispatchEvent(
    new CustomEvent<GateDetail>(GATE_EVENT, { detail: { next } }),
  );
}
