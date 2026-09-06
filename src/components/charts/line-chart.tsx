type Point = { label: string; value: number };

/**
 * Minimal responsive area/line chart (no dependency). Renders into a
 * 0..100 x 0..100 viewBox and scales with its container.
 */
export function LineChart({
  data,
  formatValue,
  height = 160,
  className,
}: {
  data: Point[];
  formatValue?: (n: number) => string;
  height?: number;
  className?: string;
}) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = range * 0.12;
  const lo = min - pad;
  const hi = max + pad;

  const x = (i: number) => (i / (data.length - 1)) * 100;
  const y = (v: number) => 100 - ((v - lo) / (hi - lo)) * 100;

  const line = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const area = `0,100 ${line} 100,100`;

  const first = data[0]!;
  const last = data[data.length - 1]!;

  return (
    <div className={className}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: "100%", height }}
        role="img"
        aria-label={data.map((p) => `${p.label}: ${formatValue ? formatValue(p.value) : p.value}`).join(", ")}
      >
        <polygon points={area} fill="var(--color-primary)" opacity="0.06" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          className="transition-all duration-500"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={x(data.length - 1)}
          cy={y(last.value)}
          r="1.8"
          fill="var(--color-primary)"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{first.label}</span>
        {formatValue && (
          <span className="font-medium text-foreground">
            {formatValue(last.value)}
          </span>
        )}
        <span>{last.label}</span>
      </div>
    </div>
  );
}
