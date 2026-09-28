import { getDashboardData } from "@/lib/adminData";
import { TableOverviewGrid } from "@/components/admin/TableOverviewGrid";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { formatDateDeCH, formatWeekdayDe, zurichTodayISO } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const tables = await getDashboardData();
  const today = zurichTodayISO();

  return (
    <div>
      <AutoRefresh />
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-brand-navy sm:text-3xl">
          Tischübersicht
        </h1>
        <p className="text-brand-navy/60">
          {formatWeekdayDe(today)}, {formatDateDeCH(today)} · Tippen Sie auf einen Tisch für
          Details ·{" "}
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-status-free" aria-hidden />
            aktualisiert automatisch
          </span>
        </p>
      </div>
      <TableOverviewGrid tables={tables} />
    </div>
  );
}
