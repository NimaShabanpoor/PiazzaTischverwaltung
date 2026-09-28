import { getAllTablesSorted, getDayReservations } from "@/lib/adminData";
import { zurichTodayISO } from "@/lib/time";
import { DayOverview } from "@/components/admin/DayOverview";
import { AutoRefresh } from "@/components/admin/AutoRefresh";

export const dynamic = "force-dynamic";

export default async function ReservierungenPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const today = zurichTodayISO();
  const dateISO = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today;

  const [reservations, tables] = await Promise.all([
    getDayReservations(dateISO),
    getAllTablesSorted(),
  ]);

  return (
    <>
      {dateISO === today && <AutoRefresh />}
      <DayOverview dateISO={dateISO} reservations={reservations} tables={tables} />
    </>
  );
}
