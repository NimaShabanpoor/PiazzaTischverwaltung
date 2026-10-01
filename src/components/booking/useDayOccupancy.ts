"use client";

import { useEffect, useState } from "react";
import { fetchDayOccupancy } from "@/lib/actions/customer";
import type { TableDayOccupancy } from "@/lib/reservations";
import { timeToMinutes } from "@/lib/time";

/**
 * Lädt die Tagesbelegung (nur Zeiten, keine Gastdaten), um belegte Uhrzeiten
 * in der Auswahl zu markieren. Liefert null, solange noch geladen wird.
 * `refreshKey` hochzählen, um neu zu laden (z.B. nach einer Doppelbuchung).
 */
export function useDayOccupancy(
  date: string | null,
  refreshKey = 0,
): TableDayOccupancy[] | null {
  // Mit Datum gespeichert, damit beim Datumswechsel nicht kurz die alte Belegung gilt.
  const [loaded, setLoaded] = useState<{ date: string; tables: TableDayOccupancy[] } | null>(null);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    fetchDayOccupancy({ date }).then((res) => {
      // Bei einem Fehler wird einfach nichts markiert – die Tischauswahl prüft ohnehin.
      if (!cancelled && res.ok) setLoaded({ date, tables: res.data });
    });
    return () => {
      cancelled = true;
    };
  }, [date, refreshKey]);

  return loaded && loaded.date === date ? loaded.tables : null;
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
