/** How each cosmetic looks. Ids match the ids in `economy.ts`. */

export type TintSlot = "cursor" | "trail" | "background";

export const TINT_SLOTS: TintSlot[] = ["cursor", "trail", "background"];

export const SWATCHES = ["#00ffff", "#8f00ff", "#b76e79", "#ffd700", "#ff8a3d", "#eaf1f8"];

const cursorCss = (body: string, fallback: string, hotspot: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${body}</svg>`,
  )}") ${hotspot}, ${fallback}`;

type CursorArt = {
  fallback: string;
  hotspot: string;
  /** Default colour before the student picks one. */
  color: string;
  draw: (color: string) => string;
};

export const CURSOR_ART: Record<string, CursorArt> = {
  "bronze.hairline": {
    fallback: "crosshair",
    hotspot: "16 16",
    color: "#eaf1f8",
    draw: (color) =>
      `<path d="M16 2v8M16 22v8M2 16h8M22 16h8" stroke="${color}" stroke-width="1.3"/>` +
      `<path d="M11 11h2M19 11h2M11 21h2M19 21h2" stroke="${color}" stroke-width="1" stroke-opacity="0.6"/>` +
      `<circle cx="16" cy="16" r="1.5" fill="${color}"/>`,
  },
  "bronze.dot": {
    fallback: "auto",
    hotspot: "16 16",
    color: "#00ffff",
    draw: (color) =>
      `<g>` +
      `<rect x="10" y="10" width="12" height="12" rx="3" fill="#0b0e13" stroke="${color}" stroke-width="1.4"/>` +
      `<rect x="7.5" y="14" width="2.5" height="4" rx="1" fill="${color}"/>` +
      `<rect x="22" y="14" width="2.5" height="4" rx="1" fill="${color}"/>` +
      `<circle cx="13.4" cy="15" r="1.6" fill="${color}"/>` +
      `<circle cx="18.6" cy="15" r="1.6" fill="${color}"/>` +
      `<path d="M14 18.6h4" stroke="${color}" stroke-width="1" stroke-linecap="round"/>` +
      `<path d="M16 10V7" stroke="${color}" stroke-width="1.1"/>` +
      `<circle cx="16" cy="5.6" r="1.3" fill="${color}"/>` +
      `</g>`,
  },
  "bronze.block": {
    fallback: "text",
    hotspot: "16 6",
    color: "#eaf1f8",
    draw: (color) =>
      `<rect x="11" y="4" width="10" height="24" rx="1" fill="#0b0e13" stroke="${color}" stroke-width="1.4"/>` +
      `<rect x="13.5" y="8" width="5" height="16" fill="${color}" fill-opacity="0.9"/>`,
  },
  "rose.pulse": {
    fallback: "auto",
    hotspot: "16 16",
    color: "#b76e79",
    draw: (color) =>
      `<circle cx="16" cy="16" r="10" fill="none" stroke="${color}" stroke-opacity="0.45" stroke-width="1"/>` +
      `<circle cx="16" cy="16" r="6" fill="none" stroke="${color}" stroke-opacity="0.7" stroke-width="1"/>` +
      `<circle cx="16" cy="16" r="3" fill="${color}"/>`,
  },
  "gold.beam": {
    fallback: "auto",
    hotspot: "16 4",
    color: "#00ffff",
    draw: (color) =>
      `<rect x="14.4" y="1" width="3.2" height="26" rx="1.6" fill="${color}"/>` +
      `<rect x="12" y="9" width="8" height="10" fill="${color}" fill-opacity="0.18"/>` +
      `<circle cx="16" cy="16" r="2.2" fill="${color}"/>`,
  },
  "diamond.event-horizon": {
    fallback: "crosshair",
    hotspot: "16 16",
    color: "#ff8a3d",
    draw: (color) =>
      `<circle cx="16" cy="16" r="8.5" fill="none" stroke="${color}" stroke-width="1.2" stroke-opacity="0.55"/>` +
      `<circle cx="16" cy="16" r="5.5" fill="none" stroke="${color}" stroke-width="2"/>` +
      `<circle cx="16" cy="16" r="1.6" fill="${color}"/>`,
  },
  "prism.quasar": {
    fallback: "crosshair",
    hotspot: "16 16",
    color: "#eaf1f8",
    draw: (color) =>
      `<path d="M16 1v9M16 22v9M1 16h9M22 16h9" stroke="${color}" stroke-width="1" stroke-opacity="0.8"/>` +
      `<circle cx="16" cy="16" r="6" fill="none" stroke="${color}" stroke-width="1"/>` +
      `<circle cx="16" cy="16" r="2.2" fill="${color}"/>`,
  },
};

export function cursorUrl(id: string, color: string) {
  const art = CURSOR_ART[id];
  return art ? cursorCss(art.draw(color), art.fallback, art.hotspot) : null;
}

export const ACCENTS: Record<string, string> = {
  "bronze.accent-bronze": "#cd7f32",
  "bronze.accent-rose": "#b76e79",
  "rose.accent-cyan": "#00ffff",
  "rose.accent-violet": "#8f00ff",
};

export type TrailMode = "dots" | "glyphs" | "stars" | "sparks";

export type TrailConfig = {
  color: string;
  mode: TrailMode;
  chars?: string;
  size: number;
  spread: number;
  gravity: number;
  life: number;
};

export const TRAILS: Record<string, TrailConfig> = {
  "rose.comet": { color: "#00ffff", mode: "dots", size: 2.4, spread: 0.8, gravity: 0, life: 42 },
  "rose.dust": { color: "#b76e79", mode: "dots", size: 1.6, spread: 1.6, gravity: 0.02, life: 54 },
  "gold.matrix": {
    color: "#40e0d0",
    mode: "glyphs",
    chars: "アイウエオカキクケコサシスセソ0123456789",
    size: 14,
    spread: 0.6,
    gravity: 0.1,
    life: 60,
  },
  "gold.glyph": {
    color: "#ffd700",
    mode: "glyphs",
    chars: "0123456789ABCDEF",
    size: 12,
    spread: 0.8,
    gravity: 0.015,
    life: 46,
  },
  "diamond.signal": { color: "#00ffff", mode: "dots", size: 2.8, spread: 2.2, gravity: 0, life: 34 },
  "diamond.starfall": { color: "#87ceeb", mode: "stars", size: 4.6, spread: 1.1, gravity: 0.06, life: 52 },
  "prism.refraction": { color: "#c9a4ff", mode: "sparks", size: 3.1, spread: 2.8, gravity: 0, life: 34 },
};

export type BackdropVariant = "circuit" | "orbit" | "horizon" | "signal" | "quasar";

export const BACKDROPS: Record<string, { variant: BackdropVariant; color: string }> = {
  "gold.circuit": { variant: "circuit", color: "#00ffff" },
  "gold.orbit": { variant: "orbit", color: "#ffd700" },
  "diamond.event-horizon": { variant: "horizon", color: "#ff8a3d" },
  "diamond.signal": { variant: "signal", color: "#00ffff" },
  "prism.quasar": { variant: "quasar", color: "#ffb066" },
};

export type FlairVariant = "frame" | "ring" | "horizon" | "halo";

export const FLAIRS: Record<string, FlairVariant> = {
  "diamond.particle-frame": "frame",
  "diamond.spectrum-ring": "ring",
  "diamond.event-horizon": "horizon",
  "prism.quasar": "halo",
  "prism.halo": "halo",
};

/** Colour a slot falls back to when the student hasn't picked one. */
export function defaultColor(slot: TintSlot, itemId: string | null | undefined) {
  if (!itemId) return "#00ffff";
  if (slot === "cursor") return CURSOR_ART[itemId]?.color ?? "#00ffff";
  if (slot === "trail") return TRAILS[itemId]?.color ?? "#00ffff";
  return BACKDROPS[itemId]?.color ?? "#00ffff";
}
