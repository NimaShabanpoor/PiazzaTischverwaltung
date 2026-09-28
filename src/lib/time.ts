import {
  CLOSING_TIME,
  MIN_RESERVATION_DURATION_MINUTES,
  OPENING_TIME,
  RESTAURANT_TIMEZONE,
  TIME_SLOT_STEP_MINUTES,
} from "./constants";

/**
 * Diese Anwendung speichert Datum/Zeit einer Reservation als "naive"
 * Zeit: Das Datenbankfeld ist TIMESTAMP OHNE Zeitzone, und wir behandeln
 * die Zürcher Wanduhrzeit stets so, als wäre sie UTC. Dadurch entfallen
 * Zeitzonen-/Sommerzeit-Umrechnungen komplett – innerhalb der App wird nie
 * mit "echtem" UTC verglichen, ausser hier in diesen Hilfsfunktionen, die
 * die aktuelle Zürcher Zeit in genau diese Konvention übersetzen.
 */

/** Aktuelle Zeit in Zürich, aber als Date mit UTC-Feldern == Zürcher Wanduhrzeit. */
export function zurichNow(): Date {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: RESTAURANT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const part of fmt.formatToParts(now)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  const hour = parts.hour === "24" ? 0 : Number(parts.hour);
  return new Date(
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      hour,
      Number(parts.minute),
      Number(parts.second),
    ),
  );
}

/** Heutiges Datum in Zürich als "YYYY-MM-DD". */
export function zurichTodayISO(): string {
  return toDateISO(zurichNow());
}

export function toDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toTimeHHmm(date: Date): string {
  return date.toISOString().slice(11, 16);
}

/** Kombiniert "YYYY-MM-DD" + "HH:mm" zu einem Date nach obiger Konvention. */
export function combineDateAndTime(dateISO: string, timeHHmm: string): Date {
  return new Date(`${dateISO}T${timeHHmm}:00.000Z`);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** true, wenn [aStart,aEnd) und [bStart,bEnd) sich zeitlich überschneiden. */
export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function timeToMinutes(timeHHmm: string): number {
  const [h, m] = timeHHmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Alle Zeitpunkte (HH:mm) im 30-Minuten-Raster zwischen Öffnung und Schluss (inkl. Schluss). */
export function generateTimePoints(): string[] {
  const openMinutes = timeToMinutes(OPENING_TIME);
  const closeMinutes = timeToMinutes(CLOSING_TIME);
  const points: string[] = [];
  for (let m = openMinutes; m <= closeMinutes; m += TIME_SLOT_STEP_MINUTES) {
    points.push(minutesToTime(m));
  }
  return points;
}

/** Wählbare "Von"-Zeiten: alles ausser dem letzten Zeitpunkt (Schluss selbst). */
export function generateStartTimeOptions(): string[] {
  return generateTimePoints().slice(0, -1);
}

/** Wählbare "Bis"-Zeiten zu einer gegebenen "Von"-Zeit (mind. Mindestdauer, max. Schluss). */
export function generateEndTimeOptions(startTime: string): string[] {
  const minEnd = timeToMinutes(startTime) + MIN_RESERVATION_DURATION_MINUTES;
  return generateTimePoints().filter((p) => timeToMinutes(p) >= minEnd);
}

/** Formatiert ein Date (nach obiger Konvention) als "dd.MM.yyyy". */
export function formatDateDeCH(dateISO: string): string {
  const [y, m, d] = dateISO.split("-");
  return `${d}.${m}.${y}`;
}

const WEEKDAYS_DE = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];

/** Reine Datums-Arithmetik auf "YYYY-MM-DD", ohne jede Zeitzonen-Abhängigkeit. */
export function addDaysISO(dateISO: string, delta: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return toDateISO(dt);
}

export function formatWeekdayDe(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return WEEKDAYS_DE[dt.getUTCDay()];
}
