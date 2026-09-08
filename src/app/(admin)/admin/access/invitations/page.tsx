import { getTranslations } from "next-intl/server";
import { MailPlus } from "lucide-react";

import { requireCapability } from "@/server/lib/guards";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Invitations" };

export default async function InvitationsPage() {
  await requireCapability("roles:read");
  const t = await getTranslations("admin.access.invitations");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <MailPlus className="size-8 text-muted-foreground" />
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {t("phase2")}
        </span>
        <p className="max-w-sm text-sm text-muted-foreground">{t("body")}</p>
      </Card>
    </div>
  );
}
