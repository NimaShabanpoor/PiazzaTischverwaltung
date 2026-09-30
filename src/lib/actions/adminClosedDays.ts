"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { requireAdminSession } from "../auth";
import { closedDaySchema } from "../validation";
import type { ActionResult } from "./customer";

function revalidateViews() {
  revalidatePath("/admin", "layout");
  revalidatePath("/reservieren");
}

/** Tag schliessen (Ferien, Feiertag): an diesem Tag sind keine Online-Buchungen mehr möglich. */
export async function closeDayAction(input: unknown): Promise<ActionResult<null>> {
  await requireAdminSession();

  const parsed = closedDaySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const reason = parsed.data.reason?.trim() || null;

  try {
    await prisma.closedDay.upsert({
      where: { date: parsed.data.date },
      update: { reason },
      create: { date: parsed.data.date, reason },
    });
    revalidateViews();
    return { ok: true, data: null };
  } catch (err) {
    console.error("closeDayAction failed", err);
    return { ok: false, error: "Tag konnte nicht geschlossen werden." };
  }
}

/** Tag wieder öffnen. */
export async function openDayAction(dateISO: string): Promise<ActionResult<null>> {
  await requireAdminSession();
  try {
    await prisma.closedDay.deleteMany({ where: { date: dateISO } });
    revalidateViews();
    return { ok: true, data: null };
  } catch (err) {
    console.error("openDayAction failed", err);
    return { ok: false, error: "Tag konnte nicht wieder geöffnet werden." };
  }
}
