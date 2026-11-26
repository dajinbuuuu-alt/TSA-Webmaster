import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { GATE_EVENT, continueAsGuest, type GateDetail } from "../lib/auth";
import { signIn, signUp } from "../lib/accounts";
import { cn } from "../lib/cn";

type Mode = "create" | "login";

/**
 * The account barrier in front of every lesson. Accounts are real sign-up and
 * sign-in with PBKDF2-hashed passwords, stored on this device until a server
 * exists; guest mode writes its own separate progress.
 */
export function AuthGate() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const pending = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    const onGate = (event: Event) => {
      pending.current = (event as CustomEvent<GateDetail>).detail?.next;
      restoreFocus.current = document.activeElement as HTMLElement | null;
      setError(null);
      setBusy(false);
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

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>("button, input, [href]"),
      );
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
    setPassword("");
    setError(null);
    restoreFocus.current?.focus?.();
  }

  function finish() {
    setOpen(false);
    setPassword("");
    setBusy(false);
    const next = pending.current;
    pending.current = undefined;
    next?.();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    const result = mode === "create" ? await signUp(email, password) : await signIn(email, password);
    setBusy(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    finish();
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
        className="relative w-full max-w-[420px] rounded-[4px] border border-white/12 bg-[#0f1319] p-6 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]"
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

        <div className="mt-5 flex gap-1 border-b border-white/10">
          {(["create", "login"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setMode(option);
                setError(null);
              }}
              aria-pressed={mode === option}
              className={cn(
                "relative px-3 py-2 text-[12.5px] transition-colors",
                mode === option ? "text-ink" : "text-dim hover:text-ink",
              )}
            >
              {option === "create" ? "Create account" : "Log in"}
              {mode === option && <span className="absolute inset-x-2 -bottom-px h-px bg-brand" />}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block">
            <span className="font-mono text-[9.5px] tracking-[0.18em] text-dim uppercase">
              Email
            </span>
            <input
              data-autofocus
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-[3px] border border-white/12 bg-[#0b0e13] px-3 text-[13px] text-ink outline-none transition-colors focus:border-signal/60"
            />
          </label>

          <label className="block">
            <span className="font-mono text-[9.5px] tracking-[0.18em] text-dim uppercase">
              Password
            </span>
            <input
              type="password"
              required
              minLength={mode === "create" ? 8 : 1}
              autoComplete={mode === "create" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-[3px] border border-white/12 bg-[#0b0e13] px-3 text-[13px] text-ink outline-none transition-colors focus:border-signal/60"
            />
          </label>

          <p
            aria-live="polite"
            className={cn(
              "min-h-5 text-[12px] leading-5 text-rose/90 transition-opacity",
              error ? "opacity-100" : "opacity-0",
            )}
          >
            {error ?? ""}
          </p>

          <button
            type="submit"
            disabled={busy}
            className="h-10 w-full rounded-[3px] bg-brand text-[13px] font-medium text-white transition-colors hover:bg-[#7b00de] disabled:opacity-70"
          >
            {busy
              ? mode === "create"
                ? "Creating account…"
                : "Signing in…"
              : mode === "create"
                ? "Create account"
                : "Log in"}
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
          <span className="font-mono text-[9px] tracking-[0.16em] text-dim/60 uppercase">
            Saved on this device
          </span>
          <button
            type="button"
            onClick={() => {
              continueAsGuest();
              finish();
            }}
            className="text-[12.5px] text-dim underline decoration-white/20 underline-offset-4 transition-colors hover:text-ink hover:decoration-white/50"
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
