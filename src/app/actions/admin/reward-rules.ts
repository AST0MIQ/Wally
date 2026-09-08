"use server";

import { revalidatePath } from "next/cache";

import { adminAction } from "@/server/lib/admin-action";
import {
  rewardRuleCreateSchema,
  rewardRuleUpdateSchema,
  rewardRuleIdSchema,
} from "@/lib/validation/cosmetics";
import * as rules from "@/server/services/cosmetics/reward-rule.service";
import { z } from "zod";

function revalidateRules() {
  revalidatePath("/admin/rewards/rules");
  revalidatePath("/admin");
}

export const createRewardRuleAction = adminAction(
  rewardRuleCreateSchema,
  async ({ input, admin }) => {
    const r = await rules.createRewardRule(admin.id, input);
    revalidateRules();
    return { id: r.id };
  },
  { name: "rewardRule.create", capability: "rewardRule:write" },
);

export const updateRewardRuleAction = adminAction(
  rewardRuleUpdateSchema,
  async ({ input, admin }) => {
    await rules.updateRewardRule(admin.id, {
      ...input,
      threshold: input.threshold ?? undefined,
      grantsCollectionId: input.grantsCollectionId ?? undefined,
      grantsAssetId: input.grantsAssetId ?? undefined,
    });
    revalidateRules();
    revalidatePath(`/admin/rewards/rules/${input.id}`);
  },
  { name: "rewardRule.update", capability: "rewardRule:write" },
);

export const setRewardRuleActiveAction = adminAction(
  rewardRuleIdSchema.extend({ isActive: z.boolean() }),
  async ({ input, admin }) => {
    await rules.setRewardRuleActive(admin.id, input.id, input.isActive);
    revalidateRules();
  },
  { name: "rewardRule.setActive", capability: "rewardRule:write" },
);

export const deleteRewardRuleAction = adminAction(
  rewardRuleIdSchema,
  async ({ input, admin }) => {
    await rules.deleteRewardRule(admin.id, input.id);
    revalidateRules();
  },
  { name: "rewardRule.delete", capability: "rewardRule:write" },
);

export const setUserRankAction = adminAction(
  z.object({ userId: z.string().cuid(), points: z.coerce.number().int().min(0).max(10_000_000) }),
  async ({ input, admin }) => {
    const result = await rules.setUserRankPoints(admin.id, input.userId, input.points);
    revalidatePath("/admin/rewards/rank-streak");
    return result;
  },
  { name: "userRank.update", permission: "rewards.write" },
);
