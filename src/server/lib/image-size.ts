/**
 * Pixel dimensions read straight from an image file's header.
 *
 * Covers exactly the four formats the media library accepts (PNG, JPEG, GIF,
 * WebP) and reads only the header bytes, so there is no decode cost and no
 * image dependency in the serverless runtime. Returns null for anything it
 * cannot read with certainty — callers treat dimensions as advisory metadata.
 */

export type ImageSize = { width: number; height: number };

const u16be = (b: Uint8Array, i: number) => ((b[i] ?? 0) << 8) | (b[i + 1] ?? 0);
const u16le = (b: Uint8Array, i: number) => (b[i] ?? 0) | ((b[i + 1] ?? 0) << 8);
const u24le = (b: Uint8Array, i: number) =>
  (b[i] ?? 0) | ((b[i + 1] ?? 0) << 8) | ((b[i + 2] ?? 0) << 16);
const u32be = (b: Uint8Array, i: number) =>
  (((b[i] ?? 0) << 24) | ((b[i + 1] ?? 0) << 16) | ((b[i + 2] ?? 0) << 8) | (b[i + 3] ?? 0)) >>> 0;

const ascii = (b: Uint8Array, i: number, len: number) =>
  String.fromCharCode(...b.slice(i, i + len));

function pngSize(b: Uint8Array): ImageSize | null {
  // 8-byte signature, then an IHDR chunk whose width/height are big-endian u32.
  if (b.length < 24) return null;
  if (u32be(b, 0) !== 0x89504e47 || u32be(b, 4) !== 0x0d0a1a0a) return null;
  if (ascii(b, 12, 4) !== "IHDR") return null;
  return { width: u32be(b, 16), height: u32be(b, 20) };
}

function gifSize(b: Uint8Array): ImageSize | null {
  if (b.length < 10) return null;
  const header = ascii(b, 0, 6);
  if (header !== "GIF87a" && header !== "GIF89a") return null;
  return { width: u16le(b, 6), height: u16le(b, 8) };
}

function jpegSize(b: Uint8Array): ImageSize | null {
  // Walk the marker segments until a start-of-frame carries the dimensions.
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i += 1; // resync past fill bytes / entropy-coded data
      continue;
    }
    const marker = b[i + 1] ?? 0;
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    // Standalone markers carry no length payload.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2;
      continue;
    }
    const length = u16be(b, i + 2);
    if (length < 2) return null;
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSof) return { width: u16be(b, i + 7), height: u16be(b, i + 5) };
    i += 2 + length;
  }
  return null;
}

function webpSize(b: Uint8Array): ImageSize | null {
  if (b.length < 30) return null;
  if (ascii(b, 0, 4) !== "RIFF" || ascii(b, 8, 4) !== "WEBP") return null;
  const chunk = ascii(b, 12, 4);
  if (chunk === "VP8 ") {
    // Lossy: 3-byte frame tag, 3-byte sync code, then 14-bit dimensions.
    return { width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    // Lossless: 1-byte signature then 14 bits of width-1 and 14 bits of height-1.
    if (b[20] !== 0x2f) return null;
    const bits =
      ((b[21] ?? 0) | ((b[22] ?? 0) << 8) | ((b[23] ?? 0) << 16) | ((b[24] ?? 0) << 24)) >>> 0;
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") {
    // Extended: canvas size stored as 24-bit little-endian (value - 1).
    return { width: u24le(b, 24) + 1, height: u24le(b, 27) + 1 };
  }
  return null;
}

/** Dimensions of a PNG / JPEG / GIF / WebP buffer, or null if unreadable. */
export function imageSize(buffer: ArrayBuffer | Uint8Array): ImageSize | null {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const size =
    pngSize(bytes) ?? gifSize(bytes) ?? webpSize(bytes) ?? jpegSize(bytes);
  if (!size) return null;
  if (!Number.isFinite(size.width) || !Number.isFinite(size.height)) return null;
  if (size.width <= 0 || size.height <= 0) return null;
  return size;
}
