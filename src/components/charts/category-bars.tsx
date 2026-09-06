type Row = {
  key: string;
  label: string;
  icon?: string | null;
  color?: string | null;
  amount: number;
  pct: number;
};

export function CategoryBars({
  rows,
  formatValue,
}: {
  rows: Row[];
  formatValue: (n: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.amount));

  return (
    <ul className="flex flex-col gap-4">
      {rows.map((r) => (
        <li key={r.key} className="flex flex-col gap-2">
          <div className="flex items-end justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2.5">
              {r.icon && <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-card text-sm shadow-sm">{r.icon}</span>}
              <span className="truncate font-medium">{r.label}</span>
            </span>
            <span className="balance-mask shrink-0 text-right text-muted-foreground">
              {formatValue(r.amount)}
            </span>
          </div>
          <div className="flex items-center gap-3 pl-10">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${(r.amount / max) * 100}%`,
                backgroundColor: r.color ?? "var(--color-primary)",
              }}
            />
          </div>
          <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{r.pct.toFixed(0)}%</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
