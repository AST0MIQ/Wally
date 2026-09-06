import { getTranslations } from "next-intl/server";

export const dynamic = "force-static";

export default async function OfflinePage() {
  const t = await getTranslations("offline");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("body")}</p>
    </div>
  );
}
