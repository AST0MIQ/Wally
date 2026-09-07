import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { APP_VERSION } from "@/lib/version";
import { PATCH_NOTES } from "@/lib/patch-notes";

export const metadata: Metadata = { title: "Patch Notes" };

export default async function PatchNotesPage() {
  const locale = await getLocale();
  const t = await getTranslations("patchNotes");
  return <section className="flex flex-col gap-5">
    <PageHeader title={t("title")} description={t("description")} />
    <div className="flex flex-col gap-3">
      {PATCH_NOTES.map((note) => <Card key={note.version} className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-bold">v{note.version}</h2>
          {note.version === APP_VERSION && <Badge>{t("latest")}</Badge>}
        </div>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {note[locale === "th" ? "th" : "en"].map((item) => <li key={item}>{item}</li>)}
        </ul>
      </Card>)}
    </div>
  </section>;
}
