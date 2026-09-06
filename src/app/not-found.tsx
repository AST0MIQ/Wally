import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">{t("errors.notFoundTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("errors.notFoundBody")}</p>
      <Link href="/dashboard" className={buttonVariants({ variant: "primary" })}>
        {t("common.back")}
      </Link>
    </div>
  );
}
