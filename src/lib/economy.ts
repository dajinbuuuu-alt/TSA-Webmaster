export type RewardKind = "lesson" | "test" | "capstone";

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
