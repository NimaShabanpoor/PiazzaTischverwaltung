export function SplitBar({
  segments,
}: {
  segments: { label: string; count: number; color: string }[];
}) {
  const total = segments.reduce((sum, seg) => sum + seg.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-16 items-center justify-center text-sm text-brand-navy/40">
        Keine Daten in diesem Zeitraum.
      </div>
    );
  }

  return (
    <div>
      <div className="flex h-6 w-full overflow-hidden rounded-full bg-brand-cream">
        {segments.map((seg, i) => {
          const pct = (seg.count / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={seg.label}
              style={{ width: `${pct}%`, backgroundColor: seg.color }}
              className={i > 0 ? "ml-0.5" : undefined}
              title={`${seg.label}: ${seg.count}`}
            />
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-sm text-brand-navy/70">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: seg.color }}
              aria-hidden
            />
            {seg.label} · <span className="font-semibold text-brand-navy">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
