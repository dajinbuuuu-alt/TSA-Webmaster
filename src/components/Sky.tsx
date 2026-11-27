import type { CSSProperties } from "react";

/**
 * The page backdrop: a deep-space gradient with a few restrained nebula washes,
 * a fine starfield and a pair of thin orbit rings in the hero. Everything is CSS
 * and SVG, so it stays crisp at any size and can never band or upscale.
 */
const SKY_W = 1440;
const SKY_H = 900;

const STARS = (() => {
  let seed = 4177;
  const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  return Array.from({ length: 190 }, () => {
    const depth = random();
    return {
      cx: Number((random() * SKY_W).toFixed(1)),
      cy: Number((random() * SKY_H).toFixed(1)),
      r: Number((0.4 + depth * depth * 1.7).toFixed(2)),
      opacity: Number((0.14 + random() * 0.5).toFixed(2)),
    };
  });
})();

/** "#ff8a3d" -> "255 138 61", so the colour can be used inside rgb(... / a). */
export function tintChannels(hex: string) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((part) => part + part)
          .join("")
      : clean;
  return [0, 2, 4].map((at) => parseInt(full.slice(at, at + 2), 16)).join(" ");
}

export function Sky({ tint }: { tint: string }) {
  return (
    <div className="sky" style={{ "--sky-tint": tintChannels(tint) } as CSSProperties} aria-hidden="true">
      <div className="sky-wash" />
      <svg
        className="sky-stars"
        viewBox={`0 0 ${SKY_W} ${SKY_H}`}
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        {STARS.map((star, index) => (
          <circle key={index} cx={star.cx} cy={star.cy} r={star.r} fill="#eaf1f8" opacity={star.opacity} />
        ))}
      </svg>
    </div>
  );
}

export function OrbitRings() {
  return (
    <div className="hero-rings" aria-hidden="true">
      <svg viewBox="0 0 900 900" fill="none" focusable="false">
        <circle cx="450" cy="450" r="420" stroke="rgba(0, 255, 255, 0.11)" />
        <circle cx="450" cy="450" r="318" stroke="rgba(0, 255, 255, 0.16)" />
        <circle cx="450" cy="450" r="214" stroke="rgba(143, 0, 255, 0.18)" />
        <g className="hero-arc">
          <circle
            cx="450"
            cy="450"
            r="420"
            stroke="rgba(0, 255, 255, 0.55)"
            strokeWidth="1.2"
            strokeDasharray="150 2490"
            strokeLinecap="round"
          />
          <circle cx="450" cy="30" r="2.6" fill="#00ffff" fillOpacity="0.75" />
        </g>
        <g className="hero-arc hero-arc-slow">
          <circle
            cx="450"
            cy="450"
            r="318"
            stroke="rgba(143, 0, 255, 0.5)"
            strokeWidth="1.2"
            strokeDasharray="70 1930"
            strokeLinecap="round"
          />
          <circle cx="450" cy="132" r="2" fill="#c9a4ff" fillOpacity="0.7" />
        </g>
      </svg>
    </div>
  );
}
