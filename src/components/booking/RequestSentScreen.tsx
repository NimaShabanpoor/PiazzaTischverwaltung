"use client";

import { Mail, Send } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatDateDeCH, formatWeekdayDe } from "@/lib/time";
import type { GroupRequestConfirmation } from "@/lib/actions/groupRequests";

export function RequestSentScreen({
  request,
  onReset,
}: {
  request: GroupRequestConfirmation;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-free-bg text-status-free">
        <Send size={30} />
      </div>
      <h2 className="mt-4 font-display text-3xl font-semibold text-brand-navy">
        Anfrage gesendet!
      </h2>
      <p className="mt-2 max-w-md text-brand-navy/70">
        Vielen Dank, {request.customerName.split(" ")[0]}. Wir prüfen Ihre Anfrage und melden uns
        telefonisch oder per E-Mail bei Ihnen.
      </p>

      <div className="mt-6 w-full max-w-sm rounded-2xl border-2 border-dashed border-brand-teal bg-white p-6 text-brand-navy">
        <p>
          {formatWeekdayDe(request.date)}, {formatDateDeCH(request.date)}
        </p>
        <p>
          {request.startTime} – {request.endTime} Uhr · {request.partySize} Personen
        </p>
        <p className="mt-3 text-sm text-brand-navy/50">Noch keine verbindliche Reservation.</p>
      </div>

      {request.emailQueued && (
        <p className="mt-5 flex max-w-sm items-center justify-center gap-2 rounded-xl bg-status-free-bg px-4 py-3 text-sm text-brand-navy">
          <Mail size={18} className="shrink-0 text-status-free" />
          <span>
            Eine Eingangsbestätigung wurde an <strong>{request.customerEmail}</strong> gesendet.
          </span>
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={onReset}>
          Neue Reservation
        </Button>
        <Link href="/">
          <Button variant="ghost">Zur Startseite</Button>
        </Link>
      </div>
    </div>
  );
}
