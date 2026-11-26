import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { GATE_EVENT, continueAsGuest, type GateDetail } from "../lib/auth";
import { cn } from "../lib/cn";

/**
 * The account barrier in front of every lesson. There is no backend yet, so the
 * account buttons are honest about it and guest mode is what actually starts.
 */
export function AuthGate() {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const pending = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    const onGate = (event: Event) => {
      pending.current = (event as CustomEvent<GateDetail>).detail?.next;
      restoreFocus.current = document.activeElement as HTMLElement | null;
      setNotice(false);
      setOpen(true);
    };

    window.addEventListener(GATE_EVENT, onGate);
    return () => window.removeEventListener(GATE_EVENT, onGate);
  }, []);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>("button"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function close() {
    setOpen(false);
    restoreFocus.current?.focus?.();
  }

  function enterAsGuest() {
    continueAsGuest();
    setOpen(false);
    const next = pending.current;
    pending.current = undefined;
    next?.();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-5">
      <div
        aria-hidden="true"
        onClick={close}
        className="absolute inset-0 bg-black/80 backdrop-blur-[3px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
        aria-describedby="gate-body"
        className="relative w-full max-w-[400px] rounded-[4px] border border-white/12 bg-[#0f1319] p-6 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="eyebrow">Session</p>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="-mt-1 -mr-1 grid h-7 w-7 place-items-center rounded-[3px] text-dim transition-colors hover:bg-white/[0.05] hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <h2
          id="gate-title"
          className="mt-3 font-display text-[22px] font-semibold tracking-[-0.02em] text-ink"
        >
          Save your progress
        </h2>
        <p id="gate-body" className="mt-2 text-[13px] leading-6 text-dim">
          Guest saves XP and RAM on this computer only.
        </p>

        <div className="mt-6 space-y-2">
          <button
            type="button"
            data-autofocus
            onClick={() => setNotice(true)}
            className="h-10 w-full rounded-[3px] bg-brand text-[13px] font-medium text-white transition-colors hover:bg-[#7b00de]"
          >
            Create an account
          </button>
          <button
            type="button"
            onClick={() => setNotice(true)}
            className="h-10 w-full rounded-[3px] border border-white/15 text-[13px] text-ink transition-colors hover:bg-white/[0.05]"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={enterAsGuest}
            className="h-10 w-full text-[13px] text-dim underline decoration-white/20 underline-offset-4 transition-colors hover:text-ink hover:decoration-white/50"
          >
            Continue as guest
          </button>
        </div>

        <p
          aria-live="polite"
          className={cn(
            "mt-3 text-[12px] leading-5 text-signal/80 transition-opacity",
            notice ? "opacity-100" : "opacity-0",
          )}
        >
          {notice ? "Accounts aren't open yet." : ""}
        </p>
      </div>
    </div>
  );
}
