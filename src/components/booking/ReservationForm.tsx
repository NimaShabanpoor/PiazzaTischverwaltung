"use client";

import { useState, useTransition, type ReactNode } from "react";
import { CalendarDays, Loader2, User, Users, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WhenFields, type WhenPatch } from "./WhenFields";
import { PartySizeField } from "./PartySizeField";
import { TableChoice } from "./TableChoice";
import { ContactFields, type ContactData } from "./ContactFields";
import { ConfirmationScreen } from "./ConfirmationScreen";
import { RequestSentScreen } from "./RequestSentScreen";
import { submitReservation, type ReservationConfirmation } from "@/lib/actions/customer";
import { submitGroupRequest, type GroupRequestConfirmation } from "@/lib/actions/groupRequests";
import {
  CLOSING_TIME,
  DEFAULT_RESERVATION_DURATION_MINUTES,
  MAX_ONLINE_PARTY_SIZE,
  OPENING_TIME,
} from "@/lib/constants";
import {
  addDaysISO,
  formatDateDeCH,
  formatWeekdayDe,
  generateEndTimeOptions,
  timeToMinutes,
} from "@/lib/time";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()/.\-\s]{6,}$/;
const BOOKABLE_DAYS_AHEAD = 60;

type FormState = {
  date: string;
  startTime: string;
  endTime: string;
  partySize: number | null;
  tableId: string | null;
  tableNumber: number | null;
  contact: ContactData;
};

/** Schlägt eine Bis-Zeit vor (Standarddauer), begrenzt auf gültige Optionen. */
function suggestEndTime(startTime: string): string {
  const options = generateEndTimeOptions(startTime);
  const target = timeToMinutes(startTime) + DEFAULT_RESERVATION_DURATION_MINUTES;
  return options.find((t) => timeToMinutes(t) >= target) ?? options[options.length - 1] ?? "";
}

