import { useEffect, useRef, useState } from "react";
import { ArrowRight, LogOut, X } from "lucide-react";
import { UNITS } from "../data/units";
import { findAccount } from "../lib/accounts";
import { requestAuth, signOut, useSession } from "../lib/auth";
import { STAR_LABEL, cosmeticById } from "../lib/economy";
import { PROFILE_EVENT } from "../lib/profile";
import { useProgress } from "../lib/progress";
import { FLAIRS } from "../lib/cosmetics";
import { openVault } from "../lib/vault";
import { cn } from "../lib/cn";

const TOTAL_LESSONS = UNITS.reduce(
  (sum, unit) => sum + (unit.state === "capstone" ? 1 : unit.lessons),
  0,
);

const SLOTS = [
  { key: "cursor", label: "Cursor" },
  { key: "trail", label: "Trail" },
  { key: "background", label: "Background" },
  { key: "accent", label: "Accent" },
  { key: "flair", label: "Flair" },
  { key: "pet", label: "Pet" },
] as const;

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border border-white/[0.08] bg-white/[0.015] p-3">
      <p className="font-mono text-[8.5px] tracking-[0.16em] text-dim/60 uppercase">{label}</p>
      <p className="mt-1.5 font-mono text-[19px] leading-none text-ink">{value}</p>
      {note && <p className="mt-1.5 font-mono text-[8.5px] tracking-[0.12em] text-dim/50 uppercase">{note}</p>}
    </div>
  );
}

/**
 * Your card: who you are, how far you've got, what you're wearing and what
 * you've pulled lately. Read-only — the vault is where things change.
 */
