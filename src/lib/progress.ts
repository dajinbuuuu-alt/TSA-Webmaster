import { useSyncExternalStore } from "react";
import { UNITS, type Tier } from "../data/units";
import {
  COSMETICS,
  cosmeticById,
  cosmeticsFor,
  dupeRefundFor,
  ECONOMY,
  TIER_ORDER,
  levelSpan,
  ramFor,
  rollTier,
  xpFor,
  type Cosmetic,
  type CosmeticSlot,
  type RewardKind,
} from "./economy";
import { getSession, subscribeAuth } from "./auth";
import { isTestMode, subscribeTestMode } from "./testmode";
import { showToast } from "./toast";

export type Entry = {
  kind: RewardKind;
  score: number;
  total: number;
  firstTry: boolean;
  at: number;
};

export type DriveRecord = {
  id: string;
  tier: Tier;
  taps: boolean[];
  hits: number;
  itemId: string;
  duplicate: boolean;
  refund: number;
  at: number;
};

export type Loadout = Record<CosmeticSlot, string | null>;

/** Player-chosen colours for the three recolourable slots. */
export type TintSlot = "cursor" | "trail" | "background";

export type Tints = Partial<Record<TintSlot, string>>;

type State = {
  version: 1;
  completed: Record<string, Entry>;
  ram: number;
  /** Owned cosmetics: item id → when it was won. */
  rewards: Record<string, number>;
  /** Newest first, capped so storage can't grow without bound. */
  drives: DriveRecord[];
  /** One equipped item per slot. */
  loadout: Loadout;
  /** Colour overrides for cursor, trail and background. */
  tints: Tints;
};

const emptyLoadout = (): Loadout => ({
  cursor: null,
  trail: null,
  background: null,
  accent: null,
  flair: null,
  pet: null,
});

/** Test mode hands you the whole catalogue: the vault, cards and equip all read this. */
function ownedFor(state: State) {
  if (!isTestMode()) return state.rewards;
  const all: Record<string, number> = {};
  COSMETICS.forEach((item) => {
    // A truthy stamp, because every "owned?" check in the app is Boolean(...).
    all[item.id] = 1;
  });
  return { ...all, ...state.rewards };
}

export type Completion = {
  unitId: string;
  lessonId: string;
  kind: RewardKind;
  score: number;
  total: number;
  firstTry: boolean;
};

export type Award = { xp: number; ram: number; leveledUp: boolean };

export type DriveResult = {
  taps: boolean[];
  hits: number;
  tier: Tier;
  item: Cosmetic;
  duplicate: boolean;
  refund: number;
  ramAfter: number;
};

export type PurchaseOutcome =
  | { ok: true; result: DriveResult }
  | { ok: false; error: string; shortfall: number };

export const REWARD_EVENT = "synapse:reward";

const VERSION = 1;
const DRIVE_HISTORY = 40;
const listeners = new Set<() => void>();

const emptyState = (): State => ({
  version: VERSION,
  completed: {},
  ram: 0,
  rewards: {},
  drives: [],
  loadout: emptyLoadout(),
  tints: {},
});

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
    const parsed = JSON.parse(raw) as Partial<State>;
    if (
      parsed?.version !== VERSION ||
      typeof parsed.ram !== "number" ||
      typeof parsed.completed !== "object" ||
      parsed.completed === null
    ) {
      return emptyState();
    }
    // Saved progress from before drives existed still loads.
    return {
      version: VERSION,
      completed: parsed.completed,
      ram: parsed.ram,
      rewards: parsed.rewards ?? {},
      drives: parsed.drives ?? [],
      loadout: { ...emptyLoadout(), ...(parsed.loadout ?? {}) },
      tints: parsed.tints ?? {},
    };
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
  const rewards = ownedFor(state);
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
    rewards,
    ownedCount: Object.keys(rewards).length,
    drives: state.drives,
    loadout: state.loadout,
    tints: state.tints,
  };
}

let scope = scopeForSession();
let state: State = load(scope);

/**
 * Test mode lets you wear things you never won. When it goes off — or a page
 * loads with it off — those slots are emptied so nothing stays worn for free.
 */
