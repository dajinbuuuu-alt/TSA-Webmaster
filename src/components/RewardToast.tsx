import { useEffect, useState } from "react";
import { REWARD_EVENT, type Award } from "../lib/progress";
import { cn } from "../lib/cn";

/** Fires on every completed lesson: the number is the reward, nothing else. */
export function RewardToast() {
  const [award, setAward] = useState<Award | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer = 0;

    const onReward = (event: Event) => {
      setAward((event as CustomEvent<Award>).detail);
      setVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setVisible(false), 2600);
    };

    window.addEventListener(REWARD_EVENT, onReward);
    return () => {
      window.removeEventListener(REWARD_EVENT, onReward);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed bottom-20 left-1/2 z-[61] flex -translate-x-1/2 items-center gap-2.5 rounded-[3px] border border-signal/30 bg-[#0f1319] px-4 py-2.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      {award && (
        <>
          <span className="font-mono text-[11px] tracking-[0.12em] text-signal">
            +{award.xp} XP
          </span>
          <span aria-hidden="true" className="text-dim/40">
            ·
          </span>
          <span className="font-mono text-[11px] tracking-[0.12em] text-ink">
            +{award.ram} RAM
          </span>
          {award.leveledUp && (
            <span className="ml-1 rounded-[2px] border border-signal/40 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.16em] text-signal uppercase">
              Level up
            </span>
          )}
        </>
      )}
    </div>
  );
}
