"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { categoryLabel } from "@/lib/category-i18n";
import type { CategoryNode } from "@/server/services/category.service";
import {
  createCategoryAction,
  createSubcategoryAction,
  deleteCategoryAction,
  deleteSubcategoryAction,
  updateCategoryAction,
  updateSubcategoryAction,
} from "@/app/actions/categories";
import { useAction } from "@/hooks/use-action";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ColorPicker, IconPicker } from "@/components/ui/icon-color-picker";

type Kind = "EXPENSE" | "INCOME";

export function CategoriesManager({ initial }: { initial: CategoryNode[] }) {
  const t = useTranslations("categoryAdmin");
  const tCat = useTranslations("categories");
  const [kind, setKind] = useState<Kind>("EXPENSE");

  const list = useMemo(
    () => initial.filter((c) => c.kind === kind),
    [initial, kind],
  );

  return (
    <section className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <CategoryFormDialog
          kind={kind}
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              {t("addCategory")}
            </Button>
          }
        />
      </header>

      <div className="inline-flex self-start rounded-md border border-border p-1">
        {(["EXPENSE", "INCOME"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition-colors",
              kind === k
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {k === "EXPENSE" ? t("expense") : t("income")}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyHint")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((c) => (
            <li key={c.id}>
              <CategoryRow category={c} label={categoryLabel(tCat, c)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CategoryRow({
  category,
  label,
}: {
  category: CategoryNode;
  label: string;
}) {
  const t = useTranslations("categoryAdmin");
  const tc = useTranslations("common");
  const tCat = useTranslations("categories");

  const del = useAction(deleteCategoryAction);
  const delSub = useAction(deleteSubcategoryAction);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <span
          className="flex size-9 items-center justify-center rounded-full text-base"
          style={{ backgroundColor: (category.color ?? "#64748B") + "22" }}
        >
          {category.icon || "🏷️"}
        </span>
        <span className="flex-1 font-medium">{label}</span>

        <CategoryFormDialog
          kind={category.kind}
          category={category}
          trigger={
            <Button variant="ghost" size="icon" aria-label={tc("edit")}>
              <Pencil className="size-4" />
            </Button>
          }
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label={tc("delete")}
          disabled={del.pending}
          onClick={() => {
            if (!window.confirm(t("deleteCategoryConfirm"))) return;
            del.run(
              { id: category.id },
              { successMessage: t("deleted") },
            );
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pl-12">
        {category.subcategories.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs"
          >
            {s.icon && <span>{s.icon}</span>}
            {categoryLabel(tCat, s)}
            <SubcategoryFormDialog
              categoryId={category.id}
              subcategory={s}
              trigger={
                <button
                  type="button"
                  aria-label={tc("edit")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3" />
                </button>
              }
            />
            <button
              type="button"
              aria-label={tc("delete")}
              className="text-muted-foreground hover:text-negative"
              onClick={() => {
                if (!window.confirm(t("deleteSubcategoryConfirm"))) return;
                delSub.run({ id: s.id }, { successMessage: t("deleted") });
              }}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}

        <SubcategoryFormDialog
          categoryId={category.id}
          trigger={
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-3" />
              {t("addSubcategory")}
            </button>
          }
        />
      </div>
    </Card>
  );
}

function CategoryFormDialog({
  kind,
  category,
  trigger,
}: {
  kind: Kind;
  category?: CategoryNode;
  trigger: ReactNode;
}) {
  const isEdit = Boolean(category);
  const t = useTranslations("categoryAdmin");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "");
  const [color, setColor] = useState(category?.color ?? "");

  const create = useAction(createCategoryAction);
  const update = useAction(updateCategoryAction);
  const busy = create.pending || update.pending;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isEdit) {
      await update.run(
        { id: category!.id, name, icon: icon || undefined, color: color || undefined },
        { successMessage: t("updated"), onSuccess: () => setOpen(false) },
      );
    } else {
      await create.run(
        { name, kind, icon: icon || undefined, color: color || undefined },
        { successMessage: t("created"), onSuccess: () => setOpen(false) },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editCategory") : t("addCategory")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={t("name")} htmlFor="cat-name">
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              required
              autoFocus
            />
          </Field>
          <Field label={t("icon")}>
            <IconPicker value={icon} onChange={setIcon} />
          </Field>
          <Field label={t("color")}>
            <ColorPicker value={color} onChange={setColor} />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? tc("saving") : isEdit ? tc("update") : tc("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubcategoryFormDialog({
  categoryId,
  subcategory,
  trigger,
}: {
  categoryId: string;
  subcategory?: { id: string; name: string; icon: string | null };
  trigger: ReactNode;
}) {
  const isEdit = Boolean(subcategory);
  const t = useTranslations("categoryAdmin");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(subcategory?.name ?? "");
  const [icon, setIcon] = useState(subcategory?.icon ?? "");

  const create = useAction(createSubcategoryAction);
  const update = useAction(updateSubcategoryAction);
  const busy = create.pending || update.pending;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isEdit) {
      await update.run(
        { id: subcategory!.id, name, icon: icon || undefined },
        { successMessage: t("updated"), onSuccess: () => setOpen(false) },
      );
    } else {
      await create.run(
        { categoryId, name, icon: icon || undefined },
        { successMessage: t("created"), onSuccess: () => setOpen(false) },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editSubcategory") : t("addSubcategory")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={t("name")} htmlFor="sub-name">
            <Input
              id="sub-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              required
              autoFocus
            />
          </Field>
          <Field label={t("icon")}>
            <IconPicker value={icon} onChange={setIcon} />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? tc("saving") : isEdit ? tc("update") : tc("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
