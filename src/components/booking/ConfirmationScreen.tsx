"use client";

import { CheckCircle2, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatDateDeCH, formatWeekdayDe } from "@/lib/time";
import type { ReservationConfirmation } from "@/lib/actions/customer";

export function ConfirmationScreen({
  confirmation,
  onReset,
}: {
  confirmation: ReservationConfirmation;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <CheckCircle2 size={64} className="text-status-free" />
      <h2 className="mt-4 font-display text-3xl font-semibold text-brand-navy">
        Reservation bestätigt!
      </h2>
      <p className="mt-2 max-w-md text-brand-navy/70">
        Vielen Dank, {confirmation.customerName.split(" ")[0]}. Wir freuen uns auf Ihren Besuch.
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
            Eine Bestätigung wurde an <strong>{confirmation.customerEmail}</strong> gesendet.
          </span>
        </p>
      )}

      <p className="mt-4 max-w-sm text-sm text-brand-navy/50">
        Mit Ihrer E-Mail-Adresse und dem Bestätigungscode können Sie Ihre Reservation unter
        „Meine Reservation“ jederzeit einsehen oder stornieren.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={onReset}>
          Weitere Reservation
        </Button>
        <Link href="/">
          <Button variant="ghost">Zur Startseite</Button>
        </Link>
      </div>
    </div>
  );
}
