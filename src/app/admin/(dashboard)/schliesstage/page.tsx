import { getClosedDaysBetween } from "@/lib/closedDays";
import { getReservationCountsByDay } from "@/lib/adminData";
import { zurichTodayISO } from "@/lib/time";
import { ClosedDayCalendar } from "@/components/admin/ClosedDayCalendar";

export const dynamic = "force-dynamic";

export default async function SchliesstagePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const todayISO = zurichTodayISO();
  const monthISO =
    sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : todayISO.slice(0, 7);

  const [closedDays, reservationCounts] = await Promise.all([
    // "-32" liegt nach jedem echten Tagesdatum, deckt also den ganzen Monat ab.
    getClosedDaysBetween(`${monthISO}-01`, `${monthISO}-32`),
    getReservationCountsByDay(monthISO),
  ]);

  return (
    <ClosedDayCalendar
      monthISO={monthISO}
      closedDays={closedDays}
      reservationCounts={reservationCounts}
      todayISO={todayISO}
    />
  );
}
