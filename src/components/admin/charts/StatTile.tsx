export function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-cream-dark bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/50">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-brand-navy">{value}</p>
      {sub && <p className="mt-1 text-sm text-brand-navy/50">{sub}</p>}
    </div>
  );
}
