import { CheckCircle2, Clock, Mail, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatDateDeCH, formatWeekdayDe } from "@/lib/time";
import type { ReservationConfirmation } from "@/lib/actions/customer";

export function ConfirmationScreen({
  confirmation,
}: {
  confirmation: ReservationConfirmation;
}) {
  const firstName = confirmation.customerName.split(" ")[0];
  const pending = confirmation.status === "angefragt";
  const declined = confirmation.status === "abgelehnt";

  return (
    <div className="flex flex-col items-center py-6 text-center">
      {pending ? (
        <Clock size={64} className="text-status-occupied" />
      ) : declined ? (
        <XCircle size={64} className="text-status-reserved" />
      ) : (
        <CheckCircle2 size={64} className="text-status-free" />
      )}
      <h2 className="mt-4 font-display text-3xl font-semibold text-brand-navy">
        {pending
          ? "Ihre Reservation wird bearbeitet"
          : declined
            ? "Reservation nicht möglich"
            : "Reservation bestätigt!"}
      </h2>
      <p className="mt-2 max-w-md text-brand-navy/70">
        {pending
          ? `Vielen Dank, ${firstName}. Wir prüfen Ihre Anfrage und melden uns in Kürze per E-Mail – erst dann ist die Reservation verbindlich.`
          : declined
            ? `Leider können wir Ihnen diesen Tisch nicht anbieten, ${firstName}. Gerne finden wir einen anderen Termin für Sie.`
            : `Vielen Dank, ${firstName}. Wir freuen uns auf Ihren Besuch.`}
      </p>

      <div className="mt-6 w-full max-w-sm rounded-2xl border-2 border-dashed border-brand-teal bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/50">
          Bestätigungscode
        </p>
        <p className="mt-1 font-display text-2xl font-semibold tracking-wide text-brand-teal">
          {confirmation.confirmationCode}
        </p>
        <div className="mt-4 space-y-1 text-brand-navy">
          <p>
            {formatWeekdayDe(confirmation.date)}, {formatDateDeCH(confirmation.date)} ·{" "}
            {confirmation.startTime} – {confirmation.endTime} Uhr
          </p>
          <p>
            Tisch {confirmation.tableNumber} · {confirmation.partySize}{" "}
            {confirmation.partySize === 1 ? "Person" : "Personen"}
          </p>
        </div>
      </div>

      {confirmation.emailQueued && (
        <p className="mt-5 flex max-w-sm items-center justify-center gap-2 rounded-xl bg-status-free-bg px-4 py-3 text-sm text-brand-navy">
          <Mail size={18} className="shrink-0 text-status-free" />
          <span>
            {pending ? (
              <>
                Eine Eingangsbestätigung wurde an{" "}
                <strong>{confirmation.customerEmail}</strong> gesendet. Die Zu- oder Absage
                folgt an dieselbe Adresse.
              </>
            ) : (
              <>
                Eine Bestätigung wurde an <strong>{confirmation.customerEmail}</strong>{" "}
                gesendet.
              </>
            )}
          </span>
        </p>
      )}

      <p className="mt-4 max-w-sm text-sm text-brand-navy/50">
        Mit Ihrer E-Mail-Adresse und dem Bestätigungscode können Sie Ihre Reservation unter
        „Meine Reservation“ jederzeit einsehen oder stornieren.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/reservieren">
          <Button variant="outline">Weitere Reservation</Button>
        </Link>
        <Link href="/">
          <Button variant="ghost">Zur Startseite</Button>
        </Link>
      </div>
    </div>
  );
}
