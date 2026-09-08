"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/server/lib/admin-action";
import { appSettingUpsertSchema, featureFlagToggleSchema, featureFlagUpsertSchema } from "@/lib/validation/operations";
import * as operations from "@/server/services/operations.service";

export const upsertFeatureFlagAction = adminAction(featureFlagUpsertSchema, async ({ input, admin }) => {
  await operations.upsertFeatureFlag(admin.id, input);
  revalidatePath("/admin/operations/flags");
}, { name: "featureFlag.upsert", permission: "settings.write" });

export const toggleFeatureFlagAction = adminAction(featureFlagToggleSchema, async ({ input, admin }) => {
  await operations.toggleFeatureFlag(admin.id, input.key, input.enabled);
  revalidatePath("/admin/operations/flags");
}, { name: "featureFlag.toggle", permission: "settings.write" });

export const upsertAppSettingAction = adminAction(appSettingUpsertSchema, async ({ input, admin }) => {
  await operations.upsertAppSetting(admin.id, input);
  revalidatePath("/admin/operations/config");
}, { name: "appSetting.upsert", permission: "settings.write" });

