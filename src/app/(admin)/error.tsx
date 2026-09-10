"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

/**
 * Admin Console error boundary. It catches everything that escapes a page —
 * a missing-capability guard, a database fault, a misconfigured environment —
 * so its heading stays neutral rather than claiming a permission problem, and
 * it never echoes the underlying error text: a probe must not learn which
 * capability it lacks. The `digest` is the one safe handle Next.js gives us,
 * and it matches the server-side log line for this exact failure.
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
      <h1 className="text-lg font-semibold">{t("boundaryTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("boundaryBody")}</p>
      <Button variant="secondary" onClick={reset}>
        {t("tryAgain")}
      </Button>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">
          {t("errorRef")}: {error.digest}
        </p>
      )}
    </div>
  );
}
