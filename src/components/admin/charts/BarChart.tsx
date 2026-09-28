import type { StatBucket } from "@/lib/adminStats";

/** Balken mit abgerundetem oberen Ende, flach auf der Grundlinie. */
function roundedTopBarPath(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0) return "";
  const radius = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
}

export function BarChart({
  data,
  color,
  emptyLabel = "Keine Daten in diesem Zeitraum.",
}: {
  data: StatBucket[];
  color: string;
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const hasData = data.some((d) => d.count > 0);

  const barSlot = 56;
  const barWidth = 30;
  const width = Math.max(220, data.length * barSlot);
  const height = 170;
  const topPad = 22;
  const bottomPad = 26;
  const plotHeight = height - topPad - bottomPad;
  const baselineY = height - bottomPad;

  if (!hasData) {
    return (
      <div className="flex h-[170px] items-center justify-center text-sm text-brand-navy/40">
        {emptyLabel}
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Balkendiagramm">
      <line
        x1={0}
        y1={baselineY}
        x2={width}
        y2={baselineY}
        className="stroke-brand-navy/15"
        strokeWidth={1}
      />
      {data.map((d, i) => {
        const slotX = i * barSlot + (barSlot - barWidth) / 2;
        const barH = (d.count / max) * plotHeight;
        const y = baselineY - barH;
        return (
          <g key={d.label}>
            {d.count > 0 && (
              <text
                x={slotX + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="fill-brand-navy text-[11px] font-semibold"
              >
                {d.count}
              </text>
            )}
            <path d={roundedTopBarPath(slotX, y, barWidth, barH, 5)} fill={color} />
            <text
              x={slotX + barWidth / 2}
              y={baselineY + 16}
              textAnchor="middle"
              className="fill-brand-navy/50 text-[10px]"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
