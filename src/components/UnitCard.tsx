import { useState, type PointerEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { TIER_GRADIENT, type Unit } from "../data/units";
import { cn } from "../lib/cn";

type UnitCardProps = {
  unit: Unit;
  wide?: boolean;
  onStart?: () => void;
};

// Built once: pointermove fires constantly and each matchMedia() call allocates.
const COARSE_POINTER = window.matchMedia("(pointer: coarse)");
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");

export function UnitCard({ unit, wide = false, onStart }: UnitCardProps) {
  const [tilt, setTilt] = useState<string>("");

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (wide || COARSE_POINTER.matches || REDUCED_MOTION.matches) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const next = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
    // Same string means the same pixels: skip the re-render.
    setTilt((previous) => (previous === next ? previous : next));
  };

  const isOpen = unit.state !== "locked";

  return (
    <article
      onClick={isOpen ? onStart : undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setTilt("")}
      style={tilt ? { transform: tilt } : undefined}
      className={cn(
        "group relative flex flex-col rounded-[4px] border border-white/[0.08] bg-panel p-5 transition-[border-color,box-shadow] duration-300 hover:border-white/20 hover:shadow-[0_24px_60px_-45px_rgba(143,0,255,0.8)]",
        wide && "lg:col-span-3 lg:flex-row lg:items-center lg:gap-10 lg:p-7",
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: TIER_GRADIENT[unit.tier] }}
      />

      <div
        className={cn(
          "flex items-baseline justify-between gap-4",
          wide && "lg:w-32 lg:shrink-0 lg:flex-col lg:items-start lg:gap-1",
        )}
      >
        <span className="font-mono text-[10px] tracking-[0.18em] text-dim uppercase">
          Unit {unit.index}
        </span>
        <span className="font-mono text-[10px] tracking-[0.12em] text-dim/70 uppercase">
          {unit.duration}
        </span>
      </div>

      <div className={cn("mt-4 flex-1", wide && "lg:mt-0")}>
        <h3
          className={cn(
            "text-[19px] leading-tight font-medium tracking-[-0.015em] text-ink",
            wide && "lg:text-[24px]",
          )}
        >
          {unit.title}
        </h3>
        <p
          className={cn(
            "mt-2 max-w-[46ch] text-[13px] leading-6 text-dim",
            wide && "lg:max-w-[62ch]",
          )}
        >
          {unit.summary}
        </p>
      </div>

      <div
        className={cn(
          "mt-5 flex items-center justify-between border-t border-white/[0.06] pt-3",
          wide && "lg:mt-0 lg:w-44 lg:shrink-0 lg:border-t-0 lg:pt-0",
        )}
      >
        <span className="font-mono text-[10px] tracking-[0.12em] text-dim/70 uppercase">
          {unit.lessons} {unit.lessons === 1 ? "lesson" : "lessons"}
        </span>
        {isOpen ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onStart?.();
            }}
            className="inline-flex items-center gap-1.5 text-[12px] text-ink"
          >
            {unit.state === "available" ? "Start" : "Open"}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-dim/50">Locked</span>
        )}
      </div>
    </article>
  );
}
