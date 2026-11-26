import { useEffect, useRef } from "react";

const GLYPHS = [
  "0", "1", "A", "I", "<", ">", "{", "}", "[", "]", "/", "\\", "|",
  "=", "+", "*", "#", "$", "%", "&", "Σ", "Δ", "π", "λ", "→",
];

const CELL = 26;
const RADIUS = 120;

type MatrixTrailProps = {
  className?: string;
};

/**
 * A character field that lights up around the pointer and decays back into
 * ambient noise. One canvas, one rAF loop, capped DPR, no pointer listeners on
 * coarse-pointer devices, and a single static frame for reduced motion.
 */
export function MatrixTrail({ className = "" }: MatrixTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let energy = new Float32Array(0);
    let glyphs = new Uint8Array(0);
    let raf = 0;

    const seed = () => {
      energy = new Float32Array(cols * rows);
      glyphs = new Uint8Array(cols * rows);
      for (let i = 0; i < energy.length; i += 1) {
        if (Math.random() < 0.2) energy[i] = 0.05 + Math.random() * 0.1;
        glyphs[i] = Math.floor(Math.random() * GLYPHS.length);
      }
    };

    const paint = () => {
      ctx.clearRect(0, 0, width, height);
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const i = y * cols + x;
          const e = energy[i];
          if (e <= 0.02) continue;
          const alpha = 0.07 + Math.min(e, 1) * 0.5;
          const r = Math.round(143 * Math.min(e, 1));
          const g = Math.round(255 - 255 * Math.min(e, 1));
          ctx.fillStyle = `rgba(${r}, ${g}, 255, ${alpha})`;
          ctx.fillText(
            GLYPHS[glyphs[i]],
            x * CELL + CELL / 2,
            y * CELL + CELL / 2,
          );
        }
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      cols = Math.ceil(width / CELL);
      rows = Math.ceil(height / CELL);
      seed();
      ctx.font = `500 ${Math.round(CELL * 0.6)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      paint();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (coarsePointer || reducedMotion) return;
      const rect = canvas.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      if (px < -RADIUS || py < -RADIUS || px > width + RADIUS || py > height + RADIUS) {
        return;
      }

      const cx = Math.floor(px / CELL);
      const cy = Math.floor(py / CELL);
      const span = Math.ceil(RADIUS / CELL);
      const radiusSq = RADIUS * RADIUS;

      for (let y = cy - span; y <= cy + span; y += 1) {
        for (let x = cx - span; x <= cx + span; x += 1) {
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
          const dx = x * CELL + CELL / 2 - px;
          const dy = y * CELL + CELL / 2 - py;
          const distSq = dx * dx + dy * dy;
          if (distSq > radiusSq) continue;
          const i = y * cols + x;
          const power = 1 - distSq / radiusSq;
          energy[i] = Math.min(1.05, energy[i] + power * 0.5);
          if (power > 0.35) glyphs[i] = Math.floor(Math.random() * GLYPHS.length);
        }
      }
    };

    const tick = () => {
      for (let i = 0; i < energy.length; i += 1) energy[i] *= 0.945;
      if (Math.random() < 0.35) {
        const i = Math.floor(Math.random() * energy.length);
        energy[i] = 0.7;
        glyphs[i] = Math.floor(Math.random() * GLYPHS.length);
      }
      paint();
      raf = window.requestAnimationFrame(tick);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    if (!reducedMotion) raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
