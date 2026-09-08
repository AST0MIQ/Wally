import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";
import { auditInTx } from "@/server/lib/audit";
import { AppError } from "@/server/lib/errors";
import type { z } from "zod";
import type { appSettingUpsertSchema, featureFlagUpsertSchema } from "@/lib/validation/operations";

export function listFeatureFlags() {
  return prisma.featureFlag.findMany({ orderBy: [{ name: "asc" }, { key: "asc" }] });
}

export function listAppSettings() {
  return prisma.appSetting.findMany({ orderBy: [{ name: "asc" }, { key: "asc" }] });
}

export async function upsertFeatureFlag(adminId: string, input: z.infer<typeof featureFlagUpsertSchema>) {
  return prisma.$transaction(async (tx) => {
    const row = await tx.featureFlag.upsert({
      where: { key: input.key },
      create: { ...input, updatedById: adminId },
      update: { name: input.name, description: input.description, enabled: input.enabled, updatedById: adminId },
    });
    await auditInTx(tx, { userId: adminId, action: "featureFlag.upsert", entity: "FeatureFlag", entityId: row.key, metadata: { enabled: row.enabled } });
    return row;
  });
}

export async function toggleFeatureFlag(adminId: string, key: string, enabled: boolean) {
  return prisma.$transaction(async (tx) => {
    const row = await tx.featureFlag.update({ where: { key }, data: { enabled, updatedById: adminId } });
    await auditInTx(tx, { userId: adminId, action: "featureFlag.toggle", entity: "FeatureFlag", entityId: key, metadata: { enabled } });
    return row;
  });
}

export async function upsertAppSetting(adminId: string, input: z.infer<typeof appSettingUpsertSchema>) {
  let parsed: Prisma.InputJsonValue;
  try {
    parsed = JSON.parse(input.value) as Prisma.InputJsonValue;
  } catch {
    throw new AppError("invalid_json", "VALIDATION");
  }
  return prisma.$transaction(async (tx) => {
    const row = await tx.appSetting.upsert({
      where: { key: input.key },
      create: { key: input.key, name: input.name, description: input.description, value: parsed, updatedById: adminId },
      update: { name: input.name, description: input.description, value: parsed, updatedById: adminId },
    });
    await auditInTx(tx, { userId: adminId, action: "appSetting.upsert", entity: "AppSetting", entityId: row.key });
    return row;
  });
}
