import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";
import { auditInTx } from "@/server/lib/audit";
import { conflict, notFound } from "@/server/lib/errors";
import { serializableTx } from "@/server/lib/tx";
import { grantAssetInTx } from "@/server/services/cosmetics/entitlement.service";

type Db = Prisma.TransactionClient;

/**
 * Reward rules — Phase 1 is admin CRUD only, no automation engine consumes
 * these yet. Each rule grants exactly one target (collection XOR asset),
 * enforced by Zod at the edge and a CHECK constraint in the DB.
 */

export async function listRewardRules() {
  return prisma.rewardRule.findMany({
    orderBy: [{ trigger: "asc" }, { threshold: "asc" }, { name: "asc" }],
    include: {
      grantsCollection: { select: { id: true, name: true, slug: true } },
      grantsAsset: { select: { id: true, name: true, slug: true, slot: true } },
    },
  });
}

export async function getRewardRule(id: string) {
  const r = await prisma.rewardRule.findUnique({
    where: { id },
    include: { grantsCollection: true, grantsAsset: true },
  });
  if (!r) notFound("reward_rule_not_found");
  return r;
}

type RewardRuleCreate = {
  key: string;
  name: string;
  description?: string;
  trigger: "STREAK_MILESTONE" | "RANK_MILESTONE" | "ACHIEVEMENT" | "MANUAL";
  threshold?: number;
  grantsCollectionId?: string;
  grantsAssetId?: string;
  isActive?: boolean;
};

export async function createRewardRule(adminId: string, input: RewardRuleCreate) {
  if (Boolean(input.grantsCollectionId) === Boolean(input.grantsAssetId)) {
    conflict("reward_needs_exactly_one_target");
  }
  return serializableTx(async (tx) => {
    const rule = await tx.rewardRule.create({
      data: {
        key: input.key,
        name: input.name,
        description: input.description,
        trigger: input.trigger,
        threshold: input.threshold,
        grantsCollectionId: input.grantsCollectionId,
        grantsAssetId: input.grantsAssetId,
        isActive: input.isActive ?? false,
      },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: "rewardRule.create",
      entity: "RewardRule",
      entityId: rule.id,
      metadata: { key: rule.key, trigger: rule.trigger },
    });
    return rule;
  });
}

type RewardRuleUpdate = {
  id: string;
  name?: string;
  description?: string;
  trigger?: "STREAK_MILESTONE" | "RANK_MILESTONE" | "ACHIEVEMENT" | "MANUAL";
  threshold?: number | null;
  grantsCollectionId?: string | null;
  grantsAssetId?: string | null;
  isActive?: boolean;
};

export async function updateRewardRule(adminId: string, patch: RewardRuleUpdate) {
  return serializableTx(async (tx) => {
    const current = await tx.rewardRule.findUnique({ where: { id: patch.id } });
    if (!current) notFound("reward_rule_not_found");

    const nextCollection =
      patch.grantsCollectionId === undefined
        ? current.grantsCollectionId
        : patch.grantsCollectionId;
    const nextAsset =
      patch.grantsAssetId === undefined
        ? current.grantsAssetId
        : patch.grantsAssetId;
    if (Boolean(nextCollection) === Boolean(nextAsset)) {
      conflict("reward_needs_exactly_one_target");
    }

    const rule = await tx.rewardRule.update({
      where: { id: patch.id },
      data: {
        name: patch.name,
        description: patch.description,
        trigger: patch.trigger,
        threshold: patch.threshold,
        grantsCollectionId: patch.grantsCollectionId,
        grantsAssetId: patch.grantsAssetId,
        isActive: patch.isActive,
      },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: "rewardRule.update",
      entity: "RewardRule",
      entityId: rule.id,
    });
    return rule;
  });
}

export async function setRewardRuleActive(
  adminId: string,
  id: string,
  isActive: boolean,
) {
  return serializableTx(async (tx) => {
    const rule = await tx.rewardRule.update({
      where: { id },
      data: { isActive },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: isActive ? "rewardRule.activate" : "rewardRule.deactivate",
      entity: "RewardRule",
      entityId: id,
    });
    return rule;
  });
}

export async function deleteRewardRule(adminId: string, id: string) {
  return serializableTx(async (tx) => {
    const rule = await tx.rewardRule.findUnique({ where: { id } });
    if (!rule) notFound("reward_rule_not_found");

    await tx.rewardRule.delete({ where: { id } });
    await auditInTx(tx, {
      userId: adminId,
      action: "rewardRule.delete",
      entity: "RewardRule",
      entityId: id,
      metadata: { key: rule.key },
    });
  });
}

/** Evaluate active milestone rules and grant each matching rule once per user. */
export async function evaluateRewardsForUser(
  userId: string,
  event: { achievementKey?: string } = {},
) {
  return serializableTx(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { streakCount: true, rank: true } });
    if (!user) notFound("user_not_found");
    const rules = await tx.rewardRule.findMany({ where: { isActive: true }, orderBy: { threshold: "asc" } });
    const granted: string[] = [];
    for (const rule of rules) {
      const matches =
        (rule.trigger === "STREAK_MILESTONE" && user.streakCount >= (rule.threshold ?? Number.MAX_SAFE_INTEGER)) ||
        (rule.trigger === "RANK_MILESTONE" && (user.rank?.level ?? 1) >= (rule.threshold ?? Number.MAX_SAFE_INTEGER)) ||
        (rule.trigger === "ACHIEVEMENT" && event.achievementKey === rule.key);
      if (!matches) continue;
      const prior = await tx.rewardGrant.findUnique({ where: { ruleId_userId: { ruleId: rule.id, userId } } });
      if (prior) continue;

      const assetIds = rule.grantsAssetId
        ? [rule.grantsAssetId]
        : (await tx.cosmeticCollection.findUnique({ where: { id: rule.grantsCollectionId! }, include: { assets: true } }))?.assets.map((x) => x.assetId) ?? [];
      if (assetIds.length === 0) continue;
      for (const assetId of assetIds) {
        await grantAssetInTx(tx, userId, assetId, {
          acquisitionType: rule.trigger === "STREAK_MILESTONE" ? "STREAK_REWARD" : rule.trigger === "RANK_MILESTONE" ? "RANK_REWARD" : "ACHIEVEMENT",
          sourceRef: `reward:${rule.key}`,
          sourceCollectionId: rule.grantsCollectionId ?? undefined,
        });
      }
      await tx.rewardGrant.create({ data: { ruleId: rule.id, userId } });
      await auditInTx(tx, { userId, action: "rewardRule.autoGrant", entity: "RewardRule", entityId: rule.id, metadata: { assetCount: assetIds.length } });
      granted.push(rule.key);
    }
    return { granted };
  });
}

/** Update rank points, derive a stable level, then evaluate rank rewards. */
export async function setUserRankPoints(adminId: string, userId: string, points: number) {
  const level = Math.max(1, Math.floor(Math.max(0, points) / 100) + 1);
  await serializableTx(async (tx) => {
    await tx.userRank.upsert({ where: { userId }, create: { userId, points, level }, update: { points, level } });
    await auditInTx(tx, { userId: adminId, action: "userRank.update", entity: "User", entityId: userId, metadata: { points, level } });
  });
  await evaluateRewardsForUser(userId);
  return { points, level };
}
