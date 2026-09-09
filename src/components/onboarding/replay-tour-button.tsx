"use client";

import { useTranslations } from "next-intl";
import { HelpCircle } from "lucide-react";

import { OPEN_TOUR_EVENT } from "@/components/onboarding/welcome-tour";

export function ReplayTourButton() {
  const t = useTranslations("onboarding");

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_TOUR_EVENT))}
      className="flex w-full items-center gap-3 text-left"
    >
      <HelpCircle className="size-5 shrink-0 text-muted-foreground" />
      <span className="text-sm font-medium">{t("replay")}</span>
    </button>
  );
}
