"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-xl font-semibold">{t("boundaryTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("boundaryBody")}</p>
      <Button onClick={reset}>{t("tryAgain")}</Button>
    </div>
  );
}
