import type { MouseEvent } from "react";
import { ArrowRight, Gift } from "lucide-react";
import { AuthGate } from "./components/AuthGate";
import { CosmeticsLayer } from "./components/CosmeticsLayer";
import { DecryptText } from "./components/DecryptText";
import { DottedGlow } from "./components/DottedGlow";
import { LessonPreview } from "./components/LessonPreview";
import { MorphNavbar } from "./components/MorphNavbar";
import { ProfilePanel } from "./components/ProfilePanel";
import { RewardToast } from "./components/RewardToast";
import { SoonToast } from "./components/SoonToast";
import { StubBar } from "./components/StubBar";
import { UnitCard } from "./components/UnitCard";
import { VaultPanel } from "./components/VaultPanel";
import { TIER_GRADIENT, TIER_LABEL, UNITS } from "./data/units";
import { getSession, requestAuth } from "./lib/auth";
import { COSMETICS } from "./lib/economy";
import { useProgress } from "./lib/progress";
import { announceSoon } from "./lib/soon";
import { openVault } from "./lib/vault";

const FACT_ROW = ["6 units", "About 2 hours", "No account", "Saved on device"];

const TIERS = [
  { tier: "bronze" as const, range: "Units 0–1" },
  { tier: "rose" as const, range: "Units 2–3" },
  { tier: "gold" as const, range: "Units 4–5" },
];

const PROGRESSION = [
  { index: "01", label: "Earn", title: "Earn XP and RAM" },
  { index: "02", label: "Spend", title: "Spend it on Hard Drives" },
  { index: "03", label: "Rank", title: "Compete in weekly leagues" },
];

