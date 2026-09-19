/**
 * Derives Loop's brand assets from the source wordmark.
 *
 * The source is a JPEG of green-on-black, so it carries compression artifacts and a
 * soft glow. We rebuild every asset as a clean PNG: alpha comes from the green
 * channel (with the halo floored off), and colour is flattened to the exact brand
 * green. That kills the artifacts and gives us transparency for free.
 *
 *   npm run brand
 */
import sharp from "sharp";
import { mkdir } from "fs/promises";

const SRC = "public/brand/loop-wordmark.jpg";
const OUT = "public/brand";
const GREEN = { r: 0x40, g: 0xf8, b: 0x30 };
const BLACK = { r: 10, g: 10, b: 11 }; // matches --bg in globals.css

const GLOW_FLOOR = 0.10; // alpha below this is halo, not ink

/** Rebuild as premultiplied-clean RGBA: flat brand green, alpha from the green channel. */
async function toAlpha(input) {
  const img = sharp(input);
  const { width, height } = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(width * height * 4);
  for (let p = 0, q = 0; p < data.length; p += 3, q += 4) {
    let a = data[p + 1] / 255;
    a = Math.max(0, (a - GLOW_FLOOR) / (1 - GLOW_FLOOR));
    out[q] = GREEN.r;
    out[q + 1] = GREEN.g;
    out[q + 2] = GREEN.b;
    out[q + 3] = Math.round(Math.min(1, a) * 255);
  }
  return sharp(out, { raw: { width, height, channels: 4 } });
}

/** Tight bounding box of non-transparent pixels, optionally within an x range. */
async function inkBox(img, x0 = 0, x1 = Infinity) {
  const { width, height } = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = Math.max(0, x0); x < Math.min(width, x1); x++) {
      if (data[(y * width + x) * 4 + 3] < 24) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/** Centre `img` on a square canvas of `size`, scaled to `inset` of the width. */
async function square(img, size, inset, background) {
  const meta = await img.metadata();
  const target = Math.round(size * inset);
  const scale = Math.min(target / meta.width, target / meta.height);
  const w = Math.round(meta.width * scale);
  const h = Math.round(meta.height * scale);
  const layer = await img.resize(w, h).png().toBuffer();
  return sharp({
    create: { width: size, height: h > 0 ? size : size, channels: 4, background },
  }).composite([{ input: layer, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }]);
}

await mkdir(OUT, { recursive: true });

const flat = await toAlpha(SRC);
const flatBuf = await flat.png().toBuffer();

// --- Full wordmark, trimmed ---
const wordBox = await inkBox(sharp(flatBuf));
const wordmark = sharp(flatBuf).extract(wordBox);
const wordmarkBuf = await wordmark.png().toBuffer();
await sharp(wordmarkBuf).png({ compressionLevel: 9 }).toFile(`${OUT}/loop-wordmark.png`);

// --- The infinity mark alone (the "oo"), between the two letter gaps ---
// gaps measured by scripts/brand/analyze.mjs: l ends ~874, p starts ~1871
const markBox = await inkBox(sharp(flatBuf), 930, 1822);
await sharp(flatBuf).extract(markBox).png({ compressionLevel: 9 }).toFile(`${OUT}/loop-mark.png`);
const markBuf = await sharp(flatBuf).extract(markBox).png().toBuffer();

// --- Square app icon: the full wordmark on Loop black. This is what WHOOP gets.
// The `l` and `p` have to stay readable — the infinity alone reads as a generic
// infinity symbol and loses the name entirely, which is the whole point of a
// pairing logo sitting next to the WHOOP mark on the consent screen. ---
for (const size of [1024, 512, 180]) {
  const icon = await square(sharp(wordmarkBuf), size, 0.84, BLACK);
  await icon.png({ compressionLevel: 9 }).toFile(`${OUT}/loop-icon-${size}.png`);
}

// --- Wordmark on black, for decks and social ---
const onBlack = await square(sharp(wordmarkBuf), 1024, 0.78, BLACK);
await onBlack.png({ compressionLevel: 9 }).toFile(`${OUT}/loop-wordmark-black.png`);

// --- The mark alone, squared. Kept for places too small for four letters. ---
for (const size of [512, 180]) {
  const icon = await square(sharp(markBuf), size, 0.62, BLACK);
  await icon.png({ compressionLevel: 9 }).toFile(`${OUT}/loop-markicon-${size}.png`);
}

// --- Favicons: wordmark at apple-icon size, mark alone at 32px where four
// letters would be illegible. ---
await sharp(await (await square(sharp(markBuf), 256, 0.68, BLACK)).png().toBuffer())
  .resize(32, 32)
  .png()
  .toFile("app/icon.png");
await sharp(await (await square(sharp(wordmarkBuf), 180, 0.84, BLACK)).png().toBuffer())
  .toFile("app/apple-icon.png");

console.log("wordmark", wordBox);
console.log("mark", markBox);
console.log("done");
