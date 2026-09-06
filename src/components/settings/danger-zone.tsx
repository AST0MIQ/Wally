"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { deleteMyAccountAction } from "@/app/actions/account-data";
import { useAction } from "@/hooks/use-action";

import { Button } from "@/components/ui/button";
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

export function DeleteAccountButton() {
  const t = useTranslations("settingsData");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const del = useAction(deleteMyAccountAction);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          {t("deleteAccount")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteAccount")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t("deleteWarning")}</p>
        <Field label={t("deleteConfirmLabel")}>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
          />
        </Field>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            {tc("cancel")}
          </Button>
          <Button
            variant="destructive"
            disabled={confirm.trim() !== "DELETE" || del.pending}
            onClick={() => del.run({ confirm }, { refresh: false })}
          >
            {del.pending ? tc("saving") : t("deleteAccount")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
