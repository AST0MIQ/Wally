/**
 * Generate PWA icons + iOS splash screens from src/app/icon.svg.
 *   pnpm tsx scripts/gen-pwa-assets.ts
 * Outputs to public/icons/ and public/splash/.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src/app/icon.svg");
const ICONS = path.join(ROOT, "public/icons");
const SPLASH = path.join(ROOT, "public/splash");

const BG = "#4f46e5";

async function icon(size: number, name: string, padRatio = 0) {
  const svg = await readFile(SRC);
  const inner = Math.round(size * (1 - padRatio * 2));
  const logo = await sharp(svg).resize(inner, inner).png().toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: padRatio > 0 ? BG : { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(path.join(ICONS, name));
  console.log("icon", name);
}

// iPhone / iPad portrait splash sizes (css px * dpr)
const SPLASHES: Array<[number, number, string]> = [
  [1170, 2532, "iphone-13"],
  [1284, 2778, "iphone-13-pro-max"],
  [1179, 2556, "iphone-15"],
  [1290, 2796, "iphone-15-pro-max"],
  [1125, 2436, "iphone-x"],
  [828, 1792, "iphone-xr"],
  [750, 1334, "iphone-8"],
  [1536, 2048, "ipad"],
  [1668, 2388, "ipad-pro-11"],
  [2048, 2732, "ipad-pro-12"],
];

async function splash(w: number, h: number, name: string) {
  const svg = await readFile(SRC);
  const s = Math.round(Math.min(w, h) * 0.28);
  const logo = await sharp(svg).resize(s, s).png().toBuffer();
  await sharp({
    create: { width: w, height: h, channels: 4, background: BG },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(path.join(SPLASH, `${name}.png`));
  console.log("splash", name, `${w}x${h}`);
}

async function main() {
  await mkdir(ICONS, { recursive: true });
  await mkdir(SPLASH, { recursive: true });

  await icon(192, "icon-192.png");
  await icon(512, "icon-512.png");
  await icon(512, "icon-maskable-512.png", 0.14); // safe-zone padding on brand bg
  await icon(180, "apple-touch-icon.png", 0.1);
  await icon(32, "favicon-32.png");

  for (const [w, h, name] of SPLASHES) await splash(w, h, name);

  // manifest json listing for the splash <link> tags
  await writeFile(
    path.join(SPLASH, "index.json"),
    JSON.stringify(
      SPLASHES.map(([w, h, name]) => ({ w, h, href: `/splash/${name}.png` })),
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
