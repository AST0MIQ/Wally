"use client";

import { permissionsByResource } from "@/lib/rbac/catalogue";

const GROUPS = permissionsByResource();

/**
 * Controlled checkbox grid over the whole permission catalogue, grouped by
 * resource. `value` is the set of selected keys; `onChange` gets the next set.
 * Read-only mode renders the same layout with disabled inputs.
 */
export function PermissionChecklist({
  value,
  onChange,
  disabled = false,
}: {
  value: string[];
  onChange?: (next: string[]) => void;
  disabled?: boolean;
}) {
  const selected = new Set(value);

  function toggle(key: string, on: boolean) {
    if (!onChange) return;
    const next = new Set(selected);
    if (on) next.add(key);
    else next.delete(key);
    onChange([...next]);
  }

  return (
    <div className="flex flex-col gap-4">
      {GROUPS.map((g) => (
        <fieldset key={g.resource} className="rounded-lg border border-border p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {g.resource}
          </legend>
          <div className="flex flex-col gap-1.5">
            {g.permissions.map((p) => (
              <label
                key={p.key}
                className="flex items-start gap-2.5 text-sm"
                title={p.description}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 rounded border-input accent-primary disabled:opacity-50"
                  checked={selected.has(p.key)}
                  disabled={disabled}
                  onChange={(e) => toggle(p.key, e.target.checked)}
                />
                <span className="flex min-w-0 flex-col">
                  <code className="text-[13px] font-medium">{p.key}</code>
                  <span className="text-xs text-muted-foreground">{p.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
