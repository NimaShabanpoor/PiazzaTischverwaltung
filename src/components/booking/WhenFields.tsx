"use client";

import { Input, Label } from "@/components/ui/Field";
import { generateEndTimeOptions, generateStartTimeOptions } from "@/lib/time";

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
  onChange,
}: {
  date: string;
  startTime: string;
  endTime: string;
  todayISO: string;
  maxDateISO: string;
  nowIso: string;
  onChange: (patch: WhenPatch) => void;
}) {
  const isToday = date === nowIso.slice(0, 10);
  const nowTime = nowIso.slice(11, 16);
  const startOptions = generateStartTimeOptions().filter((t) => !isToday || t > nowTime);
  const endOptions = startTime ? generateEndTimeOptions(startTime) : [];

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
          onChange={(e) => onChange({ date: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="res-start">Von</Label>
        <select
          id="res-start"
          className={SELECT_CLASS}
          value={startTime}
          disabled={!date}
          onChange={(e) => onChange({ startTime: e.target.value })}
        >
          <option value="">Bitte wählen…</option>
          {startOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="res-end">Bis</Label>
        <select
          id="res-end"
          className={SELECT_CLASS}
          value={endTime}
          disabled={!startTime}
          onChange={(e) => onChange({ endTime: e.target.value })}
        >
          <option value="">Bitte wählen…</option>
          {endOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {isToday && startOptions.length === 0 && (
        <p className="rounded-xl bg-status-locked-bg p-3 text-sm text-brand-navy/70 sm:col-span-3">
          Für heute sind keine Uhrzeiten mehr verfügbar. Bitte wählen Sie ein anderes Datum.
        </p>
      )}
    </div>
  );
}
