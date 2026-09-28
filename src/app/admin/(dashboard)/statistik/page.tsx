import Link from "next/link";
import { getStatsData } from "@/lib/adminStats";
import { formatDateDeCH } from "@/lib/time";
import { StatTile } from "@/components/admin/charts/StatTile";
import { BarChart } from "@/components/admin/charts/BarChart";
import { SplitBar } from "@/components/admin/charts/SplitBar";

export const dynamic = "force-dynamic";

const PERIOD_OPTIONS = [
  { days: 7, label: "7 Tage" },
  { days: 30, label: "30 Tage" },
  { days: 90, label: "90 Tage" },
];

export default async function StatistikPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const sp = await searchParams;
  const days = PERIOD_OPTIONS.some((o) => String(o.days) === sp.days) ? Number(sp.days) : 30;

  const stats = await getStatsData(days);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-navy sm:text-3xl">
            Statistik
          </h1>
          <p className="text-brand-navy/60">
            {formatDateDeCH(stats.fromDateISO)} – {formatDateDeCH(stats.toDateISO)}
          </p>
        </div>
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((o) => (
            <Link
              key={o.days}
              href={`/admin/statistik?days=${o.days}`}
              className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors ${
                o.days === days
                  ? "border-brand-orange bg-brand-orange text-white"
                  : "border-brand-cream-dark bg-white text-brand-navy hover:border-brand-teal"
              }`}
            >
              {o.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatTile label="Reservationen" value={String(stats.totalActive)} sub="ohne Stornos" />
        <StatTile
          label="Ø Personen"
          value={stats.avgPartySize.toFixed(1)}
          sub="pro Reservation"
        />
        <StatTile
          label="Stornoquote"
          value={`${Math.round(stats.cancelledRate * 100)}%`}
          sub={`${stats.totalCancelled} storniert`}
        />
        <StatTile
          label="Online-Anteil"
          value={
            stats.sourceSplit.online + stats.sourceSplit.phone > 0
              ? `${Math.round(
                  (stats.sourceSplit.online / (stats.sourceSplit.online + stats.sourceSplit.phone)) *
                    100,
                )}%`
              : "–"
          }
          sub="statt telefonisch"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ChartCard title="Reservationen pro Wochentag">
          <BarChart data={stats.perWeekday} color="#00A1A1" />
        </ChartCard>
        <ChartCard title="Reservationen pro Uhrzeit">
          <BarChart data={stats.perHour} color="#00A1A1" />
        </ChartCard>
        <ChartCard title="Reservationen pro Tisch">
          <BarChart data={stats.perTable} color="#00A1A1" />
        </ChartCard>
        <ChartCard title="Online vs. Telefonisch">
          <div className="flex h-[170px] items-center">
            <SplitBar
              segments={[
                { label: "Online", count: stats.sourceSplit.online, color: "#00A1A1" },
                { label: "Telefonisch", count: stats.sourceSplit.phone, color: "#E85F36" },
              ]}
            />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-cream-dark bg-white p-5">
      <h3 className="mb-3 font-display text-lg font-semibold text-brand-navy">{title}</h3>
      {children}
    </div>
  );
}
