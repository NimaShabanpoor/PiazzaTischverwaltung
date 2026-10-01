"use server";

import { createReservationSchema, availabilityQuerySchema, dayOccupancySchema } from "../validation";
import {
  createReservation,
  getAvailabilityForSlot,
  getDayOccupancy,
  ReservationConflictError,
  ReservationValidationError,
  type TableAvailability,
  type TableDayOccupancy,
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

export async function fetchDayOccupancy(input: {
  date: string;
}): Promise<ActionResult<TableDayOccupancy[]>> {
  const parsed = dayOccupancySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  try {
    return { ok: true, data: await getDayOccupancy(parsed.data.date) };
  } catch (err) {
    console.error("fetchDayOccupancy failed", err);
    return { ok: false, error: "Belegung konnte nicht geladen werden." };
  }
}
