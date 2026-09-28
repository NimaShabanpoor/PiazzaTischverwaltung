"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ErrorText, Input, Label, Textarea } from "@/components/ui/Field";
import {
  generateEndTimeOptions,
  generateStartTimeOptions,
  timeToMinutes,
  toDateISO,
  toTimeHHmm,
} from "@/lib/time";
import { DEFAULT_RESERVATION_DURATION_MINUTES } from "@/lib/constants";
import {
  createManualReservationAction,
  updateReservationAction,
} from "@/lib/actions/adminReservations";
import type { ReservationDTO, TableDTO } from "@/lib/adminTypes";

const STATUS_OPTIONS = [
  { value: "CONFIRMED", label: "Bestätigt" },
  { value: "ARRIVED", label: "Angekommen" },
  { value: "CANCELLED", label: "Storniert" },
  { value: "COMPLETED", label: "Abgeschlossen" },
] as const;

/** Vorbelegung für eine neue Reservation, z.B. aus einer Gruppenanfrage. */
export type ReservationPrefill = {
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  note: string | null;
};

type FormState = {
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  tableId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  note: string;
  status: (typeof STATUS_OPTIONS)[number]["value"];
};

/** Schlägt eine Bis-Zeit vor (Standarddauer), begrenzt auf gültige Optionen. */
function defaultEndTimeFor(startTime: string): string {
  const target = timeToMinutes(startTime) + DEFAULT_RESERVATION_DURATION_MINUTES;
  const options = generateEndTimeOptions(startTime);
  return options.find((t) => timeToMinutes(t) >= target) ?? options[options.length - 1] ?? startTime;
}

function toFormState(
  reservation: ReservationDTO | undefined,
  defaults: { date?: string; tableId?: string },
  prefill: ReservationPrefill | undefined,
): FormState {
  if (reservation) {
    return {
      date: toDateISO(reservation.start),
      startTime: toTimeHHmm(reservation.start),
      endTime: toTimeHHmm(reservation.end),
      partySize: reservation.partySize,
      tableId: reservation.tableId,
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      customerEmail: reservation.customerEmail,
      note: reservation.note ?? "",
      status: reservation.status,
    };
  }
  if (prefill) {
    return {
      ...prefill,
      note: prefill.note ?? "",
      tableId: defaults.tableId ?? "",
      status: "CONFIRMED",
    };
  }
  const startTime = generateStartTimeOptions()[0] ?? "18:00";
  return {
    date: defaults.date ?? toDateISO(new Date()),
    startTime,
    endTime: defaultEndTimeFor(startTime),
    partySize: 2,
    tableId: defaults.tableId ?? "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    note: "",
    status: "CONFIRMED",
  };
}

/**
 * Formular für neue/bearbeitete Reservationen. Der Formularstatus wird nur
 * beim Mount initialisiert – der Aufrufer muss beim Öffnen (neu oder mit
 * anderer `editing`-Reservation) einen neuen `key` übergeben, damit das
 * Formular sauber neu startet (statt per Effect zurückzusetzen).
 */
