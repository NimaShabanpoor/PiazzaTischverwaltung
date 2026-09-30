"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CalendarOff, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Label } from "@/components/ui/Field";
import { closeDayAction, openDayAction } from "@/lib/actions/adminClosedDays";
import { formatDateDeCH, formatWeekdayDe } from "@/lib/time";
import type { ClosedDayInfo } from "@/lib/closedDays";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

/** Monatsarithmetik rein auf "YYYY-MM", ohne Zeitzonen-Abhängigkeit. */
function shiftMonth(monthISO: string, delta: number): string {
  const [year, month] = monthISO.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(monthISO: string): string {
  const [year, month] = monthISO.split("-").map(Number);
  return `${MONTHS[month - 1]} ${year}`;
}

export function ClosedDayCalendar({
  monthISO,
  closedDays,
  reservationCounts,
  todayISO,
}: {
  monthISO: string;
  closedDays: ClosedDayInfo[];
  reservationCounts: Record<string, number>;
  todayISO: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [closeTarget, setCloseTarget] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [openTarget, setOpenTarget] = useState<ClosedDayInfo | null>(null);

  const closedByDate = new Map(closedDays.map((d) => [d.date, d]));

  const [year, month] = monthISO.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingBlanks = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return `${monthISO}-${String(day).padStart(2, "0")}`;
  });

  function run(action: () => Promise<{ ok: boolean; error?: string }>, onDone?: () => void) {
    setActionError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok && res.error) setActionError(res.error);
      else onDone?.();
    });
  }

  function goToMonth(next: string) {
    router.push(`/admin/schliesstage?month=${next}`);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-navy sm:text-3xl">
            Schliesstage
          </h1>
          <p className="text-brand-navy/60">
            Tage für Ferien oder Feiertage schliessen – dann sind online keine Reservationen
            und Anfragen mehr möglich.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Vorheriger Monat"
            onClick={() => goToMonth(shiftMonth(monthISO, -1))}
            className="rounded-xl border-2 border-brand-cream-dark bg-white p-2.5 hover:bg-brand-cream cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="min-w-40 text-center font-display text-lg font-semibold text-brand-navy">
            {monthLabel(monthISO)}
          </span>
          <button
            type="button"
            aria-label="Nächster Monat"
            onClick={() => goToMonth(shiftMonth(monthISO, 1))}
            className="rounded-xl border-2 border-brand-cream-dark bg-white p-2.5 hover:bg-brand-cream cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {actionError && (
        <p className="mb-4 rounded-xl bg-status-reserved-bg p-3 text-sm font-medium text-status-reserved">
          {actionError}
        </p>
      )}

      <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-brand-navy/40">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: leadingBlanks }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}

          {days.map((dateISO) => {
            const closed = closedByDate.get(dateISO);
            const count = reservationCounts[dateISO] ?? 0;
            const isPast = dateISO < todayISO;
            const isToday = dateISO === todayISO;

            return (
              <button
                key={dateISO}
                type="button"
                disabled={isPending || isPast}
                onClick={() => {
                  if (closed) {
                    setOpenTarget(closed);
                  } else {
                    setReason("");
                    setCloseTarget(dateISO);
                  }
                }}
                className={clsx(
                  "flex min-h-20 flex-col items-start gap-1 rounded-2xl border-2 p-2 text-left transition-colors",
                  isPast
                    ? "cursor-not-allowed border-brand-cream-dark/60 bg-brand-cream/50 text-brand-navy/30"
                    : "cursor-pointer",
                  !isPast && closed
                    ? "border-status-reserved bg-status-reserved-bg text-status-reserved hover:brightness-95"
                    : !isPast && "border-brand-cream-dark bg-white text-brand-navy hover:border-brand-teal",
                  isToday && "ring-2 ring-brand-teal ring-offset-1",
                )}
              >
                <span className="font-display text-base font-semibold">
                  {Number(dateISO.slice(-2))}
                </span>
                {closed ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide">
                    <CalendarOff size={12} />
                    Zu
                  </span>
                ) : (
                  count > 0 && (
                    <span className="text-[11px] text-brand-navy/50">
                      {count} Res.
                    </span>
                  )
                )}
                {closed?.reason && (
                  <span className="line-clamp-2 text-[11px] leading-tight opacity-80">
                    {closed.reason}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-brand-navy/50">
          Tippen Sie auf einen Tag, um ihn zu schliessen oder wieder zu öffnen. Vergangene Tage
          sind nicht änderbar.
        </p>
      </div>

      {/* Tag schliessen */}
      <Modal
        open={!!closeTarget}
        onClose={() => setCloseTarget(null)}
        title="Tag schliessen"
      >
        {closeTarget && (
          <>
            <p className="text-brand-navy/70">
              {formatWeekdayDe(closeTarget)}, {formatDateDeCH(closeTarget)} wird für
              Online-Reservationen und Anfragen gesperrt.
            </p>
            {(reservationCounts[closeTarget] ?? 0) > 0 && (
              <p className="mt-3 rounded-xl bg-status-occupied-bg p-3 text-sm text-brand-navy">
                Achtung: An diesem Tag gibt es bereits{" "}
                <strong>{reservationCounts[closeTarget]} Reservation(en)</strong>. Diese bleiben
                bestehen – bitte informieren Sie die Gäste.
              </p>
            )}
            <div className="mt-4">
              <Label htmlFor="closed-reason">Grund (optional)</Label>
              <Input
                id="closed-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="z.B. Betriebsferien, Feiertag"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setCloseTarget(null)} disabled={isPending}>
                Abbrechen
              </Button>
              <Button
                onClick={() =>
                  run(
                    () => closeDayAction({ date: closeTarget, reason }),
                    () => setCloseTarget(null),
                  )
                }
                disabled={isPending}
              >
                {isPending ? "Bitte warten…" : "Tag schliessen"}
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Tag wieder öffnen */}
      <ConfirmDialog
        open={!!openTarget}
        onClose={() => setOpenTarget(null)}
        title="Tag wieder öffnen"
        description={
          openTarget
            ? `${formatWeekdayDe(openTarget.date)}, ${formatDateDeCH(openTarget.date)} wird wieder für Reservationen freigegeben.`
            : ""
        }
        confirmLabel="Wieder öffnen"
        isPending={isPending}
        onConfirm={() => {
          if (openTarget) {
            run(() => openDayAction(openTarget.date), () => setOpenTarget(null));
          }
        }}
      />
    </div>
  );
}
