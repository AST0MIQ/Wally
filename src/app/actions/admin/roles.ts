"use server";

import { revalidatePath } from "next/cache";

import { adminAction } from "@/server/lib/admin-action";
import {
  roleCreateSchema,
  roleIdSchema,
  roleUpdateSchema,
  setRolePermissionsSchema,
} from "@/lib/validation/rbac";
import {
  archiveRole,
  createRole,
  deleteRole,
  setRolePermissions,
  unarchiveRole,
  updateRole,
} from "@/server/services/rbac/role.service";

function revalidateRoles(id?: string) {
  revalidatePath("/admin/access/roles");
  revalidatePath("/admin/access/permissions");
  if (id) revalidatePath(`/admin/access/roles/${id}`);
}

export const createRoleAction = adminAction(
  roleCreateSchema,
  async ({ input, admin }) => {
    const role = await createRole(admin.id, input);
    revalidateRoles(role.id);
    return { id: role.id };
  },
  { name: "role.create", permission: "roles.write" },
);

export const updateRoleAction = adminAction(
  roleUpdateSchema,
  async ({ input, admin }) => {
    await updateRole(admin.id, input);
    revalidateRoles(input.id);
  },
  { name: "role.update", permission: "roles.write" },
);

export const setRolePermissionsAction = adminAction(
  setRolePermissionsSchema,
  async ({ input, admin }) => {
    await setRolePermissions(admin.id, input.id, input.permissionKeys);
    revalidateRoles(input.id);
  },
  { name: "role.setPermissions", permission: "roles.write" },
);

export const archiveRoleAction = adminAction(
  roleIdSchema,
  async ({ input, admin }) => {
    await archiveRole(admin.id, input.id);
    revalidateRoles(input.id);
  },
  { name: "role.archive", permission: "roles.write" },
);

export const unarchiveRoleAction = adminAction(
  roleIdSchema,
  async ({ input, admin }) => {
    await unarchiveRole(admin.id, input.id);
    revalidateRoles(input.id);
  },
  { name: "role.unarchive", permission: "roles.write" },
);

export const deleteRoleAction = adminAction(
  roleIdSchema,
  async ({ input, admin }) => {
    await deleteRole(admin.id, input.id);
    revalidateRoles();
  },
  { name: "role.delete", permission: "roles.write" },
);
