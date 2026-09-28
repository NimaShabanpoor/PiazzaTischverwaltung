"use client";

import { useState } from "react";
import clsx from "clsx";
import { TableGraphic } from "@/components/TableGraphic";
import { StatusPill } from "@/components/StatusPill";
import { toTimeHHmm } from "@/lib/time";
import { TableDetailModal } from "./TableDetailModal";
import type { TableDTO, TableOverviewDTO } from "@/lib/adminTypes";

export function TableOverviewGrid({ tables }: { tables: TableOverviewDTO[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = tables.find((t) => t.id === selectedId) ?? null;
  const allTables: TableDTO[] = tables.map(
    ({ id, number, seats, active, status, lockNote, busyFrom, busyUntil }) => ({
      id,
      number,
      seats,
      active,
      status,
      lockNote,
      busyFrom,
      busyUntil,
    }),
  );

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {tables.map((table) => {
          const highlight = table.todaysReservations.find(
            (r) => r.status === "CONFIRMED" || r.status === "ARRIVED",
          );
          return (
            <button
              key={table.id}
              type="button"
              onClick={() => setSelectedId(table.id)}
              className={clsx(
                "flex flex-col items-center gap-3 rounded-3xl border-2 bg-white p-6 text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer",
                !table.active ? "border-brand-cream-dark opacity-60" : "border-brand-cream-dark",
              )}
            >
              <TableGraphic
                number={table.number}
                seats={table.seats}
                status={table.displayStatus}
                size={110}
              />
              <p className="font-display text-xl font-semibold text-brand-navy">
                Tisch {table.number}
              </p>
              <p className="-mt-2 text-sm text-brand-navy/50">{table.seats} Plätze</p>

              {!table.active ? (
                <span className="rounded-full bg-brand-cream-dark px-3 py-1 text-sm font-medium text-brand-navy/60">
                  Deaktiviert
                </span>
              ) : (
                <StatusPill status={table.displayStatus} />
              )}

              {table.displayStatus === "BESETZT" && table.busyFrom && table.busyUntil && (
                <div className="mt-1 w-full rounded-xl bg-brand-cream px-3 py-2 text-center text-sm text-brand-navy">
                  Besetzt {toTimeHHmm(table.busyFrom)} – {toTimeHHmm(table.busyUntil)}
                </div>
              )}

              {highlight && (
                <div className="mt-1 w-full rounded-xl bg-brand-cream px-3 py-2 text-center text-sm text-brand-navy">
                  <span className="font-semibold">
                    {toTimeHHmm(highlight.start)}–{toTimeHHmm(highlight.end)}
                  </span>{" "}
                  – {highlight.customerName} · {highlight.partySize}{" "}
                  {highlight.partySize === 1 ? "Person" : "Pers."}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <TableDetailModal
          open
          onClose={() => setSelectedId(null)}
          table={selected}
          allTables={allTables}
        />
      )}
    </>
  );
}
