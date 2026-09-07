import { useTranslations } from "next-intl";

/**
 * A small annotated mock of a broker "asset detail" screen, shown next to the
 * holding-screenshot upload control so users know which figures must be legible.
 */
export function HoldingSlipGuide() {
  const t = useTranslations("portfolio");

  const steps = [
    { n: 1, label: t("holdingGuideShares") },
    { n: 2, label: t("holdingGuideCost") },
    { n: 3, label: t("holdingGuideTotal") },
  ];

  return (
    <div className="mb-4 rounded-xl border border-border bg-muted/40 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{t("holdingGuideTitle")}</p>

      <div className="flex gap-3">
        <svg
          viewBox="0 0 200 232"
          className="h-auto w-[132px] shrink-0"
          role="img"
          aria-label={t("holdingGuideTitle")}
        >
          {/* phone screen */}
          <rect x="1" y="1" width="198" height="230" rx="16" className="fill-card stroke-border" strokeWidth="2" />

          {/* header: ticker + value */}
          <circle cx="24" cy="28" r="10" className="fill-muted" />
          <rect x="40" y="21" width="34" height="8" rx="4" className="fill-foreground" />
          <rect x="128" y="19" width="52" height="9" rx="4" className="fill-foreground" />
          <rect x="140" y="33" width="40" height="7" rx="3.5" className="fill-positive/70" />
          <line x1="14" y1="52" x2="186" y2="52" className="stroke-border" strokeWidth="1.5" />

          {/* zone 1 — shares held */}
          <rect x="10" y="62" width="180" height="40" rx="9" className="fill-primary/10 stroke-primary" strokeWidth="2" />
          <rect x="20" y="70" width="72" height="7" rx="3.5" className="fill-muted-foreground" />
          <rect x="20" y="84" width="92" height="11" rx="4" className="fill-foreground" />
          <circle cx="180" cy="82" r="11" className="fill-primary" />
          <text x="180" y="86" textAnchor="middle" className="fill-primary-foreground" fontSize="12" fontWeight="700">1</text>

          {/* zone 2 — cost per share */}
          <rect x="10" y="112" width="180" height="40" rx="9" className="fill-primary/10 stroke-primary" strokeWidth="2" />
          <rect x="20" y="120" width="86" height="7" rx="3.5" className="fill-muted-foreground" />
          <rect x="20" y="134" width="70" height="11" rx="4" className="fill-foreground" />
          <circle cx="180" cy="132" r="11" className="fill-primary" />
          <text x="180" y="136" textAnchor="middle" className="fill-primary-foreground" fontSize="12" fontWeight="700">2</text>

          {/* zone 3 — total cost (cross-check, dashed) */}
          <rect x="10" y="162" width="180" height="40" rx="9" className="fill-transparent stroke-primary/60" strokeWidth="2" strokeDasharray="4 4" />
          <rect x="20" y="170" width="78" height="7" rx="3.5" className="fill-muted-foreground" />
          <rect x="20" y="184" width="60" height="11" rx="4" className="fill-foreground" />
          <circle cx="180" cy="182" r="11" className="fill-primary/60" />
          <text x="180" y="186" textAnchor="middle" className="fill-primary-foreground" fontSize="12" fontWeight="700">3</text>

          <rect x="66" y="212" width="68" height="12" rx="6" className="fill-muted" />
        </svg>

        <ol className="flex flex-1 flex-col justify-center gap-2 text-xs">
          {steps.map((step) => (
            <li key={step.n} className="flex items-start gap-2">
              <span className="mt-px flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {step.n}
              </span>
              <span className="text-foreground">{step.label}</span>
            </li>
          ))}
          <li className="pt-1 text-muted-foreground">{t("holdingGuideHint")}</li>
        </ol>
      </div>
    </div>
  );
}
