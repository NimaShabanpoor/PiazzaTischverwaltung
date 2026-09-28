import { prisma } from "./prisma";
import { addDaysISO, combineDateAndTime, toTimeHHmm, zurichTodayISO } from "./time";

export type StatBucket = { label: string; count: number };

export type StatsData = {
  periodDays: number;
  fromDateISO: string;
  toDateISO: string;
  totalActive: number;
  totalCancelled: number;
  avgPartySize: number;
  cancelledRate: number;
  perWeekday: StatBucket[];
  perHour: StatBucket[];
  perTable: StatBucket[];
  sourceSplit: { online: number; phone: number };
};

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

/**
 * Aggregiert Kennzahlen direkt aus den Reservationsdaten – bewusst ohne
 * eigene Statistik-Tabelle, da die Datenmengen eines 4-Tisch-Restaurants
 * klein genug sind, um bei jedem Aufruf live berechnet zu werden.
 */
export async function getStatsData(periodDays: number): Promise<StatsData> {
  const today = zurichTodayISO();
  const fromDateISO = addDaysISO(today, -(periodDays - 1));
  const rangeStart = combineDateAndTime(fromDateISO, "00:00");
  const rangeEndExclusive = combineDateAndTime(addDaysISO(today, 1), "00:00");

  const reservations = await prisma.reservation.findMany({
    where: { start: { gte: rangeStart, lt: rangeEndExclusive } },
    include: { table: true },
  });

  const active = reservations.filter((r) => r.status !== "CANCELLED");
  const cancelled = reservations.filter((r) => r.status === "CANCELLED");

  const avgPartySize =
    active.length > 0 ? active.reduce((sum, r) => sum + r.partySize, 0) / active.length : 0;

  const weekdayCounts = new Array(7).fill(0) as number[];
  const hourCounts = new Map<string, number>();
  const tableCounts = new Map<number, number>();
  let online = 0;
  let phone = 0;

  for (const r of active) {
    // r.start folgt der App-Konvention: UTC-Getter == Zürcher Wanduhrzeit.
    const isoWeekday = r.start.getUTCDay(); // 0=So,1=Mo,...,6=Sa
    const weekdayIndex = (isoWeekday + 6) % 7; // -> 0=Mo..6=So
    weekdayCounts[weekdayIndex] += 1;

    const hourLabel = `${toTimeHHmm(r.start).slice(0, 2)}:00`;
    hourCounts.set(hourLabel, (hourCounts.get(hourLabel) ?? 0) + 1);

    tableCounts.set(r.table.number, (tableCounts.get(r.table.number) ?? 0) + 1);

    if (r.source === "ONLINE") online += 1;
    else phone += 1;
  }

  const perWeekday = WEEKDAY_LABELS.map((label, i) => ({ label, count: weekdayCounts[i] }));
  const perHour = Array.from(hourCounts.keys())
    .sort()
    .map((label) => ({ label, count: hourCounts.get(label)! }));
  const perTable = [1, 2, 3, 4].map((n) => ({
    label: `Tisch ${n}`,
    count: tableCounts.get(n) ?? 0,
  }));

  return {
    periodDays,
    fromDateISO,
    toDateISO: today,
    totalActive: active.length,
    totalCancelled: cancelled.length,
    avgPartySize,
    cancelledRate: reservations.length > 0 ? cancelled.length / reservations.length : 0,
    perWeekday,
    perHour,
    perTable,
    sourceSplit: { online, phone },
  };
}
