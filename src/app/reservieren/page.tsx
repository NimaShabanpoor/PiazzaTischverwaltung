import { ReservationForm } from "@/components/booking/ReservationForm";
import { SiteHeader } from "@/components/SiteHeader";
import { zurichNow, zurichTodayISO } from "@/lib/time";

export const dynamic = "force-dynamic";

export default function ReservierenPage() {
  const todayISO = zurichTodayISO();
  const nowIso = zurichNow().toISOString();

  return (
    <div className="min-h-screen bg-brand-cream">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <ReservationForm todayISO={todayISO} nowIso={nowIso} />
      </main>
    </div>
  );
}
