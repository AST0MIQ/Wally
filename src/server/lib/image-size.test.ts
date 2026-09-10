import { describe, expect, it } from "vitest";

import { imageSize } from "@/server/lib/image-size";

const png = (w: number, h: number) => {
  const b = new Uint8Array(24);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  b.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"
  new DataView(b.buffer).setUint32(16, w);
  new DataView(b.buffer).setUint32(20, h);
  return b;
};

const gif = (w: number, h: number) => {
  const b = new Uint8Array(10);
  b.set([..."GIF89a"].map((c) => c.charCodeAt(0)), 0);
  const view = new DataView(b.buffer);
  view.setUint16(6, w, true);
  view.setUint16(8, h, true);
  return b;
};

const jpeg = (w: number, h: number) => {
  // SOI, an APP0 segment to skip over, then an SOF0 carrying the dimensions.
  const b = new Uint8Array(30);
  const view = new DataView(b.buffer);
  b.set([0xff, 0xd8], 0);
  b.set([0xff, 0xe0], 2);
  view.setUint16(4, 6); // APP0 length, payload ignored
  b.set([0xff, 0xc0], 10);
  view.setUint16(12, 17); // SOF0 length
  b[14] = 8; // sample precision
  view.setUint16(15, h);
  view.setUint16(17, w);
  return b;
};

const webpBase = (chunk: string, extra: number) => {
  const b = new Uint8Array(20 + extra);
  b.set([..."RIFF"].map((c) => c.charCodeAt(0)), 0);
  b.set([..."WEBP"].map((c) => c.charCodeAt(0)), 8);
  b.set([...chunk].map((c) => c.charCodeAt(0)), 12);
  return b;
};

const webpLossy = (w: number, h: number) => {
  const b = webpBase("VP8 ", 20);
  b.set([0x9d, 0x01, 0x2a], 23); // sync code
  const view = new DataView(b.buffer);
  view.setUint16(26, w, true);
  view.setUint16(28, h, true);
  return b;
};

const webpLossless = (w: number, h: number) => {
  const b = webpBase("VP8L", 20);
  b[20] = 0x2f;
  const bits = ((w - 1) & 0x3fff) | (((h - 1) & 0x3fff) << 14);
  new DataView(b.buffer).setUint32(21, bits >>> 0, true);
  return b;
};

const webpExtended = (w: number, h: number) => {
  const b = webpBase("VP8X", 20);
  const put24 = (offset: number, value: number) => {
    b[offset] = value & 0xff;
    b[offset + 1] = (value >> 8) & 0xff;
    b[offset + 2] = (value >> 16) & 0xff;
  };
  put24(24, w - 1);
  put24(27, h - 1);
  return b;
};

describe("imageSize", () => {
  it("reads PNG dimensions", () => {
    expect(imageSize(png(1170, 2532))).toEqual({ width: 1170, height: 2532 });
  });

  it("reads GIF dimensions", () => {
    expect(imageSize(gif(320, 240))).toEqual({ width: 320, height: 240 });
  });

  it("reads JPEG dimensions past an earlier segment", () => {
    expect(imageSize(jpeg(1280, 720))).toEqual({ width: 1280, height: 720 });
  });

  it("reads all three WebP variants", () => {
    expect(imageSize(webpLossy(640, 480))).toEqual({ width: 640, height: 480 });
    expect(imageSize(webpLossless(1080, 1920))).toEqual({ width: 1080, height: 1920 });
    expect(imageSize(webpExtended(4000, 3000))).toEqual({ width: 4000, height: 3000 });
  });

  it("returns null rather than guessing at unreadable bytes", () => {
    expect(imageSize(new Uint8Array(0))).toBeNull();
    expect(imageSize(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))).toBeNull();
    expect(imageSize(png(0, 0))).toBeNull();
  });
});
