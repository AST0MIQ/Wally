import { z } from "zod";

import { zCuid, zOptionalText, zShortText } from "@/lib/validation/common";
import { PERMISSION_KEYS } from "@/lib/rbac/catalogue";

/** Custom-role key: UPPER_SNAKE, starts with a letter. System keys are rejected
 *  in the service (this only enforces shape). */
export const zRoleKey = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9_]{1,39}$/, "use UPPER_SNAKE_CASE");

export const zPermissionKey = z.enum(
  PERMISSION_KEYS as [string, ...string[]],
);

export const zPermissionKeys = z
  .array(zPermissionKey)
  .max(PERMISSION_KEYS.length)
  .transform((keys) => [...new Set(keys)]);

export const roleCreateSchema = z.object({
  key: zRoleKey,
  name: zShortText.min(2),
  description: zOptionalText(300),
  permissionKeys: zPermissionKeys.default([]),
});

export const roleUpdateSchema = z.object({
  id: zCuid,
  name: zShortText.min(2).optional(),
  description: zOptionalText(300),
});

export const roleIdSchema = z.object({ id: zCuid });

export const setRolePermissionsSchema = z.object({
  id: zCuid,
  permissionKeys: zPermissionKeys,
});

export const assignRoleSchema = z.object({
  userId: zCuid,
  roleId: zCuid,
});

export const revokeRoleSchema = z.object({
  userId: zCuid,
  roleId: zCuid,
});

export const adminUserSearchSchema = z.object({
  q: zOptionalText(200),
  cursor: z.string().trim().min(1).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type RoleCreateInput = z.infer<typeof roleCreateSchema>;
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;
