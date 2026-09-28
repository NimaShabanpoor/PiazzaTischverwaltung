"use client";

import { useState, useTransition } from "react";
import { Loader2, LogOut, Search, Users, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/Button";
import { ErrorText, Input, Label } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  cancelMyReservationAction,
  lookupMyReservations,
  type MyReservation,
} from "@/lib/actions/customerDashboard";
import { formatDateDeCH, formatWeekdayDe, toDateISO, toTimeHHmm } from "@/lib/time";

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Bestätigt",
  ARRIVED: "Angekommen",
  CANCELLED: "Storniert",
  COMPLETED: "Abgeschlossen",
};

export default function MeineReservationenPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [session, setSession] = useState<{ email: string; code: string } | null>(null);
  const [reservations, setReservations] = useState<MyReservation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitLookup() {
    setError(null);
    startTransition(async () => {
      const res = await lookupMyReservations(email, code);
      if (res.ok) {
        setSession({ email, code });
        setReservations(res.data);
      } else {
        setError(res.error);
      }
    });
  }

  function logout() {
    setSession(null);
    setReservations(null);
    setEmail("");
    setCode("");
    setError(null);
  }

  function patchReservation(id: string, patch: Partial<MyReservation>) {
    setReservations((list) =>
      list ? list.map((r) => (r.id === id ? { ...r, ...patch } : r)) : list,
    );
  }

  const active = reservations?.filter((r) => r.status === "CONFIRMED" || r.status === "ARRIVED") ?? [];
  const past = reservations?.filter((r) => r.status === "CANCELLED" || r.status === "COMPLETED") ?? [];

  return (
    <div className="min-h-screen bg-brand-cream">
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">
          {!session ? (
            <>
              <h1 className="mb-1 font-display text-2xl font-semibold text-brand-navy">
                Meine Reservation
              </h1>
              <p className="mb-6 text-brand-navy/60">
                Kein Konto nötig – geben Sie einfach Ihre E-Mail-Adresse und den
                Bestätigungscode aus Ihrer Reservationsbestätigung ein.
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="lookup-email">E-Mail-Adresse</Label>
                  <Input
                    id="lookup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@beispiel.ch"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="lookup-code">Bestätigungscode</Label>
                  <Input
                    id="lookup-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="z.B. RCUXXJ8G"
                    className="uppercase"
                  />
                </div>
                <ErrorText>{error}</ErrorText>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={!email.trim() || !code.trim() || isPending}
                  onClick={submitLookup}
                >
                  {isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Search size={18} />
                      Reservationen anzeigen
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-semibold text-brand-navy">
                    Meine Reservationen
                  </h1>
                  <p className="text-brand-navy/60">{session.email}</p>
                </div>
                <Button variant="ghost" size="md" onClick={logout}>
                  <LogOut size={16} />
                  Abmelden
                </Button>
              </div>

              {active.length === 0 && (
                <p className="rounded-xl bg-brand-cream p-4 text-brand-navy/60">
                  Keine bevorstehenden Reservationen gefunden.
                </p>
              )}

              <div className="space-y-4">
                {active.map((r) => (
                  <ReservationCard
                    key={r.id}
                    reservation={r}
                    email={session.email}
                    code={session.code}
                    onCancelled={() => patchReservation(r.id, { status: "CANCELLED" })}
                  />
                ))}
              </div>

              {past.length > 0 && (
                <details className="mt-6 text-sm text-brand-navy/60">
                  <summary className="cursor-pointer select-none font-medium">
                    Vergangene / stornierte Reservationen ({past.length})
                  </summary>
                  <ul className="mt-3 space-y-2">
                    {past.map((r) => (
                      <li
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-cream px-4 py-2.5"
                      >
                        <span>
                          {formatDateDeCH(toDateISO(r.start))} · {toTimeHHmm(r.start)}–
                          {toTimeHHmm(r.end)} Uhr · Tisch {r.tableNumber}
                        </span>
                        <span className="font-medium">{STATUS_LABEL[r.status]}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function ReservationCard({
  reservation,
  email,
  code,
  onCancelled,
}: {
  reservation: MyReservation;
  email: string;
  code: string;
  onCancelled: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dateISO = toDateISO(reservation.start);

  function cancel() {
    setError(null);
    startTransition(async () => {
      const res = await cancelMyReservationAction(reservation.id, email, code);
      if (res.ok) {
        setConfirmOpen(false);
        onCancelled();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-brand-cream-dark p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-brand-navy">
            {formatWeekdayDe(dateISO)}, {formatDateDeCH(dateISO)}
          </p>
          <p className="text-brand-navy/70">
            {toTimeHHmm(reservation.start)} – {toTimeHHmm(reservation.end)} Uhr · Tisch{" "}
            {reservation.tableNumber}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-brand-navy/50">
            <Users size={14} />
            {reservation.partySize}{" "}
            {reservation.partySize === 1 ? "Person" : "Personen"}
          </p>
          {reservation.note && (
            <p className="mt-1 text-sm italic text-brand-navy/50">„{reservation.note}“</p>
          )}
        </div>
        <span className="rounded-full bg-status-free-bg px-3 py-1 text-sm font-medium text-status-free">
          {STATUS_LABEL[reservation.status]}
        </span>
      </div>

      {reservation.status === "CONFIRMED" && (
        <div className="mt-4">
          <Button variant="ghost" size="md" onClick={() => setConfirmOpen(true)}>
            <XCircle size={16} />
            Stornieren
          </Button>
        </div>
      )}

      <ErrorText>{error}</ErrorText>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={cancel}
        title="Reservation stornieren"
        description={`Ihre Reservation am ${formatDateDeCH(dateISO)} um ${toTimeHHmm(
          reservation.start,
        )} Uhr wird storniert.`}
        confirmLabel="Reservation stornieren"
        danger
        isPending={isPending}
      />
    </div>
  );
}