function dropUnowned(): boolean {
  const loadout = { ...state.loadout };
  let dropped = false;
  (Object.keys(loadout) as CosmeticSlot[]).forEach((slot) => {
    const itemId = loadout[slot];
    if (itemId && !state.rewards[itemId]) {
      loadout[slot] = null;
      dropped = true;
    }
  });
  if (dropped) {
    state = { ...state, loadout };
    persist();
  }
  return dropped;
}

if (!isTestMode()) dropUnowned();

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
  if (!isTestMode()) dropUnowned();
  emit();
});

// Turning test mode on or off changes which cosmetics count as owned — and
// turning it off takes back anything that was only wearable because of it.
let testModeWasOn = isTestMode();
subscribeTestMode(() => {
  const on = isTestMode();
  if (testModeWasOn && !on) dropUnowned();
  testModeWasOn = on;
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

function pickCosmetic(tier: Tier): Cosmetic {
  const pool = cosmeticsFor(tier);
  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of pool) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return pool[pool.length - 1];
}

/**
 * Buy a drive: 150 RAM leaves immediately, four taps are rolled, and the win is
 * settled in the same write so closing the screen mid-roll can't lose a reward.
 */
export function buyDrive(): PurchaseOutcome {
  const { cost, taps } = ECONOMY.drive;
  const free = isTestMode();

  if (!scope) {
    return { ok: false, error: "Pick an account or guest mode before buying a drive.", shortfall: cost };
  }
  if (!free && state.ram < cost) {
    const shortfall = cost - state.ram;
    return {
      ok: false,
      error: `A drive costs ${cost} RAM — you have ${state.ram}. Earn ${shortfall} more RAM in a lesson.`,
      shortfall,
    };
  }

  // The star is drawn from the published table first, then the taps are laid
  // out to show it: 1★ is four holds, 5★ is four hits, in random positions.
  const tier = rollTier();
  const hits = TIER_ORDER.indexOf(tier);
  const results = Array.from({ length: taps }, (_, index) => index < hits);
  for (let index = results.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [results[index], results[swap]] = [results[swap], results[index]];
  }
  const item = pickCosmetic(tier);
  const duplicate = Boolean(state.rewards[item.id]);
  const refund = duplicate ? dupeRefundFor(tier) : 0;
  const ramAfter = free ? state.ram : state.ram - cost + refund;

  const record: DriveRecord = {
    id: `drive-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
    tier,
    taps: results,
    hits,
    itemId: item.id,
    duplicate,
    refund,
    at: Date.now(),
  };

  state = {
    ...state,
    ram: ramAfter,
    rewards: duplicate ? state.rewards : { ...state.rewards, [item.id]: Date.now() },
    drives: [record, ...state.drives].slice(0, DRIVE_HISTORY),
  };
  persist();
  emit();

  showToast(free ? "Test mode · drive opened, no RAM charged" : `−${cost} RAM · drive opened`, "spend");
  return { ok: true, result: { taps: results, hits, tier, item, duplicate, refund, ramAfter } };
}

/** Wear an owned cosmetic. Themes fill several slots at once. */
export function equipItem(itemId: string): boolean {
  if (!scope) return false;
  const item = cosmeticById(itemId);
  if (!item || (!isTestMode() && !state.rewards[item.id])) return false;

  const loadout = { ...state.loadout };
  item.slots.forEach((slot) => {
    loadout[slot] = item.id;
  });

  state = { ...state, loadout };
  persist();
  emit();
  showToast(`Equipped ${item.name}`, "gain");
  return true;
}

export function unequipSlot(slot: CosmeticSlot) {
  if (!scope || !state.loadout[slot]) return;
  state = { ...state, loadout: { ...state.loadout, [slot]: null } };
  persist();
  emit();
}

/** Recolour the equipped cursor, trail or background. */
export function setTint(slot: TintSlot, color: string) {
  if (!scope) return;
  if (!/^#[0-9a-f]{6}$/i.test(color)) return;
  state = { ...state, tints: { ...state.tints, [slot]: color.toLowerCase() } };
  persist();
  emit();
}

export function resetTint(slot: TintSlot) {
  if (!scope || state.tints[slot] === undefined) return;
  const tints = { ...state.tints };
  delete tints[slot];
  state = { ...state, tints };
  persist();
  emit();
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
