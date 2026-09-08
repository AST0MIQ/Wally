import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  bootstrapAdminCount,
  bootstrapEmails,
  isBootstrapEmail,
  normalizeEmail,
} from "@/server/lib/rbac-bootstrap";

const ORIGINAL = process.env.ADMIN_EMAILS;

describe("rbac bootstrap (ADMIN_EMAILS)", () => {
  beforeEach(() => {
    delete process.env.ADMIN_EMAILS;
  });
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = ORIGINAL;
  });

  it("normalizes case and surrounding whitespace", () => {
    expect(normalizeEmail("  Admin@Example.COM ")).toBe("admin@example.com");
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(undefined)).toBe("");
  });

  it("matches an email regardless of case/whitespace", () => {
    process.env.ADMIN_EMAILS = " Root@Wally.io , owner@wally.io ";
    expect(isBootstrapEmail("root@wally.io")).toBe(true);
    expect(isBootstrapEmail("ROOT@WALLY.IO")).toBe(true);
    expect(isBootstrapEmail(" owner@wally.io ")).toBe(true);
    expect(isBootstrapEmail("someone@wally.io")).toBe(false);
  });

  it("empty / unset ADMIN_EMAILS matches nobody", () => {
    expect(isBootstrapEmail("anyone@wally.io")).toBe(false);
    expect(bootstrapEmails()).toEqual([]);
    expect(bootstrapAdminCount()).toBe(0);
    expect(isBootstrapEmail("")).toBe(false);
  });

  it("de-duplicates entries for the count", () => {
    process.env.ADMIN_EMAILS = "a@w.io, a@w.io , A@W.IO, b@w.io";
    expect(bootstrapAdminCount()).toBe(2);
    expect(bootstrapEmails().sort()).toEqual(["a@w.io", "b@w.io"]);
  });
});
