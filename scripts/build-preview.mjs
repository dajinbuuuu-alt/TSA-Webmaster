// Builds ./Preview: one self-contained file made from the real Vite build, so
// the shareable preview can never drift from the app. Fonts, CSS and JS are inlined.
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

const MIME = {
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
};

const ext = (file) => file.slice(file.lastIndexOf("."));
const fromDist = (href) => {
  const path = join(dist, href.replace(/^\//, ""));
  return { path, data: readFileSync(path) };
};
const dataUri = (href) => {
  const { path, data } = fromDist(href);
  return `data:${MIME[ext(path)] ?? "application/octet-stream"};base64,${data.toString("base64")}`;
};

let html = readFileSync(join(dist, "index.html"), "utf8");
let fontCount = 0;

// stylesheet, with every font turned into a data URI
html = html.replace(/<link[^>]*rel="stylesheet"[^>]*>/g, (tag) => {
  const href = /href="([^"]+)"/.exec(tag)?.[1];
  if (!href) throw new Error(`stylesheet without href: ${tag}`);
  let css = fromDist(href).data.toString("utf8");
  css = css.replace(/url\((["']?)(\/[^)"']+)\1\)/g, (_match, _quote, asset) => {
    fontCount += 1;
    return `url(${dataUri(asset)})`;
  });
  return `<style>${css}</style>`;
});

// entry module, inlined (no imports remain after the Vite build)
html = html.replace(/<script([^>]*)src="([^"]+)"([^>]*)><\/script>/g, (_tag, _before, src) => {
  const js = fromDist(src).data.toString("utf8").replace(/<\/script/gi, "<\\/script");
  return `<script type="module">${js}</script>`;
});

// favicon
html = html.replace(/<link[^>]*rel="icon"[^>]*>/, (tag) => {
  const href = /href="([^"]+)"/.exec(tag)?.[1];
  return href ? `<link rel="icon" href="${dataUri(href)}" />` : tag;
});

if (/\/assets\//.test(html)) throw new Error("Preview still references /assets/");

const out = join(root, "Preview");
writeFileSync(out, html);

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} kB`;
console.log(
  `Preview  ${kb(statSync(out).size)}  (${fontCount} fonts inlined, self-contained)`,
);