export default function App() {
  const lessonUnits = UNITS.slice(0, 6);
  const capstone = UNITS[6];
  const { ownedCount } = useProgress();

  const startUnit = () => {
    if (getSession()) {
      announceSoon();
      return;
    }
    requestAuth(announceSoon);
  };

  const startCourse = (event: MouseEvent<HTMLAnchorElement>) => {
    if (getSession()) return;
    event.preventDefault();
    requestAuth(() => {
      document.getElementById("units")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  return (
    <div id="top" className="relative min-h-screen bg-void">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[70] focus:bg-white focus:px-3 focus:py-2 focus:text-[13px] focus:text-black"
      >
        Skip to content
      </a>

      <div
        aria-hidden="true"
        className="grain pointer-events-none fixed inset-0 z-[2] opacity-[0.04]"
      />

      <CosmeticsLayer />
      <MorphNavbar />

      <main id="main" className="relative z-10">
        <section className="relative overflow-hidden border-b border-white/[0.06] pt-28 pb-14 lg:pt-36 lg:pb-20">
          <DottedGlow />
          <div className="relative mx-auto grid w-full max-w-[1180px] gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center lg:gap-16">
            <div>
              <p className="eyebrow hero-shadow flex items-center gap-2.5">
                <span className="inline-block h-[6px] w-[6px] bg-signal" />
                TSA Webmaster · AI literacy portal
              </p>

              <h1 className="hero-shadow mt-6 font-display text-[clamp(2.4rem,5.1vw,4.25rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-ink">
                Learn how AI{" "}
                <span className="underline decoration-signal/50 decoration-[2px] underline-offset-[10px]">
                  actually
                </span>{" "}
                works.
              </h1>

              <p className="hero-shadow mt-6 max-w-[46ch] text-[15px] leading-7 text-dim">
                Six units on how AI works and where it fails, for grades 9–12.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <a
                  href="#units"
                  onClick={startCourse}
                  className="group inline-flex h-11 items-center gap-2.5 rounded-[3px] bg-brand px-5 text-[13.5px] font-medium text-white transition-colors hover:bg-[#7b00de]"
                >
                  Start Unit 0
                  <span className="font-mono text-[10px] tracking-[0.14em] text-white/65">2 MIN</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </a>
                <a
                  href="#units"
                  className="text-[13.5px] text-ink/80 underline decoration-white/20 underline-offset-4 transition-colors hover:text-ink hover:decoration-white/60"
                >
                  See the full curriculum
                </a>
              </div>

              <div className="hero-shadow mt-10 flex flex-wrap items-center gap-3 font-mono text-[10px] tracking-[0.14em] text-ink/70 uppercase max-sm:-mx-2 max-sm:rounded-[2px] max-sm:bg-black/45 max-sm:px-2 max-sm:py-2">
                {FACT_ROW.map((fact, index) => (
                  <span key={fact} className="flex items-center gap-3">
                    {index > 0 && (
                      <span aria-hidden="true" className="hidden h-3 w-px bg-white/10 sm:block" />
                    )}
                    {fact}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <LessonPreview />
              <StubBar />
            </div>
          </div>
        </section>

        <section id="units" className="scroll-mt-16 border-b border-white/[0.06] py-16 lg:py-20">
          <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">Curriculum</p>
                <h2 className="mt-3 font-display text-[clamp(1.9rem,3.4vw,2.75rem)] font-semibold tracking-[-0.03em] text-ink">
                  <DecryptText text="The path" trigger="view" />
                </h2>
                <p className="mt-3 max-w-[46ch] text-[13.5px] leading-6 text-dim">
                  Finish one unit to unlock the next.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <button
                  type="button"
                  onClick={openVault}
                  className="inline-flex h-8 items-center gap-2 rounded-[3px] border border-white/15 px-3 text-[12px] text-ink transition-colors hover:bg-white/[0.05]"
                >
                  <Gift className="h-3.5 w-3.5 text-signal" aria-hidden="true" />
                  Reward vault
                  <span className="font-mono text-[10px] tracking-[0.12em] text-dim">
                    {ownedCount}/{COSMETICS.length}
                  </span>
                </button>

                {TIERS.map(({ tier, range }) => (
                  <div key={tier} className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-[2px] w-7"
                      style={{ background: TIER_GRADIENT[tier] }}
                    />
                    <span className="font-mono text-[9.5px] tracking-[0.14em] text-dim uppercase">
                      {TIER_LABEL[tier]} · {range}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lessonUnits.map((unit) => (
                <UnitCard key={unit.id} unit={unit} onStart={startUnit} />
              ))}
              <UnitCard unit={capstone} wide onStart={startUnit} />
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.06] py-14">
          <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
            <p className="eyebrow">How progress works</p>
            <div className="mt-7 grid gap-8 md:grid-cols-3 md:gap-10">
              {PROGRESSION.map((item) => (
                <div key={item.index} className="border-t border-white/[0.08] pt-4">
                  <div className="flex items-baseline gap-3 font-mono text-[10px] tracking-[0.16em] text-dim/70 uppercase">
                    <span>{item.index}</span>
                    <span className="text-dim">{item.label}</span>
                  </div>
                  <h3 className="mt-2 text-[15px] font-medium text-ink">{item.title}</h3>

                  {item.label === "Spend" && (
                    <div className="mt-4 flex items-center gap-1.5">
                      {(["bronze", "rose", "gold", "diamond"] as const).map((tier) => (
                        <span
                          key={tier}
                          title={TIER_LABEL[tier]}
                          className="h-1.5 w-8"
                          style={{ background: TIER_GRADIENT[tier] }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="py-8">
          <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-5 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 bg-brand" />
              <span className="font-mono text-[10px] tracking-[0.16em] text-dim uppercase">
                Synapse
              </span>
            </div>
            <span className="font-mono text-[10px] tracking-[0.16em] text-dim/60 uppercase">
              Grades 9–12
            </span>
          </div>
        </footer>
      </main>

      <AuthGate />
      <VaultPanel />
      <ProfilePanel />
      <RewardToast />
      <SoonToast />
    </div>
  );
}
