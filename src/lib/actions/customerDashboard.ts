"use server";

import type { ReservationStatus } from "@prisma/client";
import { prisma } from "../prisma";
import { ReservationValidationError, updateReservation } from "../reservations";
import { shortConfirmationCode } from "../confirmationCode";
import type { ActionResult } from "./customer";

export type MyReservation = {
  id: string;
  tableNumber: number;
  start: Date;
  end: Date;
  partySize: number;
  customerName: string;
  status: ReservationStatus;
  note: string | null;
};

/**
 * Kein Kundenkonto, kein Passwort: Der Besitz-Nachweis für "meine
 * Reservationen" ist E-Mail + irgendein gültiger Bestätigungscode zu
 * dieser E-Mail. Damit werden dann ALLE Reservationen dieser E-Mail
 * gezeigt (echtes kleines Dashboard, keine Einzel-Abfrage).
 */
async function findVerifiedReservations(email: string, code: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedEmail || normalizedCode.length < 4) return null;

  const candidates = await prisma.reservation.findMany({
    where: { customerEmail: { equals: normalizedEmail, mode: "insensitive" } },
    include: { table: true },
    orderBy: { start: "desc" },
  });

  const owns = candidates.some(
    (r) => shortConfirmationCode(r.confirmationCode) === normalizedCode,
  );
  if (!owns) return null;
  return candidates;
}

export async function lookupMyReservations(
  email: string,
  code: string,
): Promise<ActionResult<MyReservation[]>> {
  try {
    const reservations = await findVerifiedReservations(email, code);
    if (!reservations) {
      return {
        ok: false,
        error: "E-Mail-Adresse oder Bestätigungscode stimmen nicht überein.",
      };
    }
    return {
      ok: true,
      data: reservations.map((r) => ({
        id: r.id,
        tableNumber: r.table.number,
        start: r.start,
        end: r.end,
        partySize: r.partySize,
        customerName: r.customerName,
        status: r.status,
        note: r.note,
      })),
    };
  } catch (err) {
    console.error("lookupMyReservations failed", err);
    return { ok: false, error: "Reservationen konnten nicht geladen werden." };
  }
}

/** Kunde storniert eine eigene, noch bestätigte Reservation selbst. */
export async function cancelMyReservationAction(
  reservationId: string,
  email: string,
  code: string,
): Promise<ActionResult<null>> {
  try {
    const reservations = await findVerifiedReservations(email, code);
    if (!reservations) {
      return {
        ok: false,
        error: "E-Mail-Adresse oder Bestätigungscode stimmen nicht überein.",
      };
    }
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) {
      return { ok: false, error: "Reservation wurde nicht gefunden." };
    }
    if (target.status !== "CONFIRMED") {
      return {
        ok: false,
        error: "Diese Reservation kann nicht mehr online storniert werden.",
      };
    }

    await updateReservation(reservationId, { status: "CANCELLED" });
    return { ok: true, data: null };
  } catch (err) {
    if (err instanceof ReservationValidationError) {
      return { ok: false, error: err.message };
    }
    console.error("cancelMyReservationAction failed", err);
    return { ok: false, error: "Reservation konnte nicht storniert werden." };
  }
}
