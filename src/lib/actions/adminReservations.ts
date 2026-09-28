"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "../auth";
import {
  adminCreateReservationSchema,
  adminUpdateReservationSchema,
} from "../validation";
import {
  createReservation,
  updateReservation,
  ReservationConflictError,
  ReservationValidationError,
} from "../reservations";
import { prisma } from "../prisma";
import { queueReservationConfirmation } from "../notifications";
import type { ActionResult } from "./customer";

function revalidateReservationViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/reservierungen");
  revalidatePath("/reservieren");
}

/**
 * Chef trägt eine telefonische (oder Vor-Ort-)Reservation manuell ein.
 * Anders als online darf er mehr Personen eintragen als der Tisch Plätze hat
 * (Tische zusammenstellen). Der Gast erhält eine Bestätigungs-E-Mail.
 */
export async function createManualReservationAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdminSession();

  const parsed = adminCreateReservationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    const reservation = await createReservation(parsed.data, { enforceCapacity: false });
    queueReservationConfirmation(reservation);
    revalidateReservationViews();
    return { ok: true, data: { id: reservation.id } };
  } catch (err) {
    if (err instanceof ReservationConflictError || err instanceof ReservationValidationError) {
      return { ok: false, error: err.message };
    }
    console.error("createManualReservationAction failed", err);
    return { ok: false, error: "Reservation konnte nicht gespeichert werden." };
  }
}

export async function updateReservationAction(
  id: string,
  input: unknown,
): Promise<ActionResult<null>> {
  await requireAdminSession();

  const parsed = adminUpdateReservationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    await updateReservation(id, parsed.data, { enforceCapacity: false });
    revalidateReservationViews();
    return { ok: true, data: null };
  } catch (err) {
    if (err instanceof ReservationConflictError || err instanceof ReservationValidationError) {
      return { ok: false, error: err.message };
    }
    console.error("updateReservationAction failed", err);
    return { ok: false, error: "Änderung konnte nicht gespeichert werden." };
  }
}

/** Gast als angekommen markieren. */
export async function markArrivedAction(id: string): Promise<ActionResult<null>> {
  return updateReservationAction(id, { status: "ARRIVED" });
}

/** Reservation stornieren (Historie bleibt erhalten, Tisch wird wieder frei). */
export async function cancelReservationAction(id: string): Promise<ActionResult<null>> {
  return updateReservationAction(id, { status: "CANCELLED" });
}

/** Reservation endgültig löschen. */
export async function deleteReservationAction(id: string): Promise<ActionResult<null>> {
  await requireAdminSession();
  try {
    await prisma.reservation.delete({ where: { id } });
    revalidateReservationViews();
    return { ok: true, data: null };
  } catch (err) {
    console.error("deleteReservationAction failed", err);
    return { ok: false, error: "Reservation konnte nicht gelöscht werden." };
  }
}
