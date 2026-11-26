import { useSyncExternalStore } from "react";
import { UNITS } from "../data/units";
import { levelSpan, ramFor, xpFor, type RewardKind } from "./economy";
import { getSession, subscribeAuth } from "./auth";

export type Entry = {
  kind: RewardKind;
  score: number;
  total: number;
  firstTry: boolean;
  at: number;
};

type State = {
  version: 1;
  completed: Record<string, Entry>;
  ram: number;
};

export type Completion = {
  unitId: string;
  lessonId: string;
  kind: RewardKind;
  score: number;
  total: number;
  firstTry: boolean;
};

export type Award = { xp: number; ram: number; leveledUp: boolean };

export const REWARD_EVENT = "synapse:reward";

const VERSION = 1;
const listeners = new Set<() => void>();

const emptyState = (): State => ({ version: VERSION, completed: {}, ram: 0 });

function scopeForSession(): string | null {
  const session = getSession();
  if (!session) return null;
  return session.kind === "guest" ? "synapse.progress" : `synapse.progress:${session.accountId}`;
}

function load(key: string | null): State {
  if (!key) return emptyState();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as State;
    if (
      parsed?.version !== VERSION ||
      typeof parsed.ram !== "number" ||
      typeof parsed.completed !== "object" ||
      parsed.completed === null
    ) {
      return emptyState();
    }
    return parsed;
  } catch {
    return emptyState();
  }
}

function xpOf(state: State) {
  return Object.values(state.completed).reduce(
    (sum, entry) => sum + xpFor(entry.kind, entry.total > 0 && entry.score === entry.total),
    0,
  );
}

function derive(state: State) {
  const xp = xpOf(state);
  const span = levelSpan(xp);
  return {
    xp,
    ram: state.ram,
    level: span.level,
    levelStart: span.start,
    levelNext: span.next,
    levelProgress: span.progress,
    completed: state.completed,
    count: Object.keys(state.completed).length,
  };
}

let scope = scopeForSession();
let state: State = load(scope);
let snapshot = derive(state);

function emit() {
  snapshot = derive(state);
  listeners.forEach((listener) => listener());
}

function persist() {
  if (!scope) return;
  try {
    window.localStorage.setItem(scope, JSON.stringify(state));
  } catch {
    /* storage blocked: state survives in memory for this tab */
  }
}

function announce(award: Award) {
  window.dispatchEvent(new CustomEvent<Award>(REWARD_EVENT, { detail: award }));
}

// Signing in or out swaps which saved progress this device reads.
subscribeAuth(() => {
  const next = scopeForSession();
  if (next === scope) return;
  scope = next;
  state = load(scope);
  emit();
});

export function getSnapshot() {
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useProgress() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Awards XP and RAM once per lesson key. Repeats return null. */
export function completeLesson(input: Completion): Award | null {
  if (!scope) return null;

  const key = `${input.unitId}:${input.lessonId}`;
  if (state.completed[key]) return null;

  const entry: Entry = {
    kind: input.kind,
    score: input.score,
    total: input.total,
    firstTry: input.firstTry,
    at: Date.now(),
  };
  const perfect = entry.total > 0 && entry.score === entry.total;
  const xp = xpFor(entry.kind, perfect);
  const ram = ramFor(entry.kind, perfect);
  const leveledUp = levelSpan(xpOf(state) + xp).level > snapshot.level;

  state = { ...state, completed: { ...state.completed, [key]: entry }, ram: state.ram + ram };
  persist();
  emit();

  const award: Award = { xp, ram, leveledUp };
  announce(award);
  return award;
}

type StubTarget = Omit<Completion, "score" | "firstTry">;

/**
 * The lesson content lives with another team, so this walks the known units and
 * hands back the next uncredited lesson. Each key pays once, exactly like a
 * real lesson will.
 */
export function nextStubLesson(): StubTarget | null {
  for (const unit of UNITS) {
    if (unit.state === "capstone") {
      const key = `${unit.id}:capstone`;
      if (!state.completed[key]) {
        return { unitId: unit.id, lessonId: "capstone", kind: "capstone", total: 1 };
      }
      continue;
    }

    for (let index = 1; index <= unit.lessons; index += 1) {
      const key = `${unit.id}:lesson-${index}`;
      if (!state.completed[key]) {
        return { unitId: unit.id, lessonId: `lesson-${index}`, kind: "lesson", total: 3 };
      }
    }
  }
  return null;
}

export function completeNextStub() {
  const target = nextStubLesson();
  if (!target) return null;
  return completeLesson({ ...target, score: target.total, total: target.total, firstTry: true });
}
