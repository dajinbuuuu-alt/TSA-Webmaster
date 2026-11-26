import { useEffect, useRef } from "react";
import { useProgress } from "../lib/progress";
import { ACCENTS, BACKDROPS, CURSORS, TRAILS, type TrailConfig } from "../lib/cosmetics";

/**
 * Applies whatever is equipped in the vault: cursor, pointer trail, page
 * background and accent colour. Everything is CSS or canvas, no assets.
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
    let inside = false;

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
          char: config.mode === "glyphs" ? config.chars?.[Math.floor(Math.random() * (config.chars.length || 1))] : undefined,
          size: config.size,
        });
      }
      // Hard ceiling so a fast mouse can't grow the list without bound.
      if (particles.length > 320) particles = particles.slice(particles.length - 320);
    };

    const onMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      if (!inside) inside = true;
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

function Backdrop({ variant }: { variant: string }) {
  return <div aria-hidden="true" className={`cosmic-layer cosmic-${variant}`} />;
}

export function CosmeticsLayer() {
  const { loadout } = useProgress();
  const cursor = loadout.cursor;
  const trail = loadout.trail;
  const background = loadout.background;
  const accent = loadout.accent ? ACCENTS[loadout.accent] : null;

  // Custom cursors need to win over every pointer style in the app.
  useEffect(() => {
    const id = "synapse-cursor";
    document.getElementById(id)?.remove();
    if (!cursor || !CURSORS[cursor]) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = `html, body, * { cursor: ${CURSORS[cursor]} !important; }`;
    document.head.appendChild(style);

    return () => style.remove();
  }, [cursor]);

  useEffect(() => {
    const root = document.documentElement;
    if (accent) {
      root.style.setProperty("--accent", accent);
      root.style.setProperty("--accent-soft", `${accent}40`);
    } else {
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-soft");
    }
  }, [accent]);

  const trailConfig = trail ? TRAILS[trail] : null;
  const backdrop = background ? BACKDROPS[background] : null;

  return (
    <>
      {backdrop && <Backdrop variant={backdrop} />}
      {trailConfig && <TrailCanvas config={trailConfig} />}
    </>
  );
}
