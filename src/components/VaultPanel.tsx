import { useEffect, useRef, useState } from "react";
import { Lock, X } from "lucide-react";
import { TIER_GRADIENT, TIER_LABEL, type Tier } from "../data/units";
import {
  COSMETICS,
  ECONOMY,
  SLOT_LABEL,
  SLOT_ORDER,
  TIER_ORDER,
  cosmeticById,
  cosmeticsFor,
  itemChance,
  tierChances,
  type Cosmetic,
  type CosmeticKind,
} from "../lib/economy";
import {
  buyDrive,
  equipItem,
  resetTint,
  setTint,
  unequipSlot,
  useProgress,
  type DriveResult,
} from "../lib/progress";
import { SWATCHES, TINT_SLOTS, defaultColor, type TintSlot } from "../lib/cosmetics";
import { showToast } from "../lib/toast";
import { toggleTestMode, useTestMode } from "../lib/testmode";
import { VAULT_EVENT } from "../lib/vault";
import { DriveRoll } from "./DriveRoll";
import { cn } from "../lib/cn";

const KIND_LABEL: Record<CosmeticKind, string> = {
  cursor: "Cursor",
  trail: "Trail",
  background: "Background",
  accent: "Accent",
  flair: "Flair",
  theme: "Theme",
};

type CardProps = {
  item: Cosmetic;
  owned: boolean;
  equipped: boolean;
  chance: number;
  onEquip: () => void;
};

function CosmeticCard({ item, owned, equipped, chance, onEquip }: CardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1.5 border p-3 transition-colors",
        equipped
          ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
          : owned
            ? "border-white/15 bg-white/[0.035]"
            : "border-white/[0.07]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          aria-hidden="true"
          className="h-[2px] w-6"
          style={{ background: TIER_GRADIENT[item.tier], opacity: owned ? 1 : 0.4 }}
        />
        <span className="font-mono text-[9px] tracking-[0.14em] text-dim/60 uppercase">
          {KIND_LABEL[item.kind]}
        </span>
      </div>

      <p className={cn("text-[13px] font-medium", owned ? "text-ink" : "text-dim")}>{item.name}</p>
      <p className="text-[11.5px] leading-[1.5] text-dim/70">{item.detail}</p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <span className="font-mono text-[9px] tracking-[0.12em] text-dim/50 uppercase">
          {(Math.round(chance * 1000) / 10).toFixed(1)}%
        </span>
        {owned ? (
          <span className="rounded-[2px] border border-signal/35 px-1.5 py-0.5 font-mono text-[8.5px] tracking-[0.14em] text-signal uppercase">
            Owned
          </span>
        ) : (
          <span className="flex items-center gap-1 font-mono text-[8.5px] tracking-[0.14em] text-dim/50 uppercase">
            <Lock className="h-2.5 w-2.5" aria-hidden="true" />
            Locked
          </span>
        )}
      </div>

      {owned && (
        <button
          type="button"
          onClick={onEquip}
          disabled={equipped}
          className={cn(
            "mt-1 h-7 w-full rounded-[2px] border text-[11px] transition-colors",
            equipped
              ? "cursor-default border-[var(--accent)]/50 text-[var(--accent)]"
              : "border-white/15 text-ink hover:bg-white/[0.06]",
          )}
        >
          {equipped ? "Equipped" : item.slots.length > 1 ? "Equip set" : "Equip"}
        </button>
      )}
    </div>
  );
}

type SectionProps = {
  tier: Tier;
  rewards: Record<string, number>;
  loadout: Record<string, string | null>;
  odds: number;
  onEquip: (itemId: string) => void;
};

