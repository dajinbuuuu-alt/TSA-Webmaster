import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft } from "lucide-react";
import { TIER_GRADIENT, TIER_LABEL } from "../data/units";
import { ECONOMY, TIER_ORDER, tierForHits } from "../lib/economy";
import type { DriveResult } from "../lib/progress";
import { showToast } from "../lib/toast";
import { cn } from "../lib/cn";

/**
 * The opening. The result is already settled and saved when this mounts, so
 * closing the screen can't cost the student their drop — the case opening and
 * the four taps are the reveal, not the roll.
 */
export function DriveRoll({ result, onDone }: { result: DriveResult; onDone: () => void }) {
  const [revealed, setRevealed] = useState(0);
  const [settled, setSettled] = useState(false);
  const announced = useRef(false);
  const total = result.taps.length;
  const opened = revealed > 0;
  const hitsSoFar = result.taps.slice(0, revealed).filter(Boolean).length;
  const currentTier = tierForHits(hitsSoFar);
  const lastHit = revealed > 0 ? result.taps[revealed - 1] : null;

  useEffect(() => {
    if (revealed < total) return;
    const timer = window.setTimeout(() => setSettled(true), 620);
    return () => window.clearTimeout(timer);
  }, [revealed, total]);

  useEffect(() => {
    if (!settled || announced.current) return;
    announced.current = true;
    if (result.duplicate) {
      showToast(`Duplicate ${result.item.name} → +${result.refund} RAM`, "gain");
    } else {
      showToast(`${result.item.name} added to the vault`, "gain");
    }
  }, [settled, result]);

  const tap = () => {
    if (revealed >= total) return;
    setRevealed((value) => value + 1);
  };

  return (
    <div className="vault-in">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow">Opening drive</p>
        <p className="font-mono text-[10px] tracking-[0.14em] text-dim/70 uppercase">
          −{ECONOMY.drive.cost} RAM paid
        </p>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {TIER_ORDER.map((tier) => {
          const active = tier === currentTier;
          return (
            <div key={tier} className={cn("border-t-2 pt-2", active ? "opacity-100" : "opacity-35")}>
              <span
                aria-hidden="true"
                className="block h-[2px] w-full"
                style={{ background: TIER_GRADIENT[tier], opacity: active ? 1 : 0 }}
              />
              <p
                className={cn(
                  "mt-2 font-mono text-[9px] tracking-[0.14em] uppercase",
                  active ? "text-ink" : "text-dim",
                )}
              >
                {TIER_LABEL[tier]}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col items-center">
        <div className={cn("drive-case", opened && "is-open")}>
          <div className="drive-half drive-top">
            <span className="drive-label">HARD DRIVE</span>
            <span className="drive-vent" aria-hidden="true" />
          </div>
          <div className="drive-half drive-bottom">
            <span className="drive-vent" aria-hidden="true" />
          </div>

          <div className="drive-core">
            {result.taps.map((hit, index) => {
              const shown = index < revealed;
              return (
                <div
                  key={index}
                  className={cn(
                    "drive-led",
                    shown && hit && "is-hit",
                    shown && !hit && "is-miss",
                    index === revealed - 1 && "just-fired",
                  )}
                >
                  <span className="drive-led-dot" />
                  <span className="drive-led-text">
                    {shown ? (hit ? "UP" : "HOLD") : String(index + 1).padStart(2, "0")}
                  </span>
                </div>
              );
            })}
          </div>

          {opened && (
            <span
              key={revealed}
              aria-hidden="true"
              className={cn("drive-shock", lastHit ? "is-hit" : "is-miss")}
            />
          )}

          {opened && lastHit && (
            <span key={`sparks-${revealed}`} className="drive-sparks" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, index) => (
                <span key={index} style={{ "--angle": `${index * 45}deg` } as CSSProperties} />
              ))}
            </span>
          )}
        </div>

        <p className="mt-3 min-h-5 text-center text-[12.5px] text-dim">
          {settled
            ? `${hitsSoFar} of ${total} taps upgraded`
            : revealed === 0
              ? `Tap to break the seal. ${total} taps, ${Math.round(ECONOMY.drive.tapChance * 100)}% each.`
              : `${hitsSoFar} of ${revealed} taps upgraded · now ${TIER_LABEL[currentTier]}`}
        </p>
      </div>

      {!settled && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={tap}
            className="inline-flex h-10 items-center gap-2 rounded-[3px] bg-brand px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#7b00de]"
          >
            {revealed === 0 ? "Open drive" : revealed >= total ? "Settling…" : `Tap ${revealed + 1} of ${total}`}
          </button>
        </div>
      )}

      {settled && (
        <div className="reveal-card mt-5 border border-white/12 bg-[#0f1319] p-4">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-[2px] w-8"
              style={{ background: TIER_GRADIENT[result.tier] }}
            />
            <span className="font-mono text-[10px] tracking-[0.18em] text-dim uppercase">
              {TIER_LABEL[result.tier]} drive
            </span>
          </div>

          <p className="mt-2.5 font-display text-[22px] leading-tight font-semibold tracking-[-0.02em] text-ink">
            {result.item.name}
          </p>
          <p className="mt-1 text-[12.5px] leading-5 text-dim">{result.item.detail}</p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-3">
            <span
              className={cn(
                "rounded-[2px] border px-2 py-1 font-mono text-[9.5px] tracking-[0.14em] uppercase",
                result.duplicate ? "border-signal/40 text-signal" : "border-white/20 text-ink",
              )}
            >
              {result.duplicate ? `Duplicate → +${result.refund} RAM` : "New cosmetic"}
            </span>
            <span className="font-mono text-[10px] tracking-[0.12em] text-dim uppercase">
              RAM <span className="text-ink">{result.ramAfter}</span>
            </span>
            <button
              type="button"
              onClick={onDone}
              className="inline-flex h-9 items-center gap-2 rounded-[3px] border border-white/15 px-3.5 text-[12.5px] text-ink transition-colors hover:bg-white/[0.05]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to vault
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
