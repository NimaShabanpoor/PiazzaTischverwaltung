"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";
import { fetchAvailability } from "@/lib/actions/customer";
import type { TableAvailability } from "@/lib/reservations";
import { TableGraphic, type DisplayStatus } from "@/components/TableGraphic";

const REASON_LABEL: Record<string, string> = {
  gesperrt: "Gesperrt",
  "besetzt-manuell": "Besetzt",
  "zu-klein": "Zu klein",
  reserviert: "Reserviert",
};

const REASON_STATUS: Record<string, DisplayStatus> = {
  gesperrt: "GESPERRT",
  "besetzt-manuell": "BESETZT",
  reserviert: "RESERVIERT",
  "zu-klein": "GESPERRT",
};

export function TableChoice({
  date,
  startTime,
  endTime,
  partySize,
  value,
  refreshKey = 0,
  onSelect,
}: {
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  value: string | null;
  /** Hochzählen, um die Verfügbarkeit neu zu laden (z.B. nach einer Doppelbuchung). */
  refreshKey?: number;
  onSelect: (tableId: string, tableNumber: number) => void;
}) {
  const [tables, setTables] = useState<TableAvailability[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAvailability({ date, startTime, endTime, partySize }).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setTables(res.data);
        setError(null);
      } else {
        setError(res.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [date, startTime, endTime, partySize, refreshKey]);

  if (error) {
    return (
      <p className="rounded-2xl bg-status-reserved-bg p-4 text-sm text-status-reserved">
        {error}
      </p>
    );
  }

  if (!tables) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-brand-cream" />
        ))}
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <p className="rounded-2xl bg-status-locked-bg p-4 text-sm text-brand-navy/70">
        Für diese Auswahl ist kein Tisch verfügbar.
      </p>
    );
  }

  const freeCount = tables.filter((t) => t.available).length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {tables.map((table) => {
          const selected = value === table.id;
          return (
            <button
              key={table.id}
              type="button"
              disabled={!table.available}
              onClick={() => onSelect(table.id, table.number)}
              aria-pressed={selected}
              className={clsx(
                "relative flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition-all",
                table.available
                  ? "cursor-pointer bg-white hover:-translate-y-0.5 hover:border-brand-teal hover:shadow-md"
                  : "cursor-not-allowed bg-brand-cream/70 opacity-70",
                selected
                  ? "border-brand-orange bg-brand-orange/5 shadow-sm"
                  : "border-brand-cream-dark",
              )}
            >
              {selected && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange text-white">
                  <Check size={13} strokeWidth={3} />
                </span>
              )}
              <TableGraphic
                number={table.number}
                seats={table.seats}
                status={table.available ? "FREI" : REASON_STATUS[table.reason ?? "gesperrt"]}
                size={64}
              />
              <span className="font-display text-sm font-semibold text-brand-navy">
                Tisch {table.number}
              </span>
              <span className="text-xs text-brand-navy/50">{table.seats} Plätze</span>
              {!table.available && table.reason && (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-status-reserved">
                  {REASON_LABEL[table.reason]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-brand-navy/50">
        {freeCount === 0
          ? "Zu dieser Zeit ist kein Tisch frei – bitte eine andere Uhrzeit wählen."
          : `${freeCount} von ${tables.length} Tischen frei`}
      </p>
    </div>
  );
}
