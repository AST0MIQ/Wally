import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

// Replace the session guards so this stays a pure node unit test (no next-auth).
vi.mock("@/server/lib/guards", () => ({
  requireAdmin: vi.fn(),
  requireCapability: vi.fn(),
}));

import { adminAction } from "@/server/lib/admin-action";
import { requireAdmin, requireCapability } from "@/server/lib/guards";
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
});