export function ReservationFormModal({
  open,
  onClose,
  tables,
  editing,
  defaultDate,
  defaultTableId,
  prefill,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  tables: TableDTO[];
  editing?: ReservationDTO;
  defaultDate?: string;
  defaultTableId?: string;
  prefill?: ReservationPrefill;
  /** Wird nach erfolgreichem Speichern aufgerufen (vor dem Schliessen). */
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    toFormState(editing, { date: defaultDate, tableId: defaultTableId }, prefill),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const startOptions = generateStartTimeOptions();
  const endOptions = generateEndTimeOptions(form.startTime);
  const isEdit = !!editing;
  const selectedTable = tables.find((t) => t.id === form.tableId);
  const overCapacity = !!selectedTable && form.partySize > selectedTable.seats;

  function selectStartTime(startTime: string) {
    setForm((f) => ({ ...f, startTime, endTime: defaultEndTimeFor(startTime) }));
  }

  function submit() {
    if (!form.tableId) {
      setError("Bitte einen Tisch wählen.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const payload = {
        tableId: form.tableId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        partySize: form.partySize,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim(),
        note: form.note.trim() || undefined,
      };
      const res = isEdit
        ? await updateReservationAction(editing!.id, { ...payload, status: form.status })
        : await createManualReservationAction(payload);

      if (res.ok) {
        onSaved?.();
        onClose();
      } else {
        setError(res.error);
      }
    });
  }

  const title = isEdit
    ? "Reservation bearbeiten"
    : prefill
      ? "Anfrage als Reservation erfassen"
      : "Neue Reservation";

  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="f-date">Datum</Label>
          <Input
            id="f-date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="f-start">Von</Label>
          <select
            id="f-start"
            value={form.startTime}
            onChange={(e) => selectStartTime(e.target.value)}
            className="w-full rounded-xl border-2 border-brand-cream-dark bg-white px-4 py-3 text-base text-brand-navy focus:border-brand-teal outline-none"
          >
            {!startOptions.includes(form.startTime) && (
              <option value={form.startTime}>{form.startTime}</option>
            )}
            {startOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="f-end">Bis</Label>
          <select
            id="f-end"
            value={form.endTime}
            onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
            className="w-full rounded-xl border-2 border-brand-cream-dark bg-white px-4 py-3 text-base text-brand-navy focus:border-brand-teal outline-none"
          >
            {!endOptions.includes(form.endTime) && (
              <option value={form.endTime}>{form.endTime}</option>
            )}
            {endOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="f-party">Personen</Label>
          <Input
            id="f-party"
            type="number"
            min={1}
            max={30}
            value={form.partySize}
            onChange={(e) =>
              setForm((f) => ({ ...f, partySize: Number(e.target.value) || 1 }))
            }
          />
        </div>
        <div>
          <Label htmlFor="f-table">Tisch</Label>
          <select
            id="f-table"
            value={form.tableId}
            onChange={(e) => setForm((f) => ({ ...f, tableId: e.target.value }))}
            className="w-full rounded-xl border-2 border-brand-cream-dark bg-white px-4 py-3 text-base text-brand-navy focus:border-brand-teal outline-none"
          >
            <option value="">Bitte wählen…</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                Tisch {t.number} ({t.seats} Plätze)
              </option>
            ))}
          </select>
        </div>
        {overCapacity && selectedTable && (
          <p className="rounded-xl bg-status-occupied-bg p-3 text-sm text-brand-navy sm:col-span-2">
            Hinweis: {form.partySize} Personen, aber Tisch {selectedTable.number} hat nur{" "}
            {selectedTable.seats} Plätze. Stellen Sie ggf. Tische zusammen und reservieren oder
            sperren Sie den zweiten Tisch für diese Zeit.
          </p>
        )}
        <div className="sm:col-span-2">
          <Label htmlFor="f-name">Name</Label>
          <Input
            id="f-name"
            value={form.customerName}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="f-phone">Telefon</Label>
          <Input
            id="f-phone"
            value={form.customerPhone}
            onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="f-email">E-Mail</Label>
          <Input
            id="f-email"
            type="email"
            value={form.customerEmail}
            onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
          />
        </div>
        {isEdit && (
          <div>
            <Label htmlFor="f-status">Status</Label>
            <select
              id="f-status"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as FormState["status"] }))
              }
              className="w-full rounded-xl border-2 border-brand-cream-dark bg-white px-4 py-3 text-base text-brand-navy focus:border-brand-teal outline-none"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          <Label htmlFor="f-note">Anmerkung</Label>
          <Textarea
            id="f-note"
            rows={2}
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </div>
      </div>

      <ErrorText>{error}</ErrorText>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          Abbrechen
        </Button>
        <Button onClick={submit} disabled={isPending}>
          {isPending ? "Speichern…" : isEdit ? "Speichern" : "Reservation anlegen"}
        </Button>
      </div>
    </Modal>
  );
}
