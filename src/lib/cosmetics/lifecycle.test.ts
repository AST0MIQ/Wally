import { describe, expect, it } from "vitest";

import { wasEverPublished } from "@/lib/cosmetics/lifecycle";

describe("wasEverPublished — the permanent immutability marker", () => {
  it("a fresh record (publishedAt null) is NOT frozen", () => {
    expect(wasEverPublished({ publishedAt: null })).toBe(false);
  });

  it("a record whose publishedAt was dropped to undefined by a client/serialization boundary is NOT frozen", () => {
    expect(wasEverPublished({ publishedAt: undefined })).toBe(false);
    expect(wasEverPublished({} as { publishedAt?: Date | null })).toBe(false);
  });

  it("a record with a real timestamp IS frozen (Date or ISO string)", () => {
    expect(wasEverPublished({ publishedAt: new Date() })).toBe(true);
    expect(wasEverPublished({ publishedAt: "2026-09-08T10:00:00.000Z" })).toBe(true);
  });
});
