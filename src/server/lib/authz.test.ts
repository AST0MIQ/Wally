import { describe, expect, it } from "vitest";

import { can, roleOf, type Capability } from "@/server/lib/authz";

const ALL_CAPS: Capability[] = [
  "cosmetics:write",
  "cosmetics:publish",
  "entitlement:grant",
  "entitlement:revoke",
  "rewardRule:write",
  "audit:read",
  "user:read",
];

describe("authz capability ladder", () => {
  it("maps the boolean role onto the capability ladder", () => {
    expect(roleOf({ role: "ADMIN" })).toBe("SUPER_ADMIN");
    expect(roleOf({ role: "USER" })).toBe("USER");
  });

  it("grants every capability to an ADMIN (Phase 1 = SUPER_ADMIN)", () => {
    for (const cap of ALL_CAPS) {
      expect(can({ role: "ADMIN" }, cap)).toBe(true);
    }
  });

  it("denies every capability to a plain USER", () => {
    for (const cap of ALL_CAPS) {
      expect(can({ role: "USER" }, cap)).toBe(false);
    }
  });
});
