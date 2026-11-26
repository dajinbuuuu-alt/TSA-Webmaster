import type { Tier } from "../data/units";

export type RewardKind = "lesson" | "test" | "capstone";
export type CosmeticKind = "cursor" | "trail" | "background" | "accent" | "flair" | "theme";

/** The five things you can wear at once. */
export type CosmeticSlot = "cursor" | "trail" | "background" | "accent" | "flair";

export const SLOT_ORDER: CosmeticSlot[] = ["cursor", "trail", "background", "accent", "flair"];

export const SLOT_LABEL: Record<CosmeticSlot, string> = {
  cursor: "Cursor",
  trail: "Trail",
  background: "Background",
  accent: "Accent",
  flair: "Flair",
};

export type Cosmetic = {
  id: string;
  name: string;
  detail: string;
  kind: CosmeticKind;
  tier: Tier;
  /** Share of its own tier's pool. */
  weight: number;
  /** Which loadout slots this item fills when equipped. */
  slots: CosmeticSlot[];
};

/**
 * Every number the economy uses. Rebalancing means editing this file only.
 */
export const ECONOMY = {
  rewards: {
    lesson: { xp: 50, ram: 10 },
    test: { xp: 150, ram: 30 },
    capstone: { xp: 500, ram: 100 },
  },
  perfectBonus: {
    lesson: { xp: 25, ram: 5 },
    test: { xp: 75, ram: 15 },
    capstone: { xp: 0, ram: 0 },
  },
  levels: [0, 250, 600, 1100, 1750, 2600, 3700, 5100, 6800, 9000],
  drive: { cost: 150, taps: 4, tapChance: 0.5 },
  dupeRefund: { bronze: 30, rose: 60, gold: 120, diamond: 250 },
} as const;

export const TIER_ORDER: Tier[] = ["bronze", "rose", "gold", "diamond"];

/** The nineteen cosmetics a drive can drop. Weights are percents within a tier. */
export const COSMETICS: Cosmetic[] = [
  { id: "bronze.hairline", name: "Hairline", detail: "1px crosshair cursor", kind: "cursor", tier: "bronze", weight: 30, slots: ["cursor"] },
  { id: "bronze.block", name: "Block", detail: "Terminal block that inverts over text", kind: "cursor", tier: "bronze", weight: 25, slots: ["cursor"] },
  { id: "bronze.dot", name: "Dot", detail: "4px signal dot", kind: "cursor", tier: "bronze", weight: 20, slots: ["cursor"] },
  { id: "bronze.accent-bronze", name: "Bronze accent", detail: "Bronze profile accent", kind: "accent", tier: "bronze", weight: 15, slots: ["accent"] },
  { id: "bronze.accent-rose", name: "Rose accent", detail: "Rose gold profile accent", kind: "accent", tier: "bronze", weight: 10, slots: ["accent"] },

  { id: "rose.comet", name: "Comet", detail: "Fading dot trail", kind: "trail", tier: "rose", weight: 30, slots: ["trail"] },
  { id: "rose.dust", name: "Dust", detail: "Fine particle trail", kind: "trail", tier: "rose", weight: 25, slots: ["trail"] },
  { id: "rose.accent-cyan", name: "Cyan accent", detail: "Signal cyan gradient accent", kind: "accent", tier: "rose", weight: 20, slots: ["accent"] },
  { id: "rose.pulse", name: "Pulse", detail: "Dot with a breathing ring", kind: "cursor", tier: "rose", weight: 15, slots: ["cursor"] },
  { id: "rose.accent-violet", name: "Violet accent", detail: "Brand violet gradient accent", kind: "accent", tier: "rose", weight: 10, slots: ["accent"] },

  { id: "gold.matrix", name: "Matrix", detail: "Glyph-rain trail", kind: "trail", tier: "gold", weight: 30, slots: ["trail"] },
  { id: "gold.circuit", name: "Circuit", detail: "Faint trace lines behind the hero", kind: "background", tier: "gold", weight: 25, slots: ["background"] },
  { id: "gold.orbit", name: "Orbit", detail: "Slow rotating rings", kind: "background", tier: "gold", weight: 20, slots: ["background"] },
  { id: "gold.glyph", name: "Glyph", detail: "Hex characters that fade", kind: "trail", tier: "gold", weight: 15, slots: ["trail"] },
  { id: "gold.beam", name: "Beam", detail: "Cyan beam that stretches on click", kind: "cursor", tier: "gold", weight: 10, slots: ["cursor"] },

  { id: "diamond.event-horizon", name: "Event Horizon", detail: "Theme: background, ring and cursor", kind: "theme", tier: "diamond", weight: 40, slots: ["background", "cursor", "flair"] },
  { id: "diamond.signal", name: "Signal", detail: "Theme: waveform background plus trail", kind: "theme", tier: "diamond", weight: 30, slots: ["background", "trail"] },
  { id: "diamond.particle-frame", name: "Particle Frame", detail: "Profile border that drifts", kind: "flair", tier: "diamond", weight: 20, slots: ["flair"] },
  { id: "diamond.spectrum-ring", name: "Spectrum Ring", detail: "Animated gradient around your level", kind: "flair", tier: "diamond", weight: 10, slots: ["flair"] },
];

