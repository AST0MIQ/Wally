import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { describeDb, hasDb } from "./_db";

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
  detachAsset,
  setCollectionStatus,
  duplicateCollection,
} from "@/server/services/cosmetics/collection.service";
import {
  grantAsset,
  grantCollection,
  revokeEntitlement,
  hasEntitlement,
  listUserInventory,
  listApplicableCollections,
} from "@/server/services/cosmetics/entitlement.service";
import {
  equip,
  applyCollection,
  getResolvedLoadout,
  resetToDefaults,
} from "@/server/services/cosmetics/loadout.service";


const uniq = () => Math.random().toString(36).slice(2, 8);

describeDb("cosmetics integration (DB)", () => {
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

  it("[4] expiry boundary: expiresAt <= now is not owned across all readers", async () => {
    const asset = await makePublishedAsset("CHART_STYLE");
    await grantAsset(adminId, userId, asset);
    // still owned with a future expiry
    await prisma.userEntitlement.update({
      where: { userId_assetId: { userId, assetId: asset } },
      data: { expiresAt: new Date(Date.now() + 60_000) },
    });
    expect(await hasEntitlement(userId, asset)).toBe(true);
    let inv = await listUserInventory(userId);
    expect(inv.items.find((i) => i.assetId === asset)?.owned).toBe(true);

    // expired -> not owned everywhere
    await prisma.userEntitlement.update({
      where: { userId_assetId: { userId, assetId: asset } },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await hasEntitlement(userId, asset)).toBe(false);
    inv = await listUserInventory(userId);
    expect(inv.items.find((i) => i.assetId === asset)?.owned).toBe(false);

    // and in listApplicableCollections
    const c = await createCollection(adminId, {
      slug: `c-${uniq()}`, name: "Exp", rarity: "COMMON", isApplicableAsSet: true,
    });
    created.collections.push(c.id);
    await attachAsset(adminId, c.id, asset);
    await setCollectionStatus(adminId, c.id, "PUBLISHED");
    const apps = await listApplicableCollections(userId);
    expect(apps.find((a) => a.id === c.id)?.fullyOwned).toBe(false);
    expect(apps.find((a) => a.id === c.id)?.applicable).toBe(false);
  });

  it("[4] once published, collection membership is frozen forever (even after PUBLISHED->DRAFT)", async () => {
    const c = await createCollection(adminId, {
      slug: `c-${uniq()}`, name: "Frozen", rarity: "COMMON", isApplicableAsSet: true,
    });
    created.collections.push(c.id);
    const a1 = await makePublishedAsset("TYPOGRAPHY");
    await attachAsset(adminId, c.id, a1); // never-published -> ok
    await setCollectionStatus(adminId, c.id, "PUBLISHED");

    const a2 = await makePublishedAsset("ICON_SET");
    await expect(attachAsset(adminId, c.id, a2)).rejects.toThrow(/frozen/);
    await expect(detachAsset(adminId, c.id, a1)).rejects.toThrow(/frozen/);

    // PUBLISHED -> HIDDEN / ARCHIVED allowed
    await expect(setCollectionStatus(adminId, c.id, "HIDDEN")).resolves.toBeTruthy();
    await expect(setCollectionStatus(adminId, c.id, "ARCHIVED")).resolves.toBeTruthy();

    // PUBLISHED -> DRAFT is allowed but membership stays frozen (publishedAt set)
    await setCollectionStatus(adminId, c.id, "DRAFT");
    await expect(attachAsset(adminId, c.id, a2)).rejects.toThrow(/frozen/);
    await expect(detachAsset(adminId, c.id, a1)).rejects.toThrow(/frozen/);

    // the revised-set path: duplicate into a fresh editable draft
    const copy = await duplicateCollection(adminId, c.id, `c-${uniq()}`);
    created.collections.push(copy.id);
    expect(copy.status).toBe("DRAFT");
    expect(copy.publishedAt).toBeNull();
    await expect(detachAsset(adminId, copy.id, a1)).resolves.toBeUndefined();
  });

  it("[6] applyCollection re-checks PUBLISHED at apply time inside the tx", async () => {
    const c = await createCollection(adminId, {
      slug: `c-${uniq()}`, name: "Live", rarity: "RARE", isApplicableAsSet: true,
    });
    created.collections.push(c.id);
    const bg = await makePublishedAsset("APP_BACKGROUND");
    const card = await makePublishedAsset("OVERVIEW_CARD");
    await attachAsset(adminId, c.id, bg);
    await attachAsset(adminId, c.id, card);
    await setCollectionStatus(adminId, c.id, "PUBLISHED");
    await grantCollection(adminId, userId, c.id);

    // hide one asset AFTER publish -> apply must fail, loadout unchanged
    await setAssetStatus(adminId, card, "HIDDEN");
    const before = await getResolvedLoadout(userId);
    await expect(applyCollection(userId, c.id)).rejects.toThrow(/unpublished/);
    const after = await getResolvedLoadout(userId);
    expect(after).toEqual(before);
  });

  it("[9] inventory reports real CollectionAsset membership (multi-collection)", async () => {
    const asset = await makePublishedAsset("INTERACTION_EFFECT");
    const c1 = await createCollection(adminId, {
      slug: `c-${uniq()}`, name: "M1", rarity: "COMMON", isApplicableAsSet: true,
    });
    const c2 = await createCollection(adminId, {
      slug: `c-${uniq()}`, name: "M2", rarity: "COMMON", isApplicableAsSet: true,
    });
    created.collections.push(c1.id, c2.id);
    await attachAsset(adminId, c1.id, asset);
    await attachAsset(adminId, c2.id, asset);
    await grantAsset(adminId, userId, asset);

    const inv = await listUserInventory(userId);
    const row = inv.items.find((i) => i.assetId === asset);
    expect(row?.collectionIds.sort()).toEqual([c1.id, c2.id].sort());
    // validated config only — never the raw JSON column shape
    expect(row?.config).toBeTypeOf("object");
    expect(row?.configVersion).toBe(1);
  });

  it("[7] concurrency: published config never changes under a publish/update race", async () => {
    // N concurrent config updates on an already-published asset -> all reject,
    // config unchanged.
    const a = await makePublishedAsset("CELEBRATION_EFFECT");
    const original = (await prisma.cosmeticAsset.findUniqueOrThrow({
      where: { id: a },
      select: { config: true },
    })).config;
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, (_, i) =>
        updateAsset(adminId, { id: a, config: { intensity: i % 2 ? "HIGH" : "LOW" } }),
      ),
    );
    expect(results.every((r) => r.status === "rejected")).toBe(true);
    const afterCfg = (await prisma.cosmeticAsset.findUniqueOrThrow({
      where: { id: a },
      select: { config: true },
    })).config;
    expect(afterCfg).toEqual(original);

    // Race: flip DRAFT->PUBLISHED while updating config. Either interleaving is
    // legitimate (a draft may be edited then published) — the invariant is that
    // ONCE PUBLISHED the config can never change again.
    const d = await createAsset(adminId, {
      slug: `t-${uniq()}`, name: "race", slot: "OVERVIEW_CARD" as never,
      rarity: "COMMON", acquisitionType: "ADMIN_GRANT",
      config: { surface: "FLAT" },
    });
    created.assets.push(d.id);
    await Promise.allSettled([
      setAssetStatus(adminId, d.id, "PUBLISHED"),
      updateAsset(adminId, { id: d.id, config: { surface: "GLASS" } }),
    ]);
    const settled = await prisma.cosmeticAsset.findUniqueOrThrow({
      where: { id: d.id },
      select: { status: true, publishedAt: true, config: true },
    });
    if (settled.publishedAt !== null) {
      const frozenCfg = settled.config;
      // a further config update must now be rejected, and the config must not move
      await expect(
        updateAsset(adminId, { id: d.id, config: { surface: "ELEVATED" } }),
      ).rejects.toThrow(/config_locked/);
      const stillCfg = (await prisma.cosmeticAsset.findUniqueOrThrow({
        where: { id: d.id },
        select: { config: true },
      })).config;
      expect(stillCfg).toEqual(frozenCfg);
    } else {
      // never published -> publishing now must still work and then freeze
      await setAssetStatus(adminId, d.id, "PUBLISHED");
      await expect(
        updateAsset(adminId, { id: d.id, config: { surface: "ELEVATED" } }),
      ).rejects.toThrow(/config_locked/);
    }
  });
});
