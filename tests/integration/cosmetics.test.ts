import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/server/db";
import { AppError } from "@/server/lib/errors";
import {
  createAsset,
  setAssetStatus,
  updateAsset,
  duplicateAsset,
  deleteAsset,
} from "@/server/services/cosmetics/asset.service";
import {
  createCollection,
  attachAsset,
  setCollectionStatus,
} from "@/server/services/cosmetics/collection.service";
import {
  grantAsset,
  grantCollection,
  revokeEntitlement,
  hasEntitlement,
} from "@/server/services/cosmetics/entitlement.service";
import {
  equip,
  applyCollection,
  getResolvedLoadout,
  resetToDefaults,
} from "@/server/services/cosmetics/loadout.service";

const hasDb = await prisma
  .$queryRaw`SELECT 1`.then(() => true)
  .catch(() => false);

const uniq = () => Math.random().toString(36).slice(2, 8);

describe.skipIf(!hasDb)("cosmetics integration (DB)", () => {
  let adminId = "";
  let userId = "";
  const created = { assets: [] as string[], collections: [] as string[], users: [] as string[] };

  async function makePublishedAsset(slot: string) {
    const a = await createAsset(adminId, {
      slug: `t-${uniq()}`,
      name: `T ${slot}`,
      slot: slot as never,
      rarity: "COMMON",
      acquisitionType: "ADMIN_GRANT",
      config: { lightCompatible: true, darkCompatible: true },
    });
    created.assets.push(a.id);
    await setAssetStatus(adminId, a.id, "PUBLISHED");
    return a.id;
  }

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: { email: `vitest-admin+${Date.now()}@wally.local`, role: "ADMIN" },
    });
    const user = await prisma.user.create({
      data: { email: `vitest-user+${Date.now()}@wally.local` },
    });
    adminId = admin.id;
    userId = user.id;
    created.users.push(admin.id, user.id);
  });

  afterAll(async () => {
    // unwind in FK-safe order
    await prisma.userEquippedAsset.deleteMany({ where: { userId: { in: created.users } } });
    await prisma.userEntitlement.deleteMany({ where: { userId: { in: created.users } } });
    await prisma.collectionAsset.deleteMany({
      where: { collectionId: { in: created.collections } },
    });
    await prisma.rewardRule.deleteMany({
      where: { OR: [{ grantsAssetId: { in: created.assets } }, { grantsCollectionId: { in: created.collections } }] },
    });
    await prisma.cosmeticCollection.deleteMany({ where: { id: { in: created.collections } } });
    await prisma.cosmeticAsset.deleteMany({ where: { id: { in: created.assets } } });
    await prisma.auditLog.deleteMany({ where: { userId: { in: created.users } } });
    await prisma.user.deleteMany({ where: { id: { in: created.users } } });
    await prisma.$disconnect();
  });

  it("[fallback] a user with no equipped rows resolves to an all-null loadout", async () => {
    const loadout = await getResolvedLoadout(userId);
    expect(Object.values(loadout).every((v) => v === null)).toBe(true);
  });

  it("[entitlement] equip requires ownership; DEFAULT assets need no row", async () => {
    const assetId = await makePublishedAsset("PROFILE_BADGE");
    await expect(equip(userId, "PROFILE_BADGE" as never, assetId)).rejects.toThrow(
      AppError,
    );

    await grantAsset(adminId, userId, assetId);
    expect(await hasEntitlement(userId, assetId)).toBe(true);
    await equip(userId, "PROFILE_BADGE" as never, assetId);

    const loadout = await getResolvedLoadout(userId);
    expect(loadout.PROFILE_BADGE?.assetId).toBe(assetId);
  });

  it("[S3] equipping into the wrong slot is rejected", async () => {
    const assetId = await makePublishedAsset("PROFILE_FRAME");
    await grantAsset(adminId, userId, assetId);
    await expect(
      equip(userId, "OVERVIEW_CARD" as never, assetId),
    ).rejects.toThrow(/wrong_slot/);
  });

  it("[S1] a collection cannot hold two assets for the same slot", async () => {
    const c = await createCollection(adminId, {
      slug: `c-${uniq()}`,
      name: "C",
      rarity: "COMMON",
      isApplicableAsSet: true,
    });
    created.collections.push(c.id);
    const a1 = await makePublishedAsset("APP_BACKGROUND");
    const a2 = await makePublishedAsset("APP_BACKGROUND");
    await attachAsset(adminId, c.id, a1);
    await expect(attachAsset(adminId, c.id, a2)).rejects.toThrow(
      /slot_taken_in_collection/,
    );
  });

  it("[S4] publishing a collection with a draft asset is blocked", async () => {
    const c = await createCollection(adminId, {
      slug: `c-${uniq()}`,
      name: "C",
      rarity: "COMMON",
      isApplicableAsSet: true,
    });
    created.collections.push(c.id);
    const draft = await createAsset(adminId, {
      slug: `t-${uniq()}`,
      name: "draft",
      slot: "OVERVIEW_CARD" as never,
      rarity: "COMMON",
      acquisitionType: "ADMIN_GRANT",
      config: {},
    });
    created.assets.push(draft.id);
    await attachAsset(adminId, c.id, draft.id);
    await expect(
      setCollectionStatus(adminId, c.id, "PUBLISHED"),
    ).rejects.toThrow(/unpublished/);
  });

  it("[apply] applies every slot, reports replaced, and is all-or-nothing", async () => {
    const c = await createCollection(adminId, {
      slug: `c-${uniq()}`,
      name: "Set",
      rarity: "RARE",
      isApplicableAsSet: true,
    });
    created.collections.push(c.id);
    const bg = await makePublishedAsset("APP_BACKGROUND");
    const frame = await makePublishedAsset("PROFILE_FRAME");
    await attachAsset(adminId, c.id, bg);
    await attachAsset(adminId, c.id, frame);
    await setCollectionStatus(adminId, c.id, "PUBLISHED");

    // not fully owned -> whole apply fails, nothing equipped
    await grantAsset(adminId, userId, bg);
    await expect(applyCollection(userId, c.id)).rejects.toThrow(/not_fully_owned/);
    let loadout = await getResolvedLoadout(userId);
    expect(loadout.APP_BACKGROUND).toBeNull();

    // own everything -> applies
    await grantCollection(adminId, userId, c.id);
    const res = await applyCollection(userId, c.id);
    expect(res.equipped.map((e) => e.slot).sort()).toEqual([
      "APP_BACKGROUND",
      "PROFILE_FRAME",
    ]);
    loadout = await getResolvedLoadout(userId);
    expect(loadout.APP_BACKGROUND?.assetId).toBe(bg);
    expect(loadout.PROFILE_FRAME?.assetId).toBe(frame);
  });

  it("[mixed] assets from two collections coexist in one loadout", async () => {
    const other = await makePublishedAsset("PROFILE_AURA");
    await grantAsset(adminId, userId, other);
    await equip(userId, "PROFILE_AURA" as never, other);
    const loadout = await getResolvedLoadout(userId);
    // PROFILE_AURA from the ad-hoc grant + APP_BACKGROUND/PROFILE_FRAME from the set
    expect(loadout.PROFILE_AURA?.assetId).toBe(other);
    expect(loadout.APP_BACKGROUND).not.toBeNull();
  });

  it("[S6] published config is immutable; duplicate makes an editable draft", async () => {
    const assetId = await makePublishedAsset("INVESTMENT_CARD");
    await expect(
      updateAsset(adminId, { id: assetId, config: { surface: "GLASS" } }),
    ).rejects.toThrow(/config_locked/);
    // metadata still editable
    await updateAsset(adminId, { id: assetId, name: "renamed" });
    const copy = await duplicateAsset(adminId, assetId, `t-${uniq()}`);
    created.assets.push(copy.id);
    expect(copy.status).toBe("DRAFT");
    await updateAsset(adminId, { id: copy.id, config: { surface: "GLASS" } });
  });

  it("[idempotent] grantAsset twice = one row; re-grant after revoke reactivates", async () => {
    const assetId = await makePublishedAsset("OVERVIEW_CARD");
    const g1 = await grantAsset(adminId, userId, assetId);
    const g2 = await grantAsset(adminId, userId, assetId);
    expect(g2.id).toBe(g1.id);
    const rows = await prisma.userEntitlement.count({ where: { userId, assetId } });
    expect(rows).toBe(1);

    await revokeEntitlement(adminId, userId, assetId);
    expect(await hasEntitlement(userId, assetId)).toBe(false);
    const g3 = await grantAsset(adminId, userId, assetId);
    expect(g3.id).toBe(g1.id);
    expect(g3.firstGrantedAt.getTime()).toBe(g1.firstGrantedAt.getTime());
    expect(await hasEntitlement(userId, assetId)).toBe(true);
  });

  it("[S7] a failed audit rolls back the mutation (single atomic path)", async () => {
    // point the audit FK at a non-existent user so tx.auditLog.create throws
    const assetId = await makePublishedAsset("PROFILE_BADGE");
    await expect(grantAsset("does-not-exist", userId, assetId)).rejects.toThrow();
    const leaked = await prisma.userEntitlement.count({
      where: { userId, assetId, grantedByAdminId: "does-not-exist" },
    });
    expect(leaked).toBe(0);
  });

  it("[S5] deletion: DRAFT-only + zero refs; archive always works", async () => {
    const assetId = await makePublishedAsset("PROFILE_FRAME");
    await grantAsset(adminId, userId, assetId);
    await expect(deleteAsset(adminId, assetId)).rejects.toThrow(/references/);
    await expect(setAssetStatus(adminId, assetId, "ARCHIVED")).resolves.toBeTruthy();

    const draft = await createAsset(adminId, {
      slug: `t-${uniq()}`,
      name: "throwaway",
      slot: "HEADER" as never,
      rarity: "COMMON",
      acquisitionType: "ADMIN_GRANT",
      config: {},
    });
    await expect(deleteAsset(adminId, draft.id)).resolves.toBeUndefined();
  });

  it("[fallback] resetToDefaults clears the loadout", async () => {
    await resetToDefaults(userId);
    const loadout = await getResolvedLoadout(userId);
    expect(Object.values(loadout).every((v) => v === null)).toBe(true);
  });
});
