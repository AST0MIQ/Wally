import { z } from "zod";

const key = z.string().trim().min(2).max(80).regex(/^[a-z][a-z0-9._-]*$/);

export const featureFlagUpsertSchema = z.object({
  key,
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  enabled: z.boolean().default(false),
});

export const featureFlagToggleSchema = z.object({ key, enabled: z.boolean() });

export const appSettingUpsertSchema = z.object({
  key,
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  value: z.string().min(1).max(10_000),
});

