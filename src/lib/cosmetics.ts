/** How each cosmetic actually looks. Ids here match the ids in `economy.ts`. */

const svgCursor = (body: string, fallback = "auto", hotspot = "16 16") =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${body}</svg>`,
  )}") ${hotspot}, ${fallback}`;

export const CURSORS: Record<string, string> = {
  "bronze.hairline": svgCursor(
    '<path d="M16 3v9M16 20v9M3 16h9M20 16h9" stroke="#eaf1f8" stroke-width="1"/><circle cx="16" cy="16" r="1.6" fill="#00ffff"/>',
    "crosshair",
  ),
  "bronze.block": svgCursor(
    '<rect x="11" y="4" width="10" height="22" fill="#eaf1f8"/><rect x="13" y="7" width="6" height="16" fill="#0b0e13"/>',
    "text",
    "16 7",
  ),
  "bronze.dot": svgCursor('<circle cx="16" cy="16" r="4.5" fill="#00ffff"/>'),
  "rose.pulse": svgCursor(
    '<circle cx="16" cy="16" r="9" fill="none" stroke="#b76e79" stroke-opacity="0.55"/><circle cx="16" cy="16" r="3" fill="#b76e79"/>',
  ),
  "gold.beam": svgCursor(
    '<rect x="14" y="2" width="4" height="24" rx="2" fill="#00ffff"/><rect x="12" y="8" width="8" height="12" fill="#00ffff" fill-opacity="0.18"/>',
  ),
  "diamond.event-horizon": svgCursor(
    '<circle cx="16" cy="16" r="7.5" fill="none" stroke="#00ffff" stroke-width="2"/><circle cx="16" cy="16" r="2" fill="#eaf1f8"/>',
    "crosshair",
  ),
};

export const ACCENTS: Record<string, string> = {
  "bronze.accent-bronze": "#cd7f32",
  "bronze.accent-rose": "#b76e79",
  "rose.accent-cyan": "#00ffff",
  "rose.accent-violet": "#8f00ff",
};

export type TrailMode = "dots" | "glyphs";

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
};

export type BackdropVariant = "circuit" | "orbit" | "horizon" | "signal";

export const BACKDROPS: Record<string, BackdropVariant> = {
  "gold.circuit": "circuit",
  "gold.orbit": "orbit",
  "diamond.event-horizon": "horizon",
  "diamond.signal": "signal",
};

export type FlairVariant = "frame" | "ring" | "horizon";

export const FLAIRS: Record<string, FlairVariant> = {
  "diamond.particle-frame": "frame",
  "diamond.spectrum-ring": "ring",
  "diamond.event-horizon": "horizon",
};
