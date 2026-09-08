import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";
import { auditInTx } from "@/server/lib/audit";
import { conflict, notFound } from "@/server/lib/errors";

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
  return prisma.$transaction(async (tx: Db) => {
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
  return prisma.$transaction(async (tx: Db) => {
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
  return prisma.$transaction(async (tx: Db) => {
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
  return prisma.$transaction(async (tx: Db) => {
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
