import { useSyncExternalStore } from "react";

/**
 * A device-local switch for testing: drives cost nothing while it's on.
 * Off by default, and it never touches XP, levels or lesson keys.
 */
const KEY = "synapse.testMode";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

let enabled = typeof window === "undefined" ? false : read();

export function isTestMode() {
  return enabled;
}

export function subscribeTestMode(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setTestMode(next: boolean) {
  enabled = next;
  try {
    window.localStorage.setItem(KEY, next ? "1" : "0");
  } catch {
    /* still applies for this tab */
  }
  listeners.forEach((listener) => listener());
}

export function toggleTestMode() {
  setTestMode(!enabled);
}

export function useTestMode() {
  return useSyncExternalStore(subscribeTestMode, isTestMode, () => false);
}
