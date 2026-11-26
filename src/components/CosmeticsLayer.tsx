import { useEffect, useRef, type CSSProperties } from "react";
import { useProgress } from "../lib/progress";
import {
  ACCENTS,
  BACKDROPS,
  TRAILS,
  cursorUrl,
  defaultColor,
  type TrailConfig,
} from "../lib/cosmetics";

/**
 * Applies whatever is equipped in the vault: cursor, pointer trail, page
 * background and accent colour, with the colours the student picked.
 */

function TrailCanvas({ config }: { config: TrailConfig }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      max: number;
      char?: string;
      size: number;
    };

    let particles: Particle[] = [];
    let frame = 0;
    let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (count: number) => {
      for (let index = 0; index < count; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * config.spread;
        particles.push({
          x: pointer.x + (Math.random() - 0.5) * 6,
          y: pointer.y + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: config.life,
          max: config.life,
          char:
            config.mode === "glyphs"
              ? config.chars?.[Math.floor(Math.random() * (config.chars.length || 1))]
              : undefined,
          size: config.size,
        });
      }
      // Hard ceiling so a fast mouse can't grow the list without bound.
      if (particles.length > 320) particles = particles.slice(particles.length - 320);
    };

    const onMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      spawn(config.mode === "glyphs" ? 1 : 2);
    };

    const tick = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      context.textAlign = "center";

      particles = particles.filter((particle) => particle.life > 0);
      particles.forEach((particle) => {
        particle.life -= 1;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += config.gravity;

        const alpha = Math.max(0, particle.life / particle.max);
        context.globalAlpha = alpha;

        if (config.mode === "glyphs" && particle.char) {
          context.fillStyle = config.color;
          context.font = `${particle.size}px "JetBrains Mono", monospace`;
          context.fillText(particle.char, particle.x, particle.y);
        } else {
          context.fillStyle = config.color;
          context.beginPath();
          context.arc(particle.x, particle.y, Math.max(0.6, particle.size * alpha), 0, Math.PI * 2);
          context.fill();
        }
      });

      context.globalAlpha = 1;
      frame = window.requestAnimationFrame(tick);
    };

    resize();
    tick();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [config]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[45]"
    />
  );
}

function CircuitArt({ color }: { color: string }) {
  return (
    <svg
      className="cosmic-svg"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ color }}
    >
      <defs>
        <radialGradient id="circuit-fade" cx="64%" cy="26%" r="70%">
          <stop offset="0" stopColor="white" stopOpacity="0.85" />
          <stop offset="0.7" stopColor="white" stopOpacity="0.18" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="circuit-mask">
          <rect width="1440" height="900" fill="url(#circuit-fade)" />
        </mask>
      </defs>
      <g
        mask="url(#circuit-mask)"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      >
        <path d="M60 820V560h250V420h210" />
        <path d="M120 900V700h340V520h180V360h240" />
        <path d="M520 900V640h150V460h320" />
        <path d="M980 900V720h-160V560h300V420h200" />
        <path d="M1380 900V600h-190V460h-150" />
        <path d="M760 900V780h260V620h240" />
      </g>
      <g mask="url(#circuit-mask)" fill="currentColor" opacity="0.7">
        {[
          [310, 560],
          [570, 420],
          [460, 700],
          [1020, 520],
          [1120, 640],
          [960, 360],
          [670, 460],
          [1180, 420],
          [820, 620],
          [1190, 600],
        ].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x - 2} y={y - 2} width="4" height="4" />
        ))}
      </g>
    </svg>
  );
}

