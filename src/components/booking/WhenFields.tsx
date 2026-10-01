"use client";

import clsx from "clsx";
import { CalendarOff } from "lucide-react";
import { Input, Label } from "@/components/ui/Field";
import { generateEndTimeOptions, generateStartTimeOptions } from "@/lib/time";
import type { ClosedDayInfo } from "@/lib/closedDays";
import type { SlotAvailability } from "@/lib/reservations";

export type WhenPatch = { date?: string; startTime?: string; endTime?: string };

function TimeButton({
  time,
  selected,
  taken,
  onSelect,
}: {
  time: string;
  selected: boolean;
  taken: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={taken}
      onClick={onSelect}
      title={taken ? "Zu dieser Zeit ist kein Tisch mehr frei" : undefined}
      className={clsx(
        "rounded-xl border-2 py-2.5 text-center text-sm transition-colors",
        taken
          ? "cursor-not-allowed border-status-reserved bg-status-reserved-bg font-bold text-status-reserved"
          : selected
            ? "cursor-pointer border-brand-orange bg-brand-orange font-medium text-white"
            : "cursor-pointer border-brand-cream-dark bg-white font-medium text-brand-navy hover:border-brand-teal",
      )}
    >
      {time}
      {taken && <span className="block text-[10px] font-semibold uppercase">belegt</span>}
    </button>
  );
}

export function WhenFields({
  date,
  startTime,
  endTime,
  todayISO,
  maxDateISO,
  nowIso,
  closedDay,
  slots,
  showAvailability,
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
  /** Belegung je Uhrzeit; null = noch nicht geladen. */
  slots: SlotAvailability[] | null;
  /** Bei Gruppenanfragen wird keine Belegung angezeigt (kein fester Tisch). */
  showAvailability: boolean;
  onChange: (patch: WhenPatch) => void;
}) {
  const isToday = date === nowIso.slice(0, 10);
  const nowTime = nowIso.slice(11, 16);
  const startOptions = generateStartTimeOptions().filter((t) => !isToday || t > nowTime);
  const selectedSlot = slots?.find((s) => s.start === startTime) ?? null;
  const endOptions = startTime ? generateEndTimeOptions(startTime) : [];

  function isStartTaken(time: string) {
    if (!showAvailability || !slots) return false;
    const slot = slots.find((s) => s.start === time);
    return slot ? !slot.free : false;
  }

  function isEndTaken(time: string) {
    if (!showAvailability || !selectedSlot) return false;
    const end = selectedSlot.ends.find((e) => e.time === time);
    return end ? end.freeTables === 0 : false;
  }

  return (
    <div className="space-y-5">
      <div className="sm:max-w-60">
        <Label htmlFor="res-date">Datum</Label>
        <Input
          id="res-date"
          type="date"
          min={todayISO}
          max={maxDateISO}
          value={date}
          invalid={!!closedDay}
          onChange={(e) => onChange({ date: e.target.value })}
        />
      </div>

      {closedDay ? (
        <p className="flex items-start gap-2 rounded-xl bg-status-reserved-bg p-3 text-sm text-status-reserved">
          <CalendarOff size={18} className="mt-0.5 shrink-0" />
          <span>
            An diesem Tag haben wir geschlossen
            {closedDay.reason ? ` (${closedDay.reason})` : ""}. Bitte wählen Sie ein anderes
            Datum.
          </span>
        </p>
      ) : startOptions.length === 0 ? (
        <p className="rounded-xl bg-status-locked-bg p-3 text-sm text-brand-navy/70">
          Für heute sind keine Uhrzeiten mehr verfügbar. Bitte wählen Sie ein anderes Datum.
        </p>
      ) : (
        <>
          <div>
            <p className="mb-2 text-sm font-semibold text-brand-navy/80">Von</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {startOptions.map((time) => (
                <TimeButton
                  key={time}
                  time={time}
                  selected={time === startTime}
                  taken={isStartTaken(time)}
                  onSelect={() => onChange({ startTime: time })}
                />
              ))}
            </div>
          </div>

          {startTime && (
            <div>
              <p className="mb-2 text-sm font-semibold text-brand-navy/80">Bis</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {endOptions.map((time) => (
                  <TimeButton
                    key={time}
                    time={time}
                    selected={time === endTime}
                    taken={isEndTaken(time)}
                    onSelect={() => onChange({ endTime: time })}
                  />
                ))}
              </div>
            </div>
          )}

          {showAvailability && slots && (
            <p className="flex items-center gap-2 text-xs text-brand-navy/50">
              <span className="h-2.5 w-2.5 rounded-sm bg-status-reserved-bg ring-1 ring-status-reserved" />
              Rot = zu dieser Zeit ist kein Tisch mehr frei
            </p>
          )}
        </>
      )}
    </div>
  );
}
