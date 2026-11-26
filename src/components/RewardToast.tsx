import { useEffect, useState } from "react";
import { REWARD_EVENT, type Award } from "../lib/progress";
import { TOAST_EVENT, type ToastDetail, type ToastTone } from "../lib/toast";
import { cn } from "../lib/cn";

type Line = { text: string; tone: ToastTone; badge?: string };

const TONE_CLASS: Record<ToastTone, string> = {
  gain: "border-signal/30 text-signal",
  spend: "border-white/20 text-ink",
  warn: "border-flare/40 text-flare",
  info: "border-white/15 text-ink/85",
};

/** The one toast rail: lesson awards and drive spends/refunds both land here. */
export function RewardToast() {
  const [line, setLine] = useState<Line | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer = 0;

    const show = (next: Line, hold: number) => {
      setLine(next);
      setVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setVisible(false), hold);
    };

    const onReward = (event: Event) => {
      const award = (event as CustomEvent<Award>).detail;
      show(
        {
          text: `+${award.xp} XP · +${award.ram} RAM`,
          tone: "gain",
          badge: award.leveledUp ? "Level up" : undefined,
        },
        2600,
      );
    };

    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      show({ text: detail.text, tone: detail.tone }, detail.tone === "warn" ? 3600 : 2600);
    };

    window.addEventListener(REWARD_EVENT, onReward);
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(REWARD_EVENT, onReward);
      window.removeEventListener(TOAST_EVENT, onToast);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed bottom-20 left-1/2 z-[92] flex max-w-[calc(100vw-2.5rem)] -translate-x-1/2 items-center gap-2.5 rounded-[3px] border bg-[#0f1319] px-4 py-2.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] transition-all duration-300",
        line ? TONE_CLASS[line.tone] : "border-white/15",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      {line && (
        <>
          <span className="font-mono text-[11px] tracking-[0.1em] whitespace-nowrap">{line.text}</span>
          {line.badge && (
            <span className="ml-1 rounded-[2px] border border-signal/40 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.16em] text-signal uppercase">
              {line.badge}
            </span>
          )}
        </>
      )}
    </div>
  );
}
