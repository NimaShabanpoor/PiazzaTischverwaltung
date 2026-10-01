"use client";

import { useEffect, useState } from "react";
import { fetchDayOccupancy } from "@/lib/actions/customer";
import type { TableDayOccupancy } from "@/lib/reservations";
import { CLOSING_TIME, OPENING_TIME } from "@/lib/constants";
import { formatDateDeCH, minutesToTime, timeToMinutes } from "@/lib/time";

const OPEN = timeToMinutes(OPENING_TIME);
const CLOSE = timeToMinutes(CLOSING_TIME);
const SPAN = CLOSE - OPEN;

/** Volle Stunden für die Achsenbeschriftung, alle 2 Stunden. */
const AXIS_LABELS = (() => {
  const labels: number[] = [];
  for (let m = Math.ceil(OPEN / 120) * 120; m <= CLOSE; m += 120) labels.push(m);
  return labels;
})();

/** Prozent-Position einer Uhrzeit auf der Zeitleiste (auf Öffnungszeit begrenzt). */
function pos(time: string): number {
  const m = Math.min(Math.max(timeToMinutes(time), OPEN), CLOSE);
  return ((m - OPEN) / SPAN) * 100;
}

export type DayOccupancyState = {
  /** null = lädt noch (oder kein Datum). */
  tables: TableDayOccupancy[] | null;
  error: string | null;
};

/**
 * Lädt die Tagesbelegung. Wird im Formular einmal geladen und an die
 * Zeitleiste und die Uhrzeit-Auswahl weitergegeben.
 * `refreshKey` hochzählen, um neu zu laden (z.B. nach einer Doppelbuchung).
 */
export function useDayOccupancy(date: string | null, refreshKey = 0): DayOccupancyState {
  // Mit Datum gespeichert, damit beim Datumswechsel nicht kurz die alte Belegung erscheint.
  const [loaded, setLoaded] = useState<{ date: string; tables: TableDayOccupancy[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    fetchDayOccupancy({ date }).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setLoaded({ date, tables: res.data });
        setError(null);
      } else {
        setError(res.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [date, refreshKey]);

  return { tables: loaded && loaded.date === date ? loaded.tables : null, error };
}

/**
 * true, wenn im Zeitraum [from, to) kein Tisch mit genug Plätzen frei ist.
 * Solange die Belegung noch lädt, gilt nichts als ausgebucht.
 */
export function isFullyBooked(
  tables: TableDayOccupancy[] | null,
  partySize: number,
  from: string,
  to: string,
): boolean {
  if (!tables || tables.length === 0) return false;
  const a = timeToMinutes(from);
  const b = timeToMinutes(to);
  return !tables.some(
    (t) =>
      !t.locked &&
      t.seats >= partySize &&
      t.busy.every((x) => timeToMinutes(x.to) <= a || timeToMinutes(x.from) >= b),
  );
}

/**
 * Zeigt Gästen, wann die Tische am gewählten Tag schon belegt sind –
 * nur Zeiten, keine Namen. Die gewählte Von-Bis-Zeit wird hervorgehoben.
 */
export function DayOccupancy({
  date,
  startTime,
  endTime,
  occupancy,
}: {
  date: string;
  startTime: string;
  endTime: string;
  occupancy: DayOccupancyState;
}) {
  const { tables, error } = occupancy;

  if (error) {
    return <p className="text-sm text-status-reserved">{error}</p>;
  }

  if (!tables) {
    return <div className="h-40 animate-pulse rounded-2xl bg-brand-cream" />;
  }

  if (tables.length === 0) return null;

  const hasSelection = !!startTime && !!endTime;
  const anyBusy = tables.some((t) => t.locked || t.busy.length > 0);

  return (
    <div className="rounded-2xl bg-brand-cream/60 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-brand-navy">
          Belegung am {formatDateDeCH(date)}
        </h3>
        <div className="flex flex-wrap gap-3 text-xs text-brand-navy/60">
          <Legend className="bg-status-free-bg ring-1 ring-status-free/30" label="frei" />
          <Legend className="bg-status-reserved" label="reserviert" />
          {hasSelection && (
            <Legend className="ring-2 ring-brand-orange" label="Ihre Zeit" />
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {tables.map((table) => (
          <div key={table.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3">
            <div className="text-xs leading-tight">
              <p className="font-semibold text-brand-navy">Tisch {table.number}</p>
              <p className="text-brand-navy/50">{table.seats} Plätze</p>
            </div>
            <div>
              <div
                className="relative h-7 overflow-hidden rounded-lg bg-status-free-bg ring-1 ring-status-free/30"
                role="img"
                aria-label={describe(table)}
              >
                {table.locked ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-status-locked-bg text-[11px] font-semibold uppercase tracking-wide text-status-locked">
                    Nicht buchbar
                  </div>
                ) : (
                  table.busy.map((b) => (
                    <div
                      key={`${b.from}-${b.to}`}
                      className="absolute inset-y-0 bg-status-reserved"
                      style={{ left: `${pos(b.from)}%`, width: `${pos(b.to) - pos(b.from)}%` }}
                      title={`Reserviert ${b.from}–${b.to} Uhr`}
                    />
                  ))
                )}
                {hasSelection && (
                  <div
                    className="pointer-events-none absolute inset-y-0 rounded-md ring-2 ring-inset ring-brand-orange"
                    style={{
                      left: `${pos(startTime)}%`,
                      width: `${pos(endTime) - pos(startTime)}%`,
                    }}
                  />
                )}
              </div>
              {!table.locked && table.busy.length > 0 && (
                <p className="mt-1 text-[11px] text-status-reserved">
                  Reserviert: {table.busy.map((b) => `${b.from}–${b.to}`).join(", ")} Uhr
                </p>
              )}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
          <span />
          <div className="relative h-4 text-[10px] text-brand-navy/50">
            {AXIS_LABELS.map((m) => (
              <span
                key={m}
                className="absolute -translate-x-1/2"
                style={{ left: `${((m - OPEN) / SPAN) * 100}%` }}
              >
                {minutesToTime(m)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {!anyBusy && (
        <p className="mt-2 text-xs text-brand-navy/60">
          An diesem Tag ist noch nichts reserviert – alle Zeiten sind frei.
        </p>
      )}
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-sm ${className}`} />
      {label}
    </span>
  );
}

function describe(table: TableDayOccupancy): string {
  if (table.locked) return `Tisch ${table.number}: an diesem Tag nicht buchbar`;
  if (table.busy.length === 0) return `Tisch ${table.number}: den ganzen Tag frei`;
  return `Tisch ${table.number}: reserviert ${table.busy
    .map((b) => `${b.from} bis ${b.to}`)
    .join(", ")} Uhr`;
}
