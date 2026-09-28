"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil, Trash2, UserCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusPill } from "@/components/StatusPill";
import { Input } from "@/components/ui/Field";
import { addDaysISO, formatDateDeCH, formatWeekdayDe, toTimeHHmm, zurichTodayISO } from "@/lib/time";
import {
  cancelReservationAction,
  deleteReservationAction,
  markArrivedAction,
} from "@/lib/actions/adminReservations";
import { ReservationFormModal } from "./ReservationFormModal";
import type { ReservationDTO, ReservationWithTableDTO, TableDTO } from "@/lib/adminTypes";

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Bestätigt",
  ARRIVED: "Angekommen",
  CANCELLED: "Storniert",
  COMPLETED: "Abgeschlossen",
};

function toDisplayStatus(r: ReservationWithTableDTO): "FREI" | "RESERVIERT" | "BESETZT" | "GESPERRT" {
  if (r.status === "CANCELLED") return "GESPERRT";
  if (r.status === "ARRIVED") return "BESETZT";
  return "RESERVIERT";
}

export function DayOverview({
  dateISO,
  reservations,
  tables,
}: {
  dateISO: string;
  reservations: ReservationWithTableDTO[];
  tables: TableDTO[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReservationDTO | undefined>(undefined);
  // Erzwingt einen frischen Formular-Mount bei jedem Öffnen (statt Reset per Effect).
  const [formToken, setFormToken] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<ReservationWithTableDTO | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function goTo(date: string) {
    router.push(`/admin/reservierungen?date=${date}`);
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>, onDone?: () => void) {
    setActionError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok && res.error) setActionError(res.error);
      else onDone?.();
    });
  }

  const isToday = dateISO === zurichTodayISO();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-navy sm:text-3xl">
            Tagesübersicht
          </h1>
          <p className="text-brand-navy/60">
            {formatWeekdayDe(dateISO)}, {formatDateDeCH(dateISO)}
            {isToday && " · Heute"}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setFormToken((t) => t + 1);
            setFormOpen(true);
          }}
        >
          + Neue Reservation
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-label="Vorheriger Tag"
          onClick={() => goTo(addDaysISO(dateISO, -1))}
          className="rounded-xl border-2 border-brand-cream-dark bg-white p-2.5 hover:bg-brand-cream cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <Input
          type="date"
          value={dateISO}
          onChange={(e) => e.target.value && goTo(e.target.value)}
          className="w-auto"
        />
        <button
          type="button"
          aria-label="Nächster Tag"
          onClick={() => goTo(addDaysISO(dateISO, 1))}
          className="rounded-xl border-2 border-brand-cream-dark bg-white p-2.5 hover:bg-brand-cream cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>
        {!isToday && (
          <Button variant="ghost" onClick={() => goTo(zurichTodayISO())}>
            Heute
          </Button>
        )}
      </div>

      {actionError && (
        <p className="mb-4 rounded-xl bg-status-reserved-bg p-3 text-sm font-medium text-status-reserved">
          {actionError}
        </p>
      )}

      {reservations.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-brand-navy/60">
          Für diesen Tag liegen keine Reservationen vor.
        </p>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-20 text-center">
                  <p className="font-display text-lg font-semibold text-brand-navy">
                    {toTimeHHmm(r.start)}
                  </p>
                  <p className="text-xs text-brand-navy/50">– {toTimeHHmm(r.end)}</p>
                </div>
                <div>
                  <p className="font-medium text-brand-navy">
                    Tisch {r.table.number} · {r.customerName}
                  </p>
                  <p className="text-sm text-brand-navy/60">
                    {r.partySize} {r.partySize === 1 ? "Person" : "Personen"} · {r.customerPhone}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={toDisplayStatus(r)} />
                <span className="text-xs text-brand-navy/40">
                  {STATUS_LABEL[r.status]} · {r.source === "PHONE" ? "Telefonisch" : "Online"}
                </span>
                <div className="ml-2 flex gap-1.5">
                  {r.status === "CONFIRMED" && (
                    <IconButton
                      label="Angekommen"
                      onClick={() => run(() => markArrivedAction(r.id))}
                      disabled={isPending}
                    >
                      <UserCheck size={16} />
                    </IconButton>
                  )}
                  <IconButton
                    label="Bearbeiten"
                    onClick={() => {
                      setEditing(r);
                      setFormToken((t) => t + 1);
                      setFormOpen(true);
                    }}
                    disabled={isPending}
                  >
                    <Pencil size={16} />
                  </IconButton>
                  {r.status !== "CANCELLED" && (
                    <IconButton
                      label="Stornieren"
                      onClick={() => run(() => cancelReservationAction(r.id))}
                      disabled={isPending}
                    >
                      <XCircle size={16} />
                    </IconButton>
                  )}
                  <IconButton
                    label="Löschen"
                    danger
                    onClick={() => setDeleteTarget(r)}
                    disabled={isPending}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReservationFormModal
        key={formToken}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        tables={tables}
        editing={editing}
        defaultDate={dateISO}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Reservation löschen"
        description={`Die Reservation von ${deleteTarget?.customerName ?? ""} wird endgültig gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmLabel="Endgültig löschen"
        danger
        isPending={isPending}
        onConfirm={() => {
          if (deleteTarget) {
            run(() => deleteReservationAction(deleteTarget.id), () => setDeleteTarget(null));
          }
        }}
      />
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border-2 p-2 transition-colors cursor-pointer disabled:opacity-50 ${
        danger
          ? "border-status-reserved-bg text-status-reserved hover:bg-status-reserved-bg"
          : "border-brand-cream-dark text-brand-navy hover:bg-brand-cream"
      }`}
    >
      {children}
    </button>
  );
}
