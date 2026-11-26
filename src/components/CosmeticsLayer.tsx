import { useEffect, useMemo, useRef, type CSSProperties } from "react";
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

/** Deterministic PRNG so the board is identical on every render. */
function mulberry32(seed: number) {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pin = { x: number; y: number; side: "r" | "l" | "t" | "b" };

const CHIP = { x: 1012, y: 596, w: 292, h: 206 };
const BOARD = { w: 1440, h: 900 };

/**
 * A printed circuit board: a central chip, dozens of 45°-routed traces leaving
 * its pins, and vias where they turn. Generated once, then frozen.
 */
function buildCircuit() {
  const rand = mulberry32(20261126);
  const front: string[] = [];
  const back: string[] = [];
  const vias: { x: number; y: number }[] = [];
  const pins: Pin[] = [];

  for (let y = CHIP.y + 22; y <= CHIP.y + CHIP.h - 22; y += 13) {
    pins.push({ x: CHIP.x + CHIP.w, y, side: "r" });
    pins.push({ x: CHIP.x, y, side: "l" });
  }
  for (let x = CHIP.x + 22; x <= CHIP.x + CHIP.w - 22; x += 13) {
    pins.push({ x, y: CHIP.y, side: "t" });
    pins.push({ x, y: CHIP.y + CHIP.h, side: "b" });
  }

  const route = (pin: Pin, into: string[]) => {
    const horizontal = pin.side === "r" || pin.side === "l";
    const sign = pin.side === "r" || pin.side === "b" ? 1 : -1;
    let x = pin.x + (horizontal ? sign * 10 : 0);
    let y = pin.y + (horizontal ? 0 : sign * 10);
    let path = `M${pin.x} ${pin.y}L${x} ${y}`;

    const segments = 3 + Math.floor(rand() * 4);
    for (let index = 0; index < segments; index += 1) {
      const run = 46 + rand() * 124;
      if (horizontal) {
        x += sign * run;
        path += `H${x}`;
      } else {
        y += sign * run;
        path += `V${y}`;
      }

      if (rand() < 0.46) {
        const jog = 14 + rand() * 36;
        const up = rand() < 0.5 ? -1 : 1;
        if (horizontal) {
          x += sign * jog;
          y += up * jog;
        } else {
          y += sign * jog;
          x += up * jog;
        }
        path += `L${x} ${y}`;
        if (rand() < 0.45) vias.push({ x, y });
      }

      if (x < -120 || x > BOARD.w + 120 || y < -120 || y > BOARD.h + 120) break;
    }

    vias.push({ x, y });
    into.push(path);
  };

  pins.forEach((pin) => route(pin, front));

  // Loose routing behind the chip for density.
  for (let index = 0; index < 26; index += 1) {
    const vertical = rand() < 0.5;
    const from = vertical
      ? { x: rand() * BOARD.w, y: rand() < 0.5 ? -20 : BOARD.h + 20, side: (rand() < 0.5 ? "t" : "b") as Pin["side"] }
      : { x: rand() < 0.5 ? -20 : BOARD.w + 20, y: rand() * BOARD.h, side: (rand() < 0.5 ? "l" : "r") as Pin["side"] };
    route(from, back);
  }

  return {
    front: front.join(""),
    back: back.join(""),
    vias,
  };
}

function CircuitArt({ color }: { color: string }) {
  const circuit = useMemo(buildCircuit, []);
  const pins = useMemo(() => {
    const list: Pin[] = [];
    for (let y = CHIP.y + 22; y <= CHIP.y + CHIP.h - 22; y += 13) {
      list.push({ x: CHIP.x + CHIP.w, y, side: "r" });
      list.push({ x: CHIP.x, y, side: "l" });
    }
    for (let x = CHIP.x + 22; x <= CHIP.x + CHIP.w - 22; x += 13) {
      list.push({ x, y: CHIP.y, side: "t" });
      list.push({ x, y: CHIP.y + CHIP.h, side: "b" });
    }
    return list;
  }, []);

  return (
    <svg
      className="cosmic-svg"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ color }}
    >
      <defs>
        <filter id="pcb-glow" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="pcb-fade-x" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset="0.28" stopColor="white" stopOpacity="0.35" />
          <stop offset="0.62" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="white" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="pcb-fade-y" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.9" />
          <stop offset="0.55" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="white" stopOpacity="0.15" />
        </linearGradient>
        <mask id="pcb-mask-x">
          <rect width="1440" height="900" fill="url(#pcb-fade-x)" />
        </mask>
        <mask id="pcb-mask-y">
          <rect width="1440" height="900" fill="url(#pcb-fade-y)" />
        </mask>
      </defs>

      <g mask="url(#pcb-mask-x)">
        <g mask="url(#pcb-mask-y)" filter="url(#pcb-glow)">
          <path d={circuit.back} fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.22" />
          <path d={circuit.front} fill="none" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.7" />

          <g fill="none" stroke="currentColor" strokeWidth="1.2">
            {circuit.vias.map((via, index) => (
              <circle key={index} cx={via.x} cy={via.y} r="3.2" strokeOpacity="0.95" />
            ))}
          </g>
          <g fill="currentColor" opacity="0.95">
            {circuit.vias.map((via, index) => (
              <circle key={index} cx={via.x} cy={via.y} r="1.1" />
            ))}
          </g>

          {/* the chip */}
          <g>
            <rect
              x={CHIP.x}
              y={CHIP.y}
              width={CHIP.w}
              height={CHIP.h}
              rx="3"
              fill="#03060c"
              stroke="currentColor"
              strokeOpacity="0.9"
              strokeWidth="1.5"
            />
            <rect
              x={CHIP.x + 30}
              y={CHIP.y + 30}
              width={CHIP.w - 60}
              height={CHIP.h - 60}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.3"
            />
            <rect
              x={CHIP.x + 74}
              y={CHIP.y + 74}
              width={CHIP.w - 148}
              height={CHIP.h - 148}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.22"
            />
            <g fill="currentColor" opacity="0.65">
              {pins.map((pin, index) => {
                const horizontal = pin.side === "r" || pin.side === "l";
                const x = horizontal ? pin.x - (pin.side === "r" ? 4 : 0) : pin.x - 2;
                const y = horizontal ? pin.y - 1.5 : pin.y - (pin.side === "b" ? 4 : 0);
                return (
                  <rect
                    key={index}
                    x={x}
                    y={y}
                    width={horizontal ? 4 : 4}
                    height={horizontal ? 3 : 4}
                  />
                );
              })}
            </g>
          </g>
        </g>
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

function QuasarArt({ color }: { color: string }) {
  return (
    <svg
      className="cosmic-svg"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ color }}
    >
      <defs>
        <radialGradient id="quasar-core">
          <stop offset="0" stopColor="currentColor" stopOpacity="1" />
          <stop offset="0.18" stopColor="currentColor" stopOpacity="0.6" />
          <stop offset="0.5" stopColor="currentColor" stopOpacity="0.16" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="quasar-jet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.6" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <g className="quasar-drift">
        <circle cx="1010" cy="640" r="330" fill="url(#quasar-core)" opacity="0.8" />
        <rect x="1002" y="0" width="16" height="600" fill="url(#quasar-jet)" />
        <rect x="1002" y="680" width="16" height="260" fill="url(#quasar-jet)" transform="rotate(180 1010 810)" />
        <g fill="none" stroke="currentColor">
          <ellipse cx="1010" cy="640" rx="210" ry="46" strokeOpacity="0.8" strokeWidth="1.6" />
          <ellipse cx="1010" cy="640" rx="320" ry="78" strokeOpacity="0.45" />
          <ellipse cx="1010" cy="640" rx="440" ry="112" strokeOpacity="0.22" />
        </g>
        <ellipse cx="1010" cy="640" rx="120" ry="24" fill="none" stroke="currentColor" strokeOpacity="0.5" />
        <circle cx="1010" cy="640" r="8" fill="currentColor" />
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
  if (variant === "quasar") return <QuasarArt color={color} />;
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
