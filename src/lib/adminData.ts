import { prisma } from "./prisma";
import { computeDisplayStatus, ACTIVE_RESERVATION_STATUSES } from "./reservations";
import { addMinutes, combineDateAndTime, zurichTodayISO } from "./time";
import type { DisplayStatus } from "@/components/TableGraphic";

export type TableWithToday = Awaited<ReturnType<typeof getDashboardData>>[number];

/** Für die Tischübersicht im Admin-Bereich: alle Tische + heutige Reservationen. */
export async function getDashboardData() {
  const today = zurichTodayISO();
  const dayStart = combineDateAndTime(today, "00:00");
  const dayEnd = addMinutes(dayStart, 24 * 60);

  const tables = await prisma.table.findMany({
    orderBy: { number: "asc" },
    include: {
      reservations: {
        where: {
          start: { lt: dayEnd },
          end: { gt: dayStart },
          status: { not: "CANCELLED" },
        },
        orderBy: { start: "asc" },
      },
    },
  });

  return tables.map((table) => {
    const displayStatus = computeDisplayStatus(
      table,
      table.reservations.filter((r) => ACTIVE_RESERVATION_STATUSES.includes(r.status)),
    ) as DisplayStatus;

    return {
      ...table,
      displayStatus,
      todaysReservations: table.reservations,
    };
  });
}

/** Für die Tagesübersicht: alle Reservationen eines Tages, chronologisch. */
export async function getDayReservations(dateISO: string) {
  const dayStart = combineDateAndTime(dateISO, "00:00");
  const dayEnd = addMinutes(dayStart, 24 * 60);

  return prisma.reservation.findMany({
    where: {
      start: { lt: dayEnd },
      end: { gt: dayStart },
    },
    include: { table: true },
    orderBy: { start: "asc" },
  });
}

export async function getAllTablesSorted() {
  return prisma.table.findMany({ orderBy: { number: "asc" } });
}

/** Alle Gruppenanfragen, nach gewünschtem Termin sortiert. */
export async function getGroupRequests() {
  return prisma.groupRequest.findMany({ orderBy: { start: "asc" } });
}

/** Für den Zähler in der Admin-Navigation. */
export async function countOpenGroupRequests() {
  return prisma.groupRequest.count({ where: { status: "OFFEN" } });
}
