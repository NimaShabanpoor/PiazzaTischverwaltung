import { prisma } from "./prisma";

export type ClosedDayInfo = { date: string; reason: string | null };

/** Alle Schliesstage in einem Zeitraum (jeweils "YYYY-MM-DD", inklusive Grenzen). */
export async function getClosedDaysBetween(
  fromISO: string,
  toISO: string,
): Promise<ClosedDayInfo[]> {
  const days = await prisma.closedDay.findMany({
    where: { date: { gte: fromISO, lte: toISO } },
    orderBy: { date: "asc" },
    select: { date: true, reason: true },
  });
  return days;
}

/** Gibt den Schliesstag zurück, falls der Tag geschlossen ist – sonst null. */
export async function getClosedDay(dateISO: string): Promise<ClosedDayInfo | null> {
  return prisma.closedDay.findUnique({
    where: { date: dateISO },
    select: { date: true, reason: true },
  });
}

export async function isDayClosed(dateISO: string): Promise<boolean> {
  return (await getClosedDay(dateISO)) !== null;
}
