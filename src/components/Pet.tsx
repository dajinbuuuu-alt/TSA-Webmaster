import { useEffect, useRef, useState, type ReactElement } from "react";

/**
 * Pets sit in the corner and do nothing useful. They follow the pointer with
 * their eyes, bob, blink and fidget — no clicks, no gameplay.
 */

export type PetVariant = "moth" | "byte" | "mochi" | "nova";

export const PET_ART: Record<string, PetVariant> = {
  "bronze.pet-moth": "moth",
  "rose.pet-byte": "byte",
  "gold.pet-mochi": "mochi",
  "diamond.pet-nova": "nova",
};

const PET_COLOR: Record<PetVariant, string> = {
  moth: "#b76e79",
  byte: "#00ffff",
  mochi: "#ffd700",
  nova: "#87ceeb",
};

type Look = { x: number; y: number };
type Draw = { look: Look; blink: boolean };

const ink = "#0b0e13";

function Shadow() {
  return <ellipse cx="60" cy="103" rx="24" ry="4.5" fill="currentColor" opacity="0.14" />;
}

function Eyes({ look, blink, cx1 = 53, cx2 = 67, cy = 56, r = 3 }: Draw & { cx1?: number; cx2?: number; cy?: number; r?: number }) {
  const dx = look.x * 1.6;
  const dy = look.y * 1.4;
  if (blink) {
    return (
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d={`M${cx1 - r} ${cy}h${r * 2}`} />
        <path d={`M${cx2 - r} ${cy}h${r * 2}`} />
      </g>
    );
  }
  return (
    <g>
      <circle cx={cx1} cy={cy} r={r} fill={ink} stroke="currentColor" strokeWidth="1.1" />
      <circle cx={cx2} cy={cy} r={r} fill={ink} stroke="currentColor" strokeWidth="1.1" />
      <circle cx={cx1 + dx} cy={cy + dy} r={r * 0.52} fill="currentColor" />
      <circle cx={cx2 + dx} cy={cy + dy} r={r * 0.52} fill="currentColor" />
    </g>
  );
}

function Moth({ look, blink }: Draw) {
  return (
    <g className="pet-bob">
      <Shadow />
      <g transform={`rotate(${look.x * 2.4} 60 62)`}>
        <path
          className="pet-wing"
          d="M55 58C43 44 26 46 26 60c0 13 15 19 28 12"
          fill="currentColor"
          fillOpacity="0.22"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          className="pet-wing pet-wing-right"
          d="M65 58c12-14 29-12 29 2 0 13-15 19-28 12"
          fill="currentColor"
          fillOpacity="0.22"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <ellipse cx="60" cy="70" rx="5.5" ry="16" fill={ink} stroke="currentColor" strokeWidth="1.6" />
        <path d="M44 55h6M70 55h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        <path d="M56 46c-2-6 1-10 5-11M64 46c2-6-1-10-5-11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="61" cy="35" r="1.8" fill="currentColor" />
        <circle cx="59" cy="35" r="1.8" fill="currentColor" />
        <Eyes look={look} blink={blink} cx1={56} cx2={64} cy={45} r={2.4} />
        <path d="M60 50v15M57 56h6" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      </g>
    </g>
  );
}

function Byte({ look, blink }: Draw) {
  return (
    <g className="pet-bob">
      <Shadow />
      <g transform={`translate(0 ${look.y * 0.6}) rotate(${look.x * 2.2} 60 70)`}>
        <path d="M60 42V31" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle className="pet-twinkle" cx="60" cy="28" r="3" fill="currentColor" />
        <rect x="33" y="41" width="54" height="48" rx="13" fill={ink} stroke="currentColor" strokeWidth="2" />
        <rect x="27" y="58" width="5" height="13" rx="2.5" fill="currentColor" opacity="0.8" />
        <rect x="88" y="58" width="5" height="13" rx="2.5" fill="currentColor" opacity="0.8" />
        <rect x="43" y="52" width="34" height="23" rx="8" fill="#05070a" stroke="currentColor" strokeOpacity="0.35" />
        {blink ? (
          <path d="M54 64h12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        ) : (
          <g>
            <circle cx="60" cy="63" r="6.2" fill="currentColor" opacity="0.18" />
            <circle
              cx={60 + look.x * 2.4}
              cy={63 + look.y * 2}
              r="3.4"
              fill="currentColor"
            />
          </g>
        )}
        <path d="M47 82h26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
        <rect x="44" y="89" width="7" height="8" rx="2.5" fill="currentColor" opacity="0.65" />
        <rect x="69" y="89" width="7" height="8" rx="2.5" fill="currentColor" opacity="0.65" />
      </g>
    </g>
  );
}

