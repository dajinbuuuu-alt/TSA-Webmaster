import { useEffect, useState, type MouseEvent } from "react";
import { ArrowRight, LogOut, Menu, X } from "lucide-react";
import { getSession, requestAuth, signOut, useSession } from "../lib/auth";
import { findAccount } from "../lib/accounts";
import { FLAIRS } from "../lib/cosmetics";
import { useProgress } from "../lib/progress";
import { useTestMode } from "../lib/testmode";
import { announceSoon } from "../lib/soon";
import { openVault } from "../lib/vault";
import { cn } from "../lib/cn";

const LINKS = [
  { label: "Units", href: "#units", active: true },
  { label: "Leaderboard", href: null, active: false },
  { label: "Reward Vault", href: null, active: false },
  { label: "Profile", href: null, active: false },
];

export function MorphNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const session = useSession();
  const { level, xp, ram, loadout } = useProgress();
  const testMode = useTestMode();
  const flair = loadout.flair ? FLAIRS[loadout.flair] : null;
  const accentOn = Boolean(loadout.accent);

  const handle =
    session?.kind === "account" ? (findAccount(session.accountId)?.handle ?? "Account") : null;
  const identity = handle ?? (session?.kind === "guest" ? "Guest" : "New");

  const startCourse = (event: MouseEvent<HTMLAnchorElement>) => {
    if (getSession()) return;
    event.preventDefault();
    requestAuth(() => {
      document.getElementById("units")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-white/[0.08] bg-black/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1180px] items-center gap-6 px-5 transition-[height] duration-300 sm:px-8",
          scrolled ? "h-14" : "h-16",
        )}
      >
        <a href="#top" className="flex shrink-0 items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="mark" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#00FFFF" />
                <stop offset="1" stopColor="#8F00FF" />
              </linearGradient>
            </defs>
            <path
              d="M16 2.6 27.7 9.3v13.4L16 29.4 4.3 22.7V9.3z"
              stroke="url(#mark)"
              strokeWidth="1.8"
            />
            <circle cx="16" cy="16" r="3" fill="url(#mark)" />
          </svg>
          <span className="font-display text-[14px] font-semibold tracking-[0.14em]">SYNAPSE</span>
          <span className="hidden h-3.5 w-px bg-white/15 sm:block" />
          <span className="hidden font-mono text-[9px] tracking-[0.2em] text-dim uppercase sm:block">
            AI literacy
          </span>
        </a>

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-1 lg:flex">
          {LINKS.map((link) =>
            link.href ? (
              <a
                key={link.label}
                href={link.href}
                className={cn(
                  "relative px-3 py-2 text-[13px] transition-colors",
                  link.active ? "text-ink" : "text-dim hover:text-ink",
                )}
              >
                {link.label}
                {link.active &&                 <span className="accent-underline absolute inset-x-3 -bottom-px h-px" />}
              </a>
            ) : (
              <button
                key={link.label}
                type="button"
                onClick={link.label === "Reward Vault" ? openVault : announceSoon}
                className="px-3 py-2 text-[13px] text-dim transition-colors hover:text-ink"
              >
                {link.label}
              </button>
            ),
          )}
        </nav>

        <div className="ml-auto hidden items-center gap-4 border-l border-white/10 pl-5 lg:flex">
          <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.12em] text-dim uppercase">
            <span
              className={cn(
                "inline-flex items-center",
                flair === "frame" && "flair-frame px-1.5 py-0.5",
                flair === "ring" && "flair-ring",
                flair === "horizon" && "flair-horizon",
              )}
            >
              <span
                className={cn(
                  accentOn ? "accent-text" : handle ? "text-ink" : "text-signal/90",
                )}
              >
                {identity}
              </span>
            </span>
            <span aria-hidden="true" className="h-3 w-px bg-white/10" />
            <span>
              LV <span className={accentOn ? "accent-text" : "text-ink"}>{level}</span>
            </span>
            <span aria-hidden="true" className="h-3 w-px bg-white/10" />
            <span>
              <span className="text-ink">{xp.toLocaleString()}</span> XP
            </span>
            <span aria-hidden="true" className="h-3 w-px bg-white/10" />
            <span>
              <span className={testMode ? "text-flare" : "text-ink"}>
                {testMode ? "∞" : ram.toLocaleString()}
              </span>{" "}
              RAM
            </span>
            {testMode && (
              <span className="rounded-[2px] border border-flare/40 px-1 py-0.5 text-[8px] tracking-[0.16em] text-flare">
                TEST
              </span>
            )}
          </div>

          {session ? (
            <button
              type="button"
              onClick={() => signOut()}
              aria-label="Sign out"
              className="grid h-9 w-9 place-items-center rounded-[3px] border border-white/15 text-dim transition-colors hover:bg-white/[0.05] hover:text-ink"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          ) : (
            <a
              href="#units"
              onClick={startCourse}
              className="inline-flex h-9 items-center gap-2 rounded-[3px] bg-brand px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-[#7b00de]"
            >
              Start
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3 lg:hidden">
          <span
            className={cn(
              "inline-flex items-center",
              flair === "frame" && "flair-frame px-1.5 py-0.5",
              flair === "ring" && "flair-ring",
              flair === "horizon" && "flair-horizon",
            )}
          >
            <span className="font-mono text-[10px] tracking-[0.14em] text-dim uppercase">
              {session ? (
                <>
                  <span className={testMode ? "text-flare" : "text-ink"}>
                    {testMode ? "∞" : xp.toLocaleString()}
                  </span>{" "}
                  {testMode ? "RAM" : "XP"}
                </>
              ) : (
                "New"
              )}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="grid h-9 w-9 place-items-center rounded-[3px] border border-white/15 text-ink/80 transition-colors hover:bg-white/[0.05]"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/[0.08] bg-black lg:hidden">
          <nav aria-label="Mobile" className="mx-auto w-full max-w-[1180px] px-5 py-2 sm:px-8">
            {LINKS.map((link) =>
              link.href ? (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block border-b border-white/[0.06] py-3 text-[14px] text-ink"
                >
                  {link.label}
                </a>
              ) : (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    if (link.label === "Reward Vault") openVault();
                    else announceSoon();
                  }}
                  className="block w-full border-b border-white/[0.06] py-3 text-left text-[14px] text-dim"
                >
                  {link.label}
                </button>
              ),
            )}
            {session && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="block w-full py-3 text-left text-[14px] text-signal/90"
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
