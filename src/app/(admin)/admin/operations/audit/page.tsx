import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { requireCapability } from "@/server/lib/guards";
import { listAuditLogs } from "@/server/services/audit.service";
import { formatDateTime } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Audit Logs" };

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity?: string; cursor?: string }>;
}) {
  await requireCapability("audit:read");
  const t = await getTranslations("admin.audit");
  const locale = (await getLocale()) as Locale;
  const { action, entity, cursor } = await searchParams;
  const { rows, nextCursor, actions, entities } = await listAuditLogs({
    action,
    entity,
    cursor,
  });

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { action, entity, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/admin/operations/audit?${p.toString()}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground">{t("action")}:</span>
          <Link href={qs({ action: undefined, cursor: undefined })} className={!action ? "font-semibold text-primary" : "text-muted-foreground hover:underline"}>{t("all")}</Link>
          {actions.map((a) => (
            <Link key={a} href={qs({ action: a, cursor: undefined })} className={action === a ? "font-semibold text-primary" : "text-muted-foreground hover:underline"}>{a}</Link>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-muted-foreground">{t("entity")}:</span>
        <Link href={qs({ entity: undefined, cursor: undefined })} className={!entity ? "font-semibold text-primary" : "text-muted-foreground hover:underline"}>{t("all")}</Link>
        {entities.map((e) => (
          <Link key={e} href={qs({ entity: e, cursor: undefined })} className={entity === e ? "font-semibold text-primary" : "text-muted-foreground hover:underline"}>{e}</Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <Card className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
              <span className="w-32 shrink-0 text-xs text-muted-foreground">
                {formatDateTime(r.createdAt, locale)}
              </span>
              <span className="font-medium">{r.action}</span>
              <span className="text-xs text-muted-foreground">
                {r.entity}:{r.entityId.slice(0, 8)}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {r.actor?.name || r.actor?.email || "—"}
              </span>
            </div>
          ))}
        </Card>
      )}

      {nextCursor && (
        <Link href={qs({ cursor: nextCursor })} className="text-sm text-primary hover:underline">
          {t("loadMore")}
        </Link>
      )}
    </div>
  );
}
