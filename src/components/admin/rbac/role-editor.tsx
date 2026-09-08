"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAction } from "@/hooks/use-action";
import {
  createRoleAction,
  setRolePermissionsAction,
  updateRoleAction,
} from "@/app/actions/admin/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/label";
import { PermissionChecklist } from "@/components/admin/rbac/permission-checklist";

type EditProps = {
  mode: "edit";
  role: {
    id: string;
    key: string;
    name: string;
    description: string | null;
    permissionKeys: string[];
  };
};
type CreateProps = { mode: "create" };

export function RoleEditor(props: CreateProps | EditProps) {
  const t = useTranslations("admin.access.roles");
  const router = useRouter();
  const create = useAction(createRoleAction);
  const update = useAction(updateRoleAction);
  const setPerms = useAction(setRolePermissionsAction);

  const editing = props.mode === "edit";
  const [key, setKey] = useState(editing ? props.role.key : "");
  const [name, setName] = useState(editing ? props.role.name : "");
  const [description, setDescription] = useState(
    editing ? (props.role.description ?? "") : "",
  );
  const [perms, setPermsState] = useState<string[]>(
    editing ? props.role.permissionKeys : [],
  );

  const pending = create.pending || update.pending || setPerms.pending;

  async function submit() {
    if (props.mode === "create") {
      const res = await create.run(
        { key, name, description: description || undefined, permissionKeys: perms },
        { successMessage: t("createdToast"), refresh: false },
      );
      if (res.ok && res.data) router.push(`/admin/access/roles/${res.data.id}`);
      return;
    }
    const meta = await update.run(
      { id: props.role.id, name, description: description || undefined },
      { refresh: false },
    );
    if (!meta.ok) return;
    const p = await setPerms.run(
      { id: props.role.id, permissionKeys: perms },
      { successMessage: t("savedToast"), refresh: false },
    );
    if (p.ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("key")}
          error={create.fieldErrors.key?.[0]}
          hint={editing ? undefined : t("keyHint")}
        >
          <Input
            value={key}
            disabled={editing}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder="MARKETING_ADMIN"
          />
        </Field>
        <Field label={t("name")} error={create.fieldErrors.name?.[0] ?? update.fieldErrors.name?.[0]}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      </div>

      <Field label={t("description")}>
        <Textarea
          value={description}
          rows={2}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div>
        <p className="mb-2 text-sm font-semibold">{t("permissionsTitle")}</p>
        <p className="mb-3 text-xs text-muted-foreground">{t("permissionsHint")}</p>
        <PermissionChecklist value={perms} onChange={setPermsState} />
      </div>

      <div>
        <Button disabled={pending || !name || (!editing && !key)} onClick={submit}>
          {editing ? t("save") : t("create")}
        </Button>
      </div>
    </div>
  );
}
