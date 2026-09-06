"use client";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useQuickAdd } from "@/components/transactions/quick-add-provider";

export function AddTransactionButton() {
  const t = useTranslations("quickAdd");
  const { open } = useQuickAdd();
  return <Button onClick={open}><Plus aria-hidden="true" />{t("title")}</Button>;
}