function Mochi({ look, blink }: Draw) {
  return (
    <g className="pet-bob">
      <Shadow />
      <path
        className="pet-tail"
        d="M84 92c16 2 20-10 13-24"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <ellipse cx="60" cy="86" rx="23" ry="16" fill={ink} stroke="currentColor" strokeWidth="1.8" />
      <ellipse cx="60" cy="90" rx="11" ry="8" fill="currentColor" opacity="0.1" />
      <g transform={`rotate(${look.x * 2} 60 70)`}>
        <path d="M40 48 42 31l14 9" fill={ink} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M80 48 78 31 64 40" fill={ink} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M45 38h5M70 38h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
        <ellipse cx="60" cy="58" rx="23" ry="20" fill={ink} stroke="currentColor" strokeWidth="1.8" />
        <Eyes look={look} blink={blink} cx1={52} cx2={68} cy={56} r={3.4} />
        <path d="M60 64l-2.6 2.6h5.2z" fill="currentColor" />
        <path d="M60 67v2M56 70c1 2 3 2 4 1M64 70c-1 2-3 2-4 1" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
        <path d="M38 60h-8M38 65l-8 2M82 60h8M82 65l8 2" stroke="currentColor" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
        <path d="M50 79h20" stroke="currentColor" strokeWidth="1.2" opacity="0.25" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Nova({ look, blink }: Draw) {
  return (
    <g className="pet-bob">
      <Shadow />
      <ellipse
        className="pet-orbit-spin"
        cx="60"
        cy="64"
        rx="42"
        ry="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        opacity="0.55"
        transform="rotate(-18 60 64)"
      />
      <circle cx="60" cy="64" r="21" fill="currentColor" opacity="0.14" />
      <circle cx="60" cy="64" r="17" fill={ink} stroke="currentColor" strokeWidth="1.8" />
      <circle cx="54" cy="58" r="5" fill="currentColor" opacity="0.18" />
      <g transform={`translate(${look.x * 1.4} ${look.y * 1.2})`}>
        {blink ? (
          <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M53 64h5M62 64h5" />
          </g>
        ) : (
          <g>
            <circle cx="55.5" cy="64" r="2.6" fill="currentColor" />
            <circle cx="64.5" cy="64" r="2.6" fill="currentColor" />
          </g>
        )}
      </g>
      <path d="M60 79c-1.6 3-1.6 5 0 6 1.6-1 1.6-3 0-6z" fill="currentColor" opacity="0.5" />
      <g fill="currentColor">
        <path className="pet-twinkle" d="M88 34l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" opacity="0.8" />
        <path className="pet-twinkle" style={{ animationDelay: "1.1s" }} d="M28 78l1.4 3.6 3.6 1.4-3.6 1.4L28 88l-1.4-3.6L23 83l3.6-1.4z" opacity="0.6" />
      </g>
    </g>
  );
}

const ART: Record<PetVariant, (props: Draw) => ReactElement> = {
  moth: Moth,
  byte: Byte,
  mochi: Mochi,
  nova: Nova,
};

export function Pet({ petId }: { petId: string }) {
  const variant = PET_ART[petId];
  const ref = useRef<HTMLDivElement | null>(null);
  const [look, setLook] = useState<Look>({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);

  // A pet nobody can see should not keep the compositor awake.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver((entries) => {
      setOnScreen(entries[0]?.isIntersecting ?? true);
    });
    observer.observe(node);

    const onVisibility = () => setTabHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Eyes follow the pointer, capped so they never spin all the way round.
  useEffect(() => {
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const box = ref.current?.getBoundingClientRect();
        if (!box) return;
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height * 0.55;
        const clamp = (value: number) => Math.max(-1, Math.min(1, Math.round(value * 10) / 10));
        const x = clamp((event.clientX - cx) / 340);
        const y = clamp((event.clientY - cy) / 340);
        // Re-rendering the whole SVG for an unchanged look is pure waste.
        setLook((previous) => (previous.x === x && previous.y === y ? previous : { x, y }));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  // Blink now and then, on a loose loop so it never looks metronomic.
  useEffect(() => {
    let timer = 0;
    let close = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setBlink(true);
        close = window.setTimeout(() => {
          setBlink(false);
          schedule();
        }, 140);
      }, 2400 + Math.random() * 4200);
    };
    schedule();
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(close);
    };
  }, []);

  if (!variant) return null;
  const Art = ART[variant];

  return (
    <div
      ref={ref}
      className={onScreen && !tabHidden ? "pet" : "pet pet-parked"}
      aria-hidden="true"
      style={{ color: PET_COLOR[variant] }}
    >
      <svg viewBox="0 0 120 112" width="100%" height="100%" fill="none">
        <Art look={look} blink={blink} />
      </svg>
    </div>
  );
}
