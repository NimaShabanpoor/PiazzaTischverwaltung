import Link from "next/link";
import { CalendarCheck, Clock, Link2Off, Users } from "lucide-react";
import { DecisionButtons } from "@/components/booking/DecisionButtons";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/Button";
import { findRequestByToken, type Decision } from "@/lib/reservationRequests";
import { formatDateDeCH, formatWeekdayDe, toDateISO, toTimeHHmm } from "@/lib/time";

export const dynamic = "force-dynamic";

/** Zeile in der Übersicht der Anfrage. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-brand-cream-dark py-2.5 last:border-0">
      <span className="text-sm text-brand-navy/50">{label}</span>
      <span className="text-right font-medium text-brand-navy">{value}</span>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-cream">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">{children}</div>
      </main>
    </div>
  );
}

/**
 * Freigabeseite für das Restaurant: Der Link aus der Anfrage-Mail führt hierher.
 * Kein Login – der Code in der URL ist der Nachweis. Die Seite selbst ändert
 * nichts; erst der Klick auf Annehmen oder Ablehnen entscheidet.
 */
export default async function AnfragePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ aktion?: string }>;
}) {
  const { token } = await params;
  const { aktion } = await searchParams;
  const request = await findRequestByToken(token);

  if (!request) {
    return (
      <Shell>
        <div className="py-4 text-center">
          <Link2Off size={56} className="mx-auto text-brand-navy/30" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-brand-navy">
            Link nicht gültig
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-brand-navy/60">
            Zu diesem Link gibt es keine Anfrage. Möglicherweise wurde die Reservation
            gelöscht oder der Link nicht vollständig kopiert.
          </p>
          <Link href="/admin" className="mt-6 inline-block">
            <Button variant="outline">Zum Admin-Bereich</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  const dateISO = toDateISO(request.start);
  const preselect: Decision | null =
    aktion === "annehmen" || aktion === "ablehnen" ? aktion : null;
  const open = request.status === "ANGEFRAGT";

  return (
    <Shell>
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-teal">
        {open ? "Neue Anfrage" : "Bereits entschieden"}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-brand-navy">
        {request.customerName}
      </h1>
      <p className="mt-1 text-brand-navy/60">
        möchte einen Tisch reservieren.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-brand-cream p-4">
          <CalendarCheck size={20} className="text-brand-teal" />
          <p className="mt-2 text-xs text-brand-navy/50">Datum</p>
          <p className="font-medium text-brand-navy">{formatDateDeCH(dateISO)}</p>
          <p className="text-sm text-brand-navy/60">{formatWeekdayDe(dateISO)}</p>
        </div>
        <div className="rounded-2xl bg-brand-cream p-4">
          <Clock size={20} className="text-brand-teal" />
          <p className="mt-2 text-xs text-brand-navy/50">Uhrzeit</p>
          <p className="font-medium text-brand-navy">
            {toTimeHHmm(request.start)} – {toTimeHHmm(request.end)}
          </p>
        </div>
        <div className="rounded-2xl bg-brand-cream p-4">
          <Users size={20} className="text-brand-teal" />
          <p className="mt-2 text-xs text-brand-navy/50">Personen</p>
          <p className="font-medium text-brand-navy">
            {request.partySize} {request.partySize === 1 ? "Person" : "Personen"}
          </p>
          <p className="text-sm text-brand-navy/60">Tisch {request.table.number}</p>
        </div>
      </div>

      <div className="mt-6">
        <Row label="Telefon" value={request.customerPhone} />
        <Row label="E-Mail" value={request.customerEmail} />
        {request.note && <Row label="Anmerkung" value={request.note} />}
      </div>

      <div className="mt-8">
        {open ? (
          <DecisionButtons
            token={token}
            preselect={preselect}
            customerName={request.customerName}
          />
        ) : (
          <div className="rounded-2xl bg-brand-cream p-5">
            <p className="font-display text-lg font-semibold text-brand-navy">
              {request.status === "CONFIRMED" || request.status === "ARRIVED"
                ? "Diese Anfrage wurde angenommen."
                : request.status === "ABGELEHNT"
                  ? "Diese Anfrage wurde abgelehnt."
                  : request.status === "CANCELLED"
                    ? "Diese Reservation wurde storniert."
                    : "Diese Reservation ist abgeschlossen."}
            </p>
            <p className="mt-1 text-sm text-brand-navy/60">
              Der Gast wurde bereits informiert. Änderungen sind im Admin-Bereich möglich.
            </p>
            <Link href="/admin" className="mt-4 inline-block">
              <Button variant="outline">Zum Admin-Bereich</Button>
            </Link>
          </div>
        )}
      </div>
    </Shell>
  );
}