function OrbitArt({ color }: { color: string }) {
  return (
    <svg
      className="cosmic-svg"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ color }}
    >
      <defs>
        <radialGradient id="orbit-fade" cx="66%" cy="26%" r="55%">
          <stop offset="0" stopColor="white" stopOpacity="0.5" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="950" cy="250" rx="700" ry="700" fill="url(#orbit-fade)" opacity="0.5" />
      <g fill="none" stroke="currentColor">
        <ellipse cx="950" cy="250" rx="240" ry="240" strokeOpacity="0.7" strokeDasharray="1 9" />
        <ellipse cx="950" cy="250" rx="360" ry="360" strokeOpacity="0.5" strokeDasharray="1 14" />
        <ellipse cx="950" cy="250" rx="500" ry="500" strokeOpacity="0.32" strokeDasharray="1 20" />
        <ellipse cx="950" cy="250" rx="640" ry="640" strokeOpacity="0.2" strokeDasharray="1 26" />
      </g>
      <g className="orbit-turn" style={{ transformOrigin: "950px 250px" }}>
        <circle cx="1190" cy="250" r="5" fill="currentColor" />
        <circle cx="950" cy="610" r="3" fill="currentColor" opacity="0.8" />
      </g>
      <g className="orbit-turn-slow" style={{ transformOrigin: "950px 250px" }}>
        <circle cx="950" cy="-110" r="3" fill="currentColor" opacity="0.8" />
        <circle cx="1450" cy="250" r="2.5" fill="currentColor" opacity="0.6" />
      </g>
    </svg>
  );
}

function SignalArt({ color }: { color: string }) {
  return (
    <svg
      className="cosmic-svg cosmic-signal-svg"
      viewBox="0 0 1440 260"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ color }}
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.3">
        <path
          className="signal-wave"
          opacity="0.7"
          d="M-40 150 C 80 90 180 210 300 150 S 540 90 660 150 S 900 210 1020 150 S 1260 90 1380 150 S 1600 210 1720 150"
        />
        <path
          className="signal-wave signal-wave-2"
          opacity="0.45"
          d="M-40 190 C 100 120 200 250 340 190 S 580 130 720 190 S 940 250 1080 190 S 1320 130 1460 190"
        />
        <path
          className="signal-wave signal-wave-3"
          opacity="0.28"
          d="M-40 110 C 120 60 240 170 400 110 S 640 50 800 110 S 1040 170 1200 110 S 1400 50 1560 110"
        />
      </g>
    </svg>
  );
}

function Backdrop({ variant, color }: { variant: string; color: string }) {
  if (variant === "horizon") {
    return (
      <div
        aria-hidden="true"
        className="cosmic-layer cosmic-horizon"
        style={{ "--bg-color": color } as CSSProperties}
      />
    );
  }
  if (variant === "orbit") return <OrbitArt color={color} />;
  if (variant === "signal") return <SignalArt color={color} />;
  return <CircuitArt color={color} />;
}

export function CosmeticsLayer() {
  const { loadout, tints } = useProgress();
  const cursor = loadout.cursor;
  const trail = loadout.trail;
  const background = loadout.background;

  const cursorColor = tints.cursor ?? defaultColor("cursor", cursor);
  const trailColor = tints.trail ?? defaultColor("trail", trail);
  const bgColor = tints.background ?? defaultColor("background", background);
  const accentColor = loadout.accent ? ACCENTS[loadout.accent] : null;

  // Custom cursors need to win over every pointer style in the app.
  useEffect(() => {
    const id = "synapse-cursor";
    document.getElementById(id)?.remove();
    const css = cursor ? cursorUrl(cursor, cursorColor) : null;
    if (!css) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = `html, body, * { cursor: ${css} !important; }`;
    document.head.appendChild(style);

    return () => style.remove();
  }, [cursor, cursorColor]);

  useEffect(() => {
    const root = document.documentElement;
    if (accentColor) {
      root.style.setProperty("--accent", accentColor);
      root.style.setProperty("--accent-soft", `${accentColor}40`);
    } else {
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-soft");
    }
  }, [accentColor]);

  const trailConfig = trail ? { ...TRAILS[trail], color: trailColor } : null;
  const backdrop = background ? BACKDROPS[background] : null;

  return (
    <>
      {backdrop && <Backdrop variant={backdrop.variant} color={bgColor} />}
      {trailConfig && <TrailCanvas config={trailConfig} />}
    </>
  );
}
