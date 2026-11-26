import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { SOON_EVENT } from "../lib/soon";
import { cn } from "../lib/cn";

export function SoonToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer = 0;

    const onSoon = () => {
      setVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setVisible(false), 2800);
    };

    window.addEventListener(SOON_EVENT, onSoon);
    return () => {
      window.removeEventListener(SOON_EVENT, onSoon);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-[3px] border border-white/15 bg-[#0f1319] px-4 py-2.5 text-[12px] text-ink/85 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
    >
      <Info className="h-3.5 w-3.5 text-signal" />
      Coming soon.
    </div>
  );
}