/** A drive starts Bronze and moves up one tier per successful tap. */
export function tierForHits(hits: number): Tier {
  const { taps } = ECONOMY.drive;
  if (hits >= taps) return "diamond";
  if (hits >= taps - 1) return "gold";
  if (hits >= taps - 2) return "rose";
  return "bronze";
}

function binomial(trials: number, successes: number, chance: number) {
  let coefficient = 1;
  for (let index = 0; index < successes; index += 1) {
    coefficient = (coefficient * (trials - index)) / (index + 1);
  }
  return coefficient * chance ** successes * (1 - chance) ** (trials - successes);
}

/** Odds of each final tier, derived from the tap count and tap chance above. */
export function tierChances(): Record<Tier, number> {
  const { taps, tapChance } = ECONOMY.drive;
  const odds: Record<Tier, number> = { bronze: 0, rose: 0, gold: 0, diamond: 0 };
  for (let hits = 0; hits <= taps; hits += 1) {
    odds[tierForHits(hits)] += binomial(taps, hits, tapChance);
  }
  return odds;
}

export function cosmeticsFor(tier: Tier) {
  return COSMETICS.filter((item) => item.tier === tier);
}

export function cosmeticById(id: string) {
  return COSMETICS.find((item) => item.id === id) ?? null;
}

export function dupeRefundFor(tier: Tier) {
  return ECONOMY.dupeRefund[tier];
}

/** Overall chance of one item landing in any given drive. */
export function itemChance(item: Cosmetic) {
  const pool = cosmeticsFor(item.tier);
  const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
  return tierChances()[item.tier] * (item.weight / total);
}

export function levelFor(xp: number) {
  let level = 1;
  ECONOMY.levels.forEach((threshold, index) => {
    if (xp >= threshold) level = index + 1;
  });
  return level;
}

export function levelSpan(xp: number) {
  const level = levelFor(xp);
  const start = ECONOMY.levels[level - 1] ?? 0;
  const next = ECONOMY.levels[level] ?? start;
  const progress = next === start ? 1 : Math.min(1, Math.max(0, (xp - start) / (next - start)));
  return { level, start, next, progress };
}

export function xpFor(kind: RewardKind, perfect: boolean) {
  return ECONOMY.rewards[kind].xp + (perfect ? ECONOMY.perfectBonus[kind].xp : 0);
}

export function ramFor(kind: RewardKind, perfect: boolean) {
  return ECONOMY.rewards[kind].ram + (perfect ? ECONOMY.perfectBonus[kind].ram : 0);
}
