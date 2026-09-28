"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { requireAdminSession } from "../auth";
import { groupRequestSchema } from "../validation";
import { combineDateAndTime, zurichNow } from "../time";
import { queueGroupRequestDeclined, queueGroupRequestReceived } from "../notifications";
import type { ActionResult } from "./customer";

/** Anfragen-Seite und Zähler in der Admin-Navigation neu laden. */
function revalidateAdminViews() {
  revalidatePath("/admin", "layout");
}

export type GroupRequestConfirmation = {
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  customerName: string;
  customerEmail: string;
  /** true, wenn eine Eingangsbestätigung per E-Mail versendet wird. */
  emailQueued: boolean;
};

/** Öffentlich: Gruppe über der Online-Grenze sendet eine Anfrage an den Chef. */
export async function submitGroupRequest(
  input: unknown,
): Promise<ActionResult<GroupRequestConfirmation>> {
  const parsed = groupRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const start = combineDateAndTime(parsed.data.date, parsed.data.startTime);
  const end = combineDateAndTime(parsed.data.date, parsed.data.endTime);
  if (start.getTime() < zurichNow().getTime()) {
    return { ok: false, error: "Anfragen für vergangene Zeiten sind nicht möglich." };
  }

  try {
    const request = await prisma.groupRequest.create({
      data: {
        start,
        end,
        partySize: parsed.data.partySize,
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone,
        customerEmail: parsed.data.customerEmail,
        note: parsed.data.note,
      },
    });
    const emailQueued = queueGroupRequestReceived(request);
    revalidateAdminViews();
    return {
      ok: true,
      data: {
        date: parsed.data.date,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        partySize: request.partySize,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        emailQueued,
      },
    };
  } catch (err) {
    console.error("submitGroupRequest failed", err);
    return {
      ok: false,
      error: "Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
    };
  }
}

/** Chef: Anfrage als angenommen markieren (z.B. nachdem die Reservation erfasst wurde). */
export async function acceptGroupRequestAction(id: string): Promise<ActionResult<null>> {
  await requireAdminSession();
  try {
    await prisma.groupRequest.update({ where: { id }, data: { status: "ANGENOMMEN" } });
    revalidateAdminViews();
    return { ok: true, data: null };
  } catch (err) {
    console.error("acceptGroupRequestAction failed", err);
    return { ok: false, error: "Anfrage konnte nicht aktualisiert werden." };
  }
}

/** Chef: Anfrage ablehnen – der Gast erhält eine E-Mail. */
export async function declineGroupRequestAction(id: string): Promise<ActionResult<null>> {
  await requireAdminSession();
  try {
    const request = await prisma.groupRequest.update({
      where: { id },
      data: { status: "ABGELEHNT" },
    });
    queueGroupRequestDeclined(request);
    revalidateAdminViews();
    return { ok: true, data: null };
  } catch (err) {
    console.error("declineGroupRequestAction failed", err);
    return { ok: false, error: "Anfrage konnte nicht abgelehnt werden." };
  }
}

export async function deleteGroupRequestAction(id: string): Promise<ActionResult<null>> {
  await requireAdminSession();
  try {
    await prisma.groupRequest.delete({ where: { id } });
    revalidateAdminViews();
    return { ok: true, data: null };
  } catch (err) {
    console.error("deleteGroupRequestAction failed", err);
    return { ok: false, error: "Anfrage konnte nicht gelöscht werden." };
  }
}
