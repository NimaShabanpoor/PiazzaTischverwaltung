"use client";

import { CalendarOff } from "lucide-react";
import { Input, Label } from "@/components/ui/Field";
import {
  generateEndTimeOptions,
  generateStartTimeOptions,
  minutesToTime,
  timeToMinutes,
} from "@/lib/time";
import { MIN_RESERVATION_DURATION_MINUTES } from "@/lib/constants";
import type { ClosedDayInfo } from "@/lib/closedDays";

/** Ausgebuchte Zeiten (alle Tische belegt): rot und nicht wählbar. */
const BOOKED_OPTION_STYLE = { color: "var(--color-status-reserved)" };

const SELECT_CLASS =
  "w-full rounded-xl border-2 border-brand-cream-dark bg-white px-4 py-3 text-base text-brand-navy outline-none transition-colors focus:border-brand-teal disabled:bg-brand-cream disabled:text-brand-navy/40";

export type WhenPatch = { date?: string; startTime?: string; endTime?: string };

export function WhenFields({
  date,
  startTime,
  endTime,
  todayISO,
  maxDateISO,
  nowIso,
  closedDay,
  isBooked,
  onChange,
}: {
  date: string;
  startTime: string;
  endTime: string;
  todayISO: string;
  maxDateISO: string;
  nowIso: string;
  /** Gesetzt, wenn das gewählte Datum ein Schliesstag ist. */
  closedDay: ClosedDayInfo | null;
  /** true, wenn im Zeitraum [from, to) kein passender Tisch mehr frei ist. */
  isBooked?: (from: string, to: string) => boolean;
  onChange: (patch: WhenPatch) => void;
}) {
  const isToday = date === nowIso.slice(0, 10);
  const nowTime = nowIso.slice(11, 16);
  const startOptions = generateStartTimeOptions().filter((t) => !isToday || t > nowTime);
  const endOptions = startTime ? generateEndTimeOptions(startTime) : [];
  const isClosed = !!closedDay;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <Label htmlFor="res-date">Datum</Label>
        <Input
          id="res-date"
          type="date"
          min={todayISO}
          max={maxDateISO}
          value={date}
          invalid={isClosed}
          onChange={(e) => onChange({ date: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="res-start">Von</Label>
        <select
          id="res-start"
          className={SELECT_CLASS}
          value={startTime}
          disabled={!date || isClosed}
          onChange={(e) => onChange({ startTime: e.target.value })}
        >
          <option value="">Bitte wählen…</option>
          {startOptions.map((t) => {
            // Massgebend ist die Mindestdauer ab dieser Von-Zeit.
            const minEnd = minutesToTime(timeToMinutes(t) + MIN_RESERVATION_DURATION_MINUTES);
            return <TimeOption key={t} time={t} booked={!!isBooked?.(t, minEnd)} />;
          })}
        </select>
      </div>
      <div>
        <Label htmlFor="res-end">Bis</Label>
        <select
          id="res-end"
          className={SELECT_CLASS}
          value={endTime}
          disabled={!startTime || isClosed}
          onChange={(e) => onChange({ endTime: e.target.value })}
        >
          <option value="">Bitte wählen…</option>
          {endOptions.map((t) => (
            <TimeOption key={t} time={t} booked={!!isBooked?.(startTime, t)} />
          ))}
        </select>
      </div>

      {isClosed && (
        <p className="flex items-start gap-2 rounded-xl bg-status-reserved-bg p-3 text-sm text-status-reserved sm:col-span-3">
          <CalendarOff size={18} className="mt-0.5 shrink-0" />
          <span>
            An diesem Tag haben wir geschlossen
            {closedDay?.reason ? ` (${closedDay.reason})` : ""}. Bitte wählen Sie ein anderes
            Datum.
          </span>
        </p>
      )}

      {!isClosed && isToday && startOptions.length === 0 && (
        <p className="rounded-xl bg-status-locked-bg p-3 text-sm text-brand-navy/70 sm:col-span-3">
          Für heute sind keine Uhrzeiten mehr verfügbar. Bitte wählen Sie ein anderes Datum.
        </p>
      )}
    </div>
  );
}

function TimeOption({ time, booked }: { time: string; booked: boolean }) {
  return (
    <option value={time} disabled={booked} style={booked ? BOOKED_OPTION_STYLE : undefined}>
      {booked ? `${time} – ausgebucht` : time}
    </option>
  );
}
