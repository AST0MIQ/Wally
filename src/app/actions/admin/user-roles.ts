"use server";

import { revalidatePath } from "next/cache";

import { adminAction } from "@/server/lib/admin-action";
import { assignRoleSchema, revokeRoleSchema } from "@/lib/validation/rbac";
import { assignRole, revokeRole } from "@/server/services/rbac/user-role.service";

function revalidateUserAccess(userId: string) {
  revalidatePath(`/admin/access/users/${userId}`);
  revalidatePath("/admin/access/users");
  revalidatePath("/admin/access/roles");
}

// Role assignment / revocation is SUPER_ADMIN-only (spec §5). The `superAdmin`
// gate in adminAction is the narrow role-name / bootstrap check.
export const assignRoleAction = adminAction(
  assignRoleSchema,
  async ({ input, admin }) => {
    await assignRole(admin.id, input.userId, input.roleId);
    revalidateUserAccess(input.userId);
  },
  { name: "role.assign", superAdmin: true },
);

export const revokeRoleAction = adminAction(
  revokeRoleSchema,
  async ({ input, admin }) => {
    await revokeRole(admin.id, input.userId, input.roleId);
    revalidateUserAccess(input.userId);
  },
  { name: "role.revoke", superAdmin: true },
);
