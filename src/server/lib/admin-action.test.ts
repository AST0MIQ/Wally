import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

// Replace the session guards so this stays a pure node unit test (no next-auth).
vi.mock("@/server/lib/guards", () => ({
  requireAdmin: vi.fn(),
  requireCapability: vi.fn(),
  requirePermission: vi.fn(),
  requireAnyPermission: vi.fn(),
  requireSuperAdmin: vi.fn(),
}));

import { adminAction } from "@/server/lib/admin-action";
import {
  requireAdmin,
  requireAnyPermission,
  requireCapability,
  requirePermission,
  requireSuperAdmin,
} from "@/server/lib/guards";
import { AppError } from "@/server/lib/errors";

const echo = adminAction(
  z.object({ v: z.number() }),
  async ({ input, admin }) => ({ v: input.v, by: admin.id }),
  { name: "test", capability: "cosmetics:write" },
);

describe("adminAction", () => {
  it("runs the handler for an authorised admin", async () => {
    vi.mocked(requireCapability).mockResolvedValueOnce({ id: "admin1" } as never);
    const res = await echo({ v: 41 });
    expect(res).toEqual({ ok: true, data: { v: 41, by: "admin1" } });
  });

  it("returns a fail result when the capability check throws FORBIDDEN", async () => {
    vi.mocked(requireCapability).mockRejectedValueOnce(
      new AppError("missing capability: cosmetics:write", "FORBIDDEN"),
    );
    const res = await echo({ v: 1 });
    expect(res.ok).toBe(false);
  });

  it("rejects invalid input with validation_error", async () => {
    vi.mocked(requireCapability).mockResolvedValueOnce({ id: "admin1" } as never);
    const res = await echo({ v: "nope" } as never);
    expect(res).toMatchObject({ ok: false, error: "validation_error" });
  });

  it("falls back to requireAdmin when no capability is set", async () => {
    const plain = adminAction(z.object({}), async ({ admin }) => admin.id, {
      name: "plain",
    });
    vi.mocked(requireAdmin).mockResolvedValueOnce({ id: "admin2" } as never);
    const res = await plain({});
    expect(res).toEqual({ ok: true, data: "admin2" });
  });

  it("routes { superAdmin: true } through requireSuperAdmin", async () => {
    const sa = adminAction(z.object({}), async ({ admin }) => admin.id, {
      superAdmin: true,
    });
    vi.mocked(requireSuperAdmin).mockResolvedValueOnce({ id: "root" } as never);
    expect(await sa({})).toEqual({ ok: true, data: "root" });

    vi.mocked(requireSuperAdmin).mockRejectedValueOnce(
      new AppError("requires SUPER_ADMIN", "FORBIDDEN"),
    );
    expect((await sa({})).ok).toBe(false);
  });

  it("routes { permission } through requirePermission and { anyPermission } through requireAnyPermission", async () => {
    const p = adminAction(z.object({}), async ({ admin }) => admin.id, {
      permission: "roles.write",
    });
    vi.mocked(requirePermission).mockResolvedValueOnce({ id: "a" } as never);
    expect(await p({})).toEqual({ ok: true, data: "a" });

    const anyP = adminAction(z.object({}), async ({ admin }) => admin.id, {
      anyPermission: ["collections.write", "assets.write"],
    });
    vi.mocked(requireAnyPermission).mockResolvedValueOnce({ id: "b" } as never);
    expect(await anyP({})).toEqual({ ok: true, data: "b" });
  });
});
