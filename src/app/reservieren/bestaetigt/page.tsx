import Link from "next/link";
import { SearchX } from "lucide-react";
import { ConfirmationScreen } from "@/components/booking/ConfirmationScreen";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/Button";
import { CONFIRMATION_CODE_LENGTH, shortConfirmationCode } from "@/lib/confirmationCode";
import { isMailConfigured } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { toDateISO, toTimeHHmm } from "@/lib/time";
import type { ReservationConfirmation } from "@/lib/actions/customer";

export const dynamic = "force-dynamic";

const CODE_RE = new RegExp(`^[A-Z0-9]{${CONFIRMATION_CODE_LENGTH}}$`);

/**
 * Lädt die Reservation zum Kurzcode aus der URL. Der Code ist zufällig und
 * nicht erratbar; Telefon und E-Mail des Gastes zeigt die Seite nicht an.
 */
async function loadConfirmation(code: string): Promise<ReservationConfirmation | null> {
  const normalized = code.trim().toUpperCase();
  if (!CODE_RE.test(normalized)) return null;

  const reservation = await prisma.reservation.findFirst({
    where: { confirmationCode: { endsWith: normalized, mode: "insensitive" } },
    include: { table: true },
  });
  if (!reservation || shortConfirmationCode(reservation.confirmationCode) !== normalized) {
    return null;
  }

  return {
    confirmationCode: normalized,
    tableNumber: reservation.table.number,
    date: toDateISO(reservation.start),
    startTime: toTimeHHmm(reservation.start),
    endTime: toTimeHHmm(reservation.end),
    partySize: reservation.partySize,
    customerName: reservation.customerName,
    customerEmail: reservation.customerEmail,
    emailQueued: isMailConfigured(),
  };
}

/** Bestätigungsseite, auf die das Buchungsformular nach Erfolg weiterleitet. */
export default async function ReservationBestaetigtPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const confirmation = typeof code === "string" ? await loadConfirmation(code) : null;

  return (
    <div className="min-h-screen bg-brand-cream">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-sm sm:p-10">
          {confirmation ? (
            <ConfirmationScreen confirmation={confirmation} />
          ) : (
            <div className="flex flex-col items-center py-6 text-center">
              <SearchX size={56} className="text-brand-navy/40" />
              <h1 className="mt-4 font-display text-2xl font-semibold text-brand-navy">
                Reservation nicht gefunden
              </h1>
              <p className="mt-2 max-w-md text-brand-navy/60">
                Zu diesem Bestätigungscode gibt es keine Reservation. Unter „Meine Reservation“
                können Sie Ihre Buchungen mit E-Mail und Code nachschlagen.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/meine-reservationen">
                  <Button variant="outline">Meine Reservation</Button>
                </Link>
                <Link href="/reservieren">
                  <Button variant="ghost">Neue Reservation</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
