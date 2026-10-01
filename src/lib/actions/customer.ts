"use server";

import {
  createReservationSchema,
  availabilityQuerySchema,
  dayAvailabilityQuerySchema,
} from "../validation";
import {
  createReservation,
  getAvailabilityForSlot,
  getDayAvailability,
  ReservationConflictError,
  ReservationValidationError,
  type SlotAvailability,
  type TableAvailability,
} from "../reservations";
import { queueReservationConfirmation } from "../notifications";
import { shortConfirmationCode } from "../confirmationCode";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function fetchAvailability(input: {
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
}): Promise<ActionResult<TableAvailability[]>> {
  const parsed = availabilityQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  try {
    const data = await getAvailabilityForSlot(
      parsed.data.date,
      parsed.data.startTime,
      parsed.data.endTime,
      parsed.data.partySize,
    );
    return { ok: true, data };
  } catch (err) {
    console.error("fetchAvailability failed", err);
    return { ok: false, error: "Verfügbarkeit konnte nicht geladen werden." };
  }
}

/** Welche Uhrzeiten sind an diesem Tag noch frei (für die Von-/Bis-Auswahl)? */
export async function fetchDayAvailability(input: {
  date: string;
  partySize: number;
}): Promise<ActionResult<SlotAvailability[]>> {
  const parsed = dayAvailabilityQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  try {
    const data = await getDayAvailability(parsed.data.date, parsed.data.partySize);
    return { ok: true, data };
  } catch (err) {
    console.error("fetchDayAvailability failed", err);
    return { ok: false, error: "Zeiten konnten nicht geladen werden." };
  }
}

export type ReservationConfirmation = {
  /** Kurzer Code, so wie ihn der Gast sieht und per E-Mail erhält. */
  confirmationCode: string;
  tableNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  customerName: string;
  customerEmail: string;
  /** true, wenn eine Bestätigungs-E-Mail versendet wird (SMTP eingerichtet). */
  emailQueued: boolean;
};

export async function submitReservation(
  input: unknown,
): Promise<ActionResult<ReservationConfirmation>> {
  const parsed = createReservationSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { ok: false, error: firstIssue?.message ?? "Ungültige Eingabe." };
  }

  try {
    const reservation = await createReservation({
      ...parsed.data,
      source: "ONLINE",
    });
    const emailQueued = queueReservationConfirmation(reservation);
    return {
      ok: true,
      data: {
        confirmationCode: shortConfirmationCode(reservation.confirmationCode),
        tableNumber: reservation.table.number,
        date: parsed.data.date,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        partySize: reservation.partySize,
        customerName: reservation.customerName,
        customerEmail: reservation.customerEmail,
        emailQueued,
      },
    };
  } catch (err) {
    if (err instanceof ReservationConflictError || err instanceof ReservationValidationError) {
      return { ok: false, error: err.message };
    }
    console.error("submitReservation failed", err);
    return { ok: false, error: "Reservation konnte nicht gespeichert werden. Bitte versuchen Sie es erneut." };
  }
}
