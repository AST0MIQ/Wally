import { cn } from "@/lib/utils";

type Row = { label: string; income: number; expense: number };

export function IncomeExpenseBars({
  data,
  formatValue,
}: {
  data: Row[];
  formatValue: (n: number) => string;
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));

  return (
    <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
      {data.map((d) => (
        <div
          key={d.label}
          className="flex h-full min-w-0 flex-1 flex-col items-center gap-1"
          tabIndex={0}
          aria-label={`${d.label} · +${formatValue(d.income)} / −${formatValue(d.expense)}`}
          title={`${d.label} · +${formatValue(d.income)} / −${formatValue(d.expense)}`}
        >
          <div className="flex min-h-0 flex-1 w-full items-end justify-center gap-1">
            <Bar height={(d.income / max) * 100} className="bg-positive/80" />
            <Bar height={(d.expense / max) * 100} className="bg-negative/80" />
          </div>
          <span className="text-xs text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Bar({ height, className }: { height: number; className?: string }) {
  return (
    <div
      className={cn("ck-chart-bar w-3 sm:w-5 rounded-t-md", className)}
      style={{ height: `${Math.max(height, 1)}%` }}
    />
  );
}