export function ProfilePanel() {
  const [open, setOpen] = useState(false);
  const session = useSession();
  const { xp, ram, level, levelNext, levelProgress, count, ownedCount, loadout, drives } =
    useProgress();
  const restoreFocus = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onOpen = () => {
      restoreFocus.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };
    window.addEventListener(PROFILE_EVENT, onOpen);
    return () => window.removeEventListener(PROFILE_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
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
  }, [open]);

  if (!open) return null;

  const account = session?.kind === "account" ? findAccount(session.accountId) : null;
  const handle = account?.handle ?? (session?.kind === "guest" ? "Guest" : "Not signed in");
  const initial = (account?.handle ?? "S")[0].toUpperCase();
  const flair = loadout.flair ? FLAIRS[loadout.flair] : null;
  const toNext = Math.max(0, levelNext - xp);
  const worn = SLOTS.map((slot) => {
    const itemId = loadout[slot.key];
    return { ...slot, itemId, name: itemId ? (cosmeticById(itemId)?.name ?? "—") : "Empty" };
  });

  const close = () => {
    setOpen(false);
    restoreFocus.current?.focus?.();
  };

  return (
    <div className="fixed inset-0 z-[78] flex items-stretch justify-center sm:items-center sm:p-6">
      <div aria-hidden="true" onClick={close} className="absolute inset-0 bg-black/85 backdrop-blur-[3px]" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        className="relative flex h-full w-full max-w-[880px] flex-col border-white/12 bg-[#0b0e13] sm:h-auto sm:max-h-[88vh] sm:rounded-[4px] sm:border"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
          <div className="min-w-0">
            <p className="eyebrow">Profile</p>
            <h2
              id="profile-title"
              className="mt-1.5 font-display text-[20px] font-semibold tracking-[-0.02em] text-ink"
            >
              {handle}
            </h2>
            <p className="mt-1 truncate font-mono text-[9.5px] tracking-[0.1em] text-dim/60">
              {account
                ? `${account.email} · since ${new Date(account.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
                : session?.kind === "guest"
                  ? "Guest · saved on this device"
                  : "No account yet"}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <p className="font-mono text-[9px] tracking-[0.16em] text-dim/60 uppercase">Level</p>
              <p className="font-mono text-[15px] text-ink">{level}</p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close profile"
              className="grid h-8 w-8 place-items-center rounded-[3px] border border-white/12 text-dim transition-colors hover:bg-white/[0.05] hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          <div className="flex flex-wrap items-center gap-4 border border-white/10 bg-[#0f1319] p-4">
            <div
              className={cn(
                "profile-avatar grid h-14 w-14 shrink-0 place-items-center rounded-[3px] border border-white/15 bg-black font-display text-[22px] text-ink",
                flair === "frame" && "flair-frame",
                flair === "ring" && "flair-ring",
                flair === "horizon" && "flair-horizon",
                flair === "halo" && "flair-halo",
              )}
            >
              <span className="profile-avatar-inner grid h-full w-full place-items-center">{initial}</span>
            </div>

            <div className="min-w-[200px] flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[14px] text-ink">
                  Level {level} · {xp.toLocaleString()} XP
                </p>
                <p className="font-mono text-[9.5px] tracking-[0.12em] text-dim/60 uppercase">
                  {toNext > 0 ? `${toNext.toLocaleString()} XP to level ${level + 1}` : "Top level"}
                </p>
              </div>
              <div className="mt-2 h-1.5 w-full bg-white/[0.07]">
                <div
                  className="h-full bg-brand"
                  style={{ width: `${Math.round(levelProgress * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Lessons" value={`${count}`} note={`of ${TOTAL_LESSONS}`} />
            <Stat label="XP earned" value={xp.toLocaleString()} note="never spent" />
            <Stat label="RAM" value={ram.toLocaleString()} note="drives only" />
            <Stat label="Collection" value={`${ownedCount}`} note="cosmetics" />
          </div>

          <section className="mt-6">
            <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.08] pb-2">
              <h3 className="font-mono text-[10px] tracking-[0.18em] text-ink uppercase">Wearing</h3>
              <button
                type="button"
                onClick={() => {
                  close();
                  openVault();
                }}
                className="font-mono text-[9px] tracking-[0.14em] text-dim uppercase underline decoration-white/20 underline-offset-2 hover:text-ink"
              >
                Change in vault
              </button>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {worn.map((slot) => (
                <div key={slot.key} className="flex items-baseline justify-between gap-2 border border-white/[0.07] px-2.5 py-2">
                  <span className="font-mono text-[8.5px] tracking-[0.14em] text-dim/60 uppercase">
                    {slot.label}
                  </span>
                  <span className={cn("truncate text-[11.5px]", slot.itemId ? "text-ink" : "text-dim/40")}>
                    {slot.name}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.08] pb-2">
              <h3 className="font-mono text-[10px] tracking-[0.18em] text-ink uppercase">Recent drives</h3>
              <span className="font-mono text-[9px] tracking-[0.14em] text-dim/60 uppercase">
                {drives.length} total
              </span>
            </div>

            {drives.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-dim">
                No drives opened yet. They cost 150 RAM each.
              </p>
            ) : (
              <ul className="mt-2.5 divide-y divide-white/[0.06]">
                {drives.slice(0, 6).map((drive) => {
                  return (
                    <li key={drive.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                      <span className="font-mono text-[9px] tracking-[0.12em] text-dim/60 uppercase">
                        {STAR_LABEL[drive.tier]}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
                        {cosmeticById(drive.itemId)?.name ?? "Removed item"}
                      </span>
                      <span className="font-mono text-[9px] tracking-[0.1em] text-dim/50 uppercase">
                        {drive.duplicate ? `+${drive.refund} RAM` : "new"}
                      </span>
                      <span className="font-mono text-[9px] tracking-[0.1em] text-dim/40 uppercase">
                        {new Date(drive.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-white/[0.08] pt-4">
            <button
              type="button"
              onClick={() => {
                close();
                openVault();
              }}
              className="inline-flex h-9 items-center gap-2 rounded-[3px] bg-brand px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-[#7b00de]"
            >
              Reward vault
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            {account ? (
              <button
                type="button"
                onClick={() => {
                  signOut();
                  close();
                }}
                className="inline-flex h-9 items-center gap-2 rounded-[3px] border border-white/15 px-3.5 text-[12.5px] text-ink transition-colors hover:bg-white/[0.05]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  signOut();
                  close();
                  requestAuth();
                }}
                className="inline-flex h-9 items-center gap-2 rounded-[3px] border border-white/15 px-3.5 text-[12.5px] text-ink transition-colors hover:bg-white/[0.05]"
              >
                Create an account
              </button>
            )}

            <span className="ml-auto font-mono text-[9px] tracking-[0.12em] text-dim/40 uppercase">
              Accounts live on this device
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