function TierSection({ tier, rewards, loadout, odds, onEquip }: SectionProps) {
  const items = cosmeticsFor(tier);
  const owned = items.filter((item) => rewards[item.id]).length;

  return (
    <section className="mt-6 first:mt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/[0.08] pb-2">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="h-[2px] w-7" style={{ background: TIER_GRADIENT[tier] }} />
          <h3 className="font-mono text-[10px] tracking-[0.18em] text-ink uppercase">
            {TIER_LABEL[tier]}
          </h3>
        </div>
        <p className="font-mono text-[9.5px] tracking-[0.14em] text-dim/60 uppercase">
          {Number((odds * 100).toFixed(2))}% of drives · {owned}/{items.length}
        </p>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <CosmeticCard
            key={item.id}
            item={item}
            owned={Boolean(rewards[item.id])}
            equipped={item.slots.every((slot) => loadout[slot] === item.id)}
            chance={itemChance(item)}
            onEquip={() => onEquip(item.id)}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * The vault: buy a drive, watch four taps, equip what you own. Every number
 * comes from `economy.ts`, and the live store keeps RAM, the collection and
 * the worn loadout in sync.
 */
export function VaultPanel() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<DriveResult | null>(null);
  const { ram, rewards, ownedCount, loadout, tints } = useProgress();
  const testMode = useTestMode();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onOpen = () => {
      restoreFocus.current = document.activeElement as HTMLElement | null;
      setResult(null);
      setOpen(true);
    };
    window.addEventListener(VAULT_EVENT, onOpen);
    return () => window.removeEventListener(VAULT_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("[data-close]")?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (result) {
        setResult(null);
        return;
      }
      setOpen(false);
      restoreFocus.current?.focus?.();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, result]);

  const close = () => {
    setOpen(false);
    setResult(null);
    restoreFocus.current?.focus?.();
  };

  const buy = () => {
    const outcome = buyDrive();
    if (!outcome.ok) {
      showToast(outcome.error, "warn");
      return;
    }
    setResult(outcome.result);
  };

  const equip = (itemId: string) => {
    equipItem(itemId);
  };

  if (!open) return null;

  const odds = tierChances();
  const shortfall = Math.max(0, ECONOMY.drive.cost - ram);

  return (
    <div className="fixed inset-0 z-[78] flex items-stretch justify-center sm:items-center sm:p-6">
      <div aria-hidden="true" onClick={close} className="absolute inset-0 bg-black/85 backdrop-blur-[3px]" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-title"
        className="relative flex h-full w-full max-w-[1020px] flex-col border-white/12 bg-[#0b0e13] sm:h-auto sm:max-h-[88vh] sm:rounded-[4px] sm:border"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
          <div className="min-w-0">
            <p className="eyebrow">Reward vault</p>
            <h2
              id="vault-title"
              className="mt-1.5 font-display text-[20px] font-semibold tracking-[-0.02em] text-ink"
            >
              {result ? "Hard Drive" : "Your collection"}
            </h2>
            {!result && (
              <p className="mt-1 font-mono text-[9.5px] tracking-[0.14em] text-dim/60 uppercase">
                {ownedCount} of {COSMETICS.length} owned
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                toggleTestMode();
                showToast(
                  testMode ? "Test mode off · drives cost RAM again" : "Test mode on · drives are free",
                  "info",
                );
              }}
              aria-pressed={testMode}
              aria-label="Test mode — unlimited RAM"
              title="Unlimited RAM for testing. Off by default."
              className={cn(
                "h-8 rounded-[3px] border px-2 font-mono text-[9px] tracking-[0.14em] uppercase transition-colors",
                testMode
                  ? "border-flare/50 text-flare"
                  : "border-white/12 text-dim/70 hover:bg-white/[0.05] hover:text-ink",
              )}
            >
              Test
            </button>

            <div className="text-right">
              <p className="font-mono text-[9px] tracking-[0.16em] text-dim/60 uppercase">RAM</p>
              <p className={cn("font-mono text-[15px]", testMode ? "text-flare" : "text-ink")}>
                {testMode ? "∞" : ram.toLocaleString()}
              </p>
            </div>

            <button
              type="button"
              data-close
              onClick={close}
              aria-label="Close vault"
              className="grid h-8 w-8 place-items-center rounded-[3px] border border-white/12 text-dim transition-colors hover:bg-white/[0.05] hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {result ? (
            <DriveRoll result={result} onDone={() => setResult(null)} />
          ) : (
            <>
              <div className="border border-white/10 bg-[#0f1319] p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] tracking-[0.18em] text-dim uppercase">
                      Hard Drive · {testMode ? "free in test mode" : `${ECONOMY.drive.cost} RAM`}
                    </p>
                    <p className="mt-1.5 text-[13px] text-ink">
                      {ECONOMY.drive.taps} free taps, {Math.round(ECONOMY.drive.tapChance * 100)}% each.
                      Starts Bronze.
                    </p>
                    <p className="mt-1 text-[12px] text-dim">
                      A duplicate turns into RAM instead.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={buy}
                    className={cn(
                      "inline-flex h-10 shrink-0 items-center gap-2 rounded-[3px] px-4 text-[13px] font-medium transition-colors",
                      shortfall > 0 && !testMode
                        ? "border border-white/20 text-ink hover:bg-white/[0.05]"
                        : "bg-brand text-white hover:bg-[#7b00de]",
                    )}
                  >
                    Buy drive
                  </button>
                </div>

                {shortfall > 0 && !testMode && (
                  <p className="mt-3 border-t border-white/[0.07] pt-2.5 text-[12px] text-flare/90">
                    {ram === 0 ? "No RAM yet" : `${ram} RAM`} — {shortfall} short of {ECONOMY.drive.cost}.
                    Finish a lesson to earn more.
                  </p>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {SLOT_ORDER.map((slot) => {
                  const item = loadout[slot] ? cosmeticById(loadout[slot] as string) : null;
                  return (
                    <div
                      key={slot}
                      className={cn(
                        "border p-2.5",
                        item ? "border-white/15 bg-white/[0.03]" : "border-white/[0.07]",
                      )}
                    >
                      <p className="font-mono text-[8.5px] tracking-[0.16em] text-dim/60 uppercase">
                        {SLOT_LABEL[slot]}
                      </p>
                      <p
                        className={cn(
                          "mt-1 truncate text-[12px]",
                          item ? "text-ink" : "text-dim/45",
                        )}
                      >
                        {item?.name ?? "Empty"}
                      </p>
                      {item ? (
                        <>
                          <button
                            type="button"
                            onClick={() => unequipSlot(slot)}
                            className="mt-1 font-mono text-[8.5px] tracking-[0.12em] text-dim uppercase underline decoration-white/20 underline-offset-2 hover:text-ink"
                          >
                            Remove
                          </button>

                          {TINT_SLOTS.includes(slot as TintSlot) && (
                            <div className="mt-2 flex flex-wrap items-center gap-1">
                              {SWATCHES.map((swatch) => (
                                <button
                                  key={swatch}
                                  type="button"
                                  onClick={() => setTint(slot as TintSlot, swatch)}
                                  aria-label={`Set ${slot} colour ${swatch}`}
                                  aria-pressed={tints[slot as TintSlot] === swatch}
                                  className={cn(
                                    "h-3.5 w-3.5 rounded-full border transition-transform hover:scale-110",
                                    tints[slot as TintSlot] === swatch
                                      ? "border-ink ring-1 ring-ink/40"
                                      : "border-white/25",
                                  )}
                                  style={{ backgroundColor: swatch }}
                                />
                              ))}
                              <label
                                className="relative grid h-3.5 w-3.5 place-items-center rounded-full border border-dashed border-white/35 text-[8px] leading-none text-dim"
                                title="Custom colour"
                              >
                                +
                                <input
                                  type="color"
                                  value={tints[slot as TintSlot] ?? defaultColor(slot as TintSlot, item.id)}
                                  onChange={(event) => setTint(slot as TintSlot, event.target.value)}
                                  aria-label={`Custom ${slot} colour`}
                                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                />
                              </label>
                            </div>
                          )}

                          {tints[slot as TintSlot] && (
                            <button
                              type="button"
                              onClick={() => resetTint(slot as TintSlot)}
                              className="mt-1.5 block font-mono text-[8px] tracking-[0.12em] text-dim/70 uppercase hover:text-ink"
                            >
                              Reset colour
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="mt-1 block font-mono text-[8.5px] tracking-[0.12em] text-dim/35 uppercase">
                          None
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {TIER_ORDER.map((tier) => (
                <TierSection
                  key={tier}
                  tier={tier}
                  rewards={rewards}
                  loadout={loadout}
                  odds={odds[tier]}
                  onEquip={equip}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
