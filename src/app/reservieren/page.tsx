import { ReservationForm } from "@/components/booking/ReservationForm";
import { SiteHeader } from "@/components/SiteHeader";
import { getClosedDaysBetween } from "@/lib/closedDays";
import { addDaysISO, zurichNow, zurichTodayISO } from "@/lib/time";

export const dynamic = "force-dynamic";

const BOOKABLE_DAYS_AHEAD = 60;

export default async function ReservierenPage() {
  const todayISO = zurichTodayISO();
  const nowIso = zurichNow().toISOString();
  const closedDays = await getClosedDaysBetween(
    todayISO,
    addDaysISO(todayISO, BOOKABLE_DAYS_AHEAD),
  );

  return (
    <div className="min-h-screen bg-brand-cream">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <ReservationForm
          todayISO={todayISO}
          nowIso={nowIso}
          closedDays={closedDays}
          bookableDaysAhead={BOOKABLE_DAYS_AHEAD}
        />
      </main>
    </div>
  );
}
