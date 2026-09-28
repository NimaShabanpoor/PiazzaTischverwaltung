"use server";

import { revalidatePath } from "next/cache";
import { Prisma, TableStatus } from "@prisma/client";
import { prisma } from "../prisma";
import { requireAdminSession } from "../auth";
import { markOccupiedSchema, updateTableSchema } from "../validation";
import { combineDateAndTime, zurichTodayISO } from "../time";
import type { ActionResult } from "./customer";

function revalidateTableViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/tische");
  revalidatePath("/admin/reservierungen");
  revalidatePath("/reservieren");
}

export async function updateTableAction(
  tableId: string,
  input: unknown,
): Promise<ActionResult<null>> {
  await requireAdminSession();

  const parsed = updateTableSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    await prisma.table.update({
      where: { id: tableId },
      data: parsed.data,
    });
    revalidateTableViews();
    return { ok: true, data: null };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "Diese Tischnummer wird bereits verwendet." };
    }
    console.error("updateTableAction failed", err);
    return { ok: false, error: "Tisch konnte nicht gespeichert werden." };
  }
}

/**
 * Tisch für einen bestimmten Zeitraum heute als besetzt markieren (z.B.
 * Walk-in-Gast). Nach `until` ist der Tisch automatisch wieder normal
 * nutzbar (z.B. am nächsten Morgen oder für eine spätere Reservation) –
 * ein manuelles Freigeben ist dafür nicht nötig.
 */
export async function markTableOccupiedAction(
  tableId: string,
  input: unknown,
): Promise<ActionResult<null>> {
  await requireAdminSession();

  const parsed = markOccupiedSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const today = zurichTodayISO();
  const busyFrom = combineDateAndTime(today, parsed.data.from);
  const busyUntil = combineDateAndTime(today, parsed.data.until);

  try {
    await prisma.table.update({
      where: { id: tableId },
      data: { status: TableStatus.BESETZT, busyFrom, busyUntil, lockNote: null },
    });
    revalidateTableViews();
    return { ok: true, data: null };
  } catch (err) {
    console.error("markTableOccupiedAction failed", err);
    return { ok: false, error: "Tisch konnte nicht als besetzt markiert werden." };
  }
}

/** Tisch wieder freigeben (unabhängig vom Reservationsstatus). */
export async function releaseTableAction(tableId: string): Promise<ActionResult<null>> {
  await requireAdminSession();
  try {
    await prisma.table.update({
      where: { id: tableId },
      data: { status: TableStatus.FREI, lockNote: null, busyFrom: null, busyUntil: null },
    });
    revalidateTableViews();
    return { ok: true, data: null };
  } catch (err) {
    console.error("releaseTableAction failed", err);
    return { ok: false, error: "Tisch konnte nicht freigegeben werden." };
  }
}

/** Tisch temporär sperren (z.B. defekt, reserviert für privaten Anlass). */
export async function lockTableAction(
  tableId: string,
  note?: string,
): Promise<ActionResult<null>> {
  await requireAdminSession();
  try {
    await prisma.table.update({
      where: { id: tableId },
      data: {
        status: TableStatus.GESPERRT,
        lockNote: note?.trim() || null,
        busyFrom: null,
        busyUntil: null,
      },
    });
    revalidateTableViews();
    return { ok: true, data: null };
  } catch (err) {
    console.error("lockTableAction failed", err);
    return { ok: false, error: "Tisch konnte nicht gesperrt werden." };
  }
}
