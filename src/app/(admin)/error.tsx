"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

/**
 * Admin Console error boundary. A missing-capability guard throws a
 * `FORBIDDEN` AppError; anything else that escapes a page lands here too.
 * The message is intentionally generic — it never echoes the underlying
 * error text, so a probe can't learn which capability it lacks.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error("[admin] boundary", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-lg font-semibold">{t("forbidden")}</h1>
      <p className="text-sm text-muted-foreground">{t("boundaryBody")}</p>
      <Button variant="secondary" onClick={reset}>
        {t("tryAgain")}
      </Button>
    </div>
  );
}