export function ReservationForm({
  todayISO,
  nowIso,
}: {
  todayISO: string;
  nowIso: string;
}) {
  const initialState: FormState = {
    date: todayISO,
    startTime: "",
    endTime: "",
    partySize: 2,
    tableId: null,
    tableNumber: null,
    contact: { customerName: "", customerPhone: "", customerEmail: "", note: "" },
  };

  const [state, setState] = useState<FormState>(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ReservationConfirmation | null>(null);
  const [requestSent, setRequestSent] = useState<GroupRequestConfirmation | null>(null);
  const [availabilityKey, setAvailabilityKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Gruppen über der Online-Grenze wählen keinen Tisch, sondern senden eine Anfrage.
  const isRequest = (state.partySize ?? 0) > MAX_ONLINE_PARTY_SIZE;
  const timeChosen = !!state.date && !!state.startTime && !!state.endTime;

  function patchWhen(patch: WhenPatch) {
    setState((s) => {
      const next: FormState = { ...s, ...patch, tableId: null, tableNumber: null };
      if (patch.startTime !== undefined) {
        // Bis-Zeit passend vorschlagen bzw. ungültige Auswahl korrigieren.
        next.endTime = patch.startTime ? suggestEndTime(patch.startTime) : "";
      } else if (patch.date !== undefined && next.startTime) {
        const valid = generateEndTimeOptions(next.startTime);
        if (!valid.includes(next.endTime)) next.endTime = suggestEndTime(next.startTime);
      }
      return next;
    });
    setSubmitError(null);
  }

  const contactValid =
    state.contact.customerName.trim().length >= 2 &&
    PHONE_RE.test(state.contact.customerPhone.trim()) &&
    EMAIL_RE.test(state.contact.customerEmail.trim());

  const canSubmit =
    timeChosen && !!state.partySize && contactValid && (isRequest || !!state.tableId);

  function handleSubmit() {
    if (!canSubmit || !state.partySize) return;
    setSubmitError(null);

    const contact = {
      customerName: state.contact.customerName.trim(),
      customerPhone: state.contact.customerPhone.trim(),
      customerEmail: state.contact.customerEmail.trim(),
      note: state.contact.note.trim() || undefined,
    };

    if (isRequest) {
      startTransition(async () => {
        const res = await submitGroupRequest({
          date: state.date,
          startTime: state.startTime,
          endTime: state.endTime,
          partySize: state.partySize,
          ...contact,
        });
        if (res.ok) setRequestSent(res.data);
        else setSubmitError(res.error);
      });
      return;
    }

    startTransition(async () => {
      const res = await submitReservation({
        tableId: state.tableId,
        date: state.date,
        startTime: state.startTime,
        endTime: state.endTime,
        partySize: state.partySize,
        ...contact,
      });
      if (res.ok) {
        setConfirmation(res.data);
      } else {
        setSubmitError(res.error);
        // Bei einer Doppelbuchung: Tischauswahl leeren und Verfügbarkeit neu laden.
        if (res.error.toLowerCase().includes("reserviert")) {
          setState((s) => ({ ...s, tableId: null, tableNumber: null }));
          setAvailabilityKey((k) => k + 1);
        }
      }
    });
  }

  function reset() {
    setState(initialState);
    setConfirmation(null);
    setRequestSent(null);
    setSubmitError(null);
  }

  if (confirmation || requestSent) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        {confirmation && <ConfirmationScreen confirmation={confirmation} onReset={reset} />}
        {requestSent && <RequestSentScreen request={requestSent} onReset={reset} />}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7 max-w-xl">
        <h1 className="font-display text-3xl font-semibold text-brand-navy sm:text-4xl">
          Tisch reservieren
        </h1>
        <p className="mt-2 text-brand-navy/60">
          Zeit, Personenzahl und Tisch auf einen Blick – ausfüllen und direkt bestätigen.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        {/* Linke Spalte: Zeit & Personen */}
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-8 [&>section+section]:border-t [&>section+section]:border-brand-cream-dark [&>section+section]:pt-8">
            <Section
              icon={<CalendarDays size={20} />}
              title="Wann möchten Sie kommen?"
              description={`Wir sind täglich von ${OPENING_TIME} bis ${CLOSING_TIME} Uhr für Sie da.`}
            >
              <WhenFields
                date={state.date}
                startTime={state.startTime}
                endTime={state.endTime}
                todayISO={todayISO}
                maxDateISO={addDaysISO(todayISO, BOOKABLE_DAYS_AHEAD)}
                nowIso={nowIso}
                onChange={patchWhen}
              />
            </Section>

            <Section
              icon={<Users size={20} />}
              title="Für wie viele Personen?"
              description={`Online reservierbar für bis zu ${MAX_ONLINE_PARTY_SIZE} Personen.`}
            >
              <PartySizeField
                value={state.partySize}
                onChange={(partySize) =>
                  setState((s) => ({ ...s, partySize, tableId: null, tableNumber: null }))
                }
              />
            </Section>
          </div>
        </div>

        {/* Rechte Spalte: Tischauswahl + Zusammenfassung */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
                <UtensilsCrossed size={20} />
              </span>
              <h2 className="font-display text-lg font-semibold text-brand-navy">
                Tisch wählen
              </h2>
            </div>

            {isRequest ? (
              <p className="rounded-2xl bg-status-occupied-bg/60 p-4 text-sm text-brand-navy/80">
                Für Gruppen ab {MAX_ONLINE_PARTY_SIZE + 1} Personen stellen wir die Tische
                individuell zusammen – die Tischauswahl entfällt bei Ihrer Anfrage.
              </p>
            ) : !timeChosen || !state.partySize ? (
              <p className="rounded-2xl bg-brand-cream p-4 text-sm text-brand-navy/60">
                Wählen Sie links Datum und Uhrzeit – danach zeigen wir Ihnen die freien
                Tische.
              </p>
            ) : (
              <TableChoice
                date={state.date}
                startTime={state.startTime}
                endTime={state.endTime}
                partySize={state.partySize}
                value={state.tableId}
                refreshKey={availabilityKey}
                onSelect={(tableId, tableNumber) =>
                  setState((s) => ({ ...s, tableId, tableNumber }))
                }
              />
            )}
          </div>

          <div className="rounded-3xl bg-brand-teal p-6 text-white shadow-sm">
            <h2 className="font-display text-lg font-semibold">Ihre Reservation</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <SummaryRow
                label="Datum"
                value={
                  state.date
                    ? `${formatWeekdayDe(state.date)}, ${formatDateDeCH(state.date)}`
                    : null
                }
              />
              <SummaryRow
                label="Uhrzeit"
                value={timeChosen ? `${state.startTime} – ${state.endTime} Uhr` : null}
              />
              <SummaryRow
                label="Personen"
                value={state.partySize ? String(state.partySize) : null}
              />
              <SummaryRow
                label="Tisch"
                value={
                  isRequest
                    ? "wird zugeteilt"
                    : state.tableNumber
                      ? `Tisch ${state.tableNumber}`
                      : null
                }
              />
            </dl>

            {submitError && (
              <p className="mt-4 rounded-xl bg-white p-3 text-sm font-medium text-status-reserved">
                {submitError}
              </p>
            )}

            <Button
              size="lg"
              className="mt-5 w-full"
              onClick={handleSubmit}
              disabled={!canSubmit || isPending}
            >
              {isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isRequest ? (
                "Anfrage senden"
              ) : (
                "Reservation bestätigen"
              )}
            </Button>

            {!canSubmit && (
              <p className="mt-3 text-center text-xs text-white/70">
                Bitte Zeit, Personen{isRequest ? "" : ", Tisch"} und Kontaktdaten ausfüllen.
              </p>
            )}
          </div>
        </aside>

        {/* Linke Spalte, zweite Karte: Kontaktdaten */}
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8 lg:col-start-1 lg:row-start-2">
          <Section
            icon={<User size={20} />}
            title="Ihre Kontaktdaten"
            description="Damit wir Sie bei Bedarf erreichen können."
          >
            <ContactFields
              data={state.contact}
              onChange={(patch) =>
                setState((s) => ({ ...s, contact: { ...s.contact, ...patch } }))
              }
            />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-brand-navy">{title}</h2>
          {description && <p className="text-sm text-brand-navy/60">{description}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/15 pb-2 last:border-0 last:pb-0">
      <dt className="text-white/70">{label}</dt>
      <dd className={value ? "font-semibold" : "text-white/40"}>{value ?? "offen"}</dd>
    </div>
  );
}
