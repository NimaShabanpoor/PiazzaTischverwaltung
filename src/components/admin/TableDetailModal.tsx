"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Lock, Pencil, Trash2, Unlock, UserCheck, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusPill } from "@/components/StatusPill";
import { toTimeHHmm } from "@/lib/time";
import {
  cancelReservationAction,
  deleteReservationAction,
  markArrivedAction,
} from "@/lib/actions/adminReservations";
import {
  lockTableAction,
  markTableOccupiedAction,
  releaseTableAction,
} from "@/lib/actions/adminTables";
import { ReservationFormModal } from "./ReservationFormModal";
import { LockTableDialog } from "./LockTableDialog";
import { MarkOccupiedDialog } from "./MarkOccupiedDialog";
import type { ReservationDTO, TableDTO, TableOverviewDTO } from "@/lib/adminTypes";

export function TableDetailModal({
  open,
  onClose,
  table,
  allTables,
}: {
  open: boolean;
  onClose: () => void;
  table: TableOverviewDTO;
  allTables: TableDTO[];
}) {
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReservationDTO | undefined>(undefined);
  // Erzwingt einen frischen Formular-Mount bei jedem Öffnen (statt Reset per Effect).
  const [formToken, setFormToken] = useState(0);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [occupyDialogOpen, setOccupyDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReservationDTO | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const anySubDialogOpen = formOpen || lockDialogOpen || occupyDialogOpen || !!deleteTarget;

  function openCreate() {
    setEditing(undefined);
    setFormToken((t) => t + 1);
    setFormOpen(true);
  }
  function openEdit(r: ReservationDTO) {
    setEditing(r);
    setFormToken((t) => t + 1);
    setFormOpen(true);
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>, onDone?: () => void) {
    setActionError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok && res.error) setActionError(res.error);
      else onDone?.();
    });
  }

  const activeReservations = table.todaysReservations.filter(
    (r) => r.status !== "CANCELLED",
  );

  return (
    <>
      <Modal open={open && !anySubDialogOpen} onClose={onClose} title={`Tisch ${table.number}`} wide>
        {actionError && (
          <p className="mb-4 rounded-xl bg-status-reserved-bg p-3 text-sm font-medium text-status-reserved">
            {actionError}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-cream p-4">
          <div>
            <p className="text-sm text-brand-navy/60">
              {table.seats} Plätze {!table.active && "· deaktiviert"}
            </p>
            <div className="mt-1">
              <StatusPill status={table.displayStatus} />
            </div>
            {table.displayStatus === "GESPERRT" && table.lockNote && (
              <p className="mt-1 text-sm italic text-brand-navy/60">„{table.lockNote}“</p>
            )}
            {table.displayStatus === "BESETZT" && table.busyFrom && table.busyUntil && (
              <p className="mt-1 text-sm text-brand-navy/60">
                Besetzt {toTimeHHmm(table.busyFrom)} – {toTimeHHmm(table.busyUntil)} Uhr
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {table.displayStatus !== "BESETZT" && (
              <Button
                size="md"
                variant="secondary"
                disabled={isPending}
                onClick={() => setOccupyDialogOpen(true)}
              >
                Als besetzt markieren
              </Button>
            )}
            {table.displayStatus !== "FREI" && (
              <Button
                size="md"
                variant="outline"
                disabled={isPending}
                onClick={() => run(() => releaseTableAction(table.id))}
              >
                <Unlock size={16} />
                Freigeben
              </Button>
            )}
            {table.displayStatus !== "GESPERRT" ? (
              <Button
                size="md"
                variant="ghost"
                disabled={isPending}
                onClick={() => setLockDialogOpen(true)}
              >
                <Lock size={16} />
                Sperren
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-brand-navy">
            Reservationen heute
          </h3>
          <Button size="md" onClick={openCreate}>
            + Reservation
          </Button>
        </div>

        <div className="mt-3 space-y-3">
          {activeReservations.length === 0 && (
            <p className="rounded-xl bg-brand-cream p-4 text-brand-navy/60">
              Für heute liegt keine Reservation für diesen Tisch vor.
            </p>
          )}
          {activeReservations.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-brand-cream-dark p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold text-brand-navy">
                    {toTimeHHmm(r.start)}–{toTimeHHmm(r.end)} Uhr · {r.customerName}
                  </p>
                  <p className="text-sm text-brand-navy/60">
                    {r.partySize} {r.partySize === 1 ? "Person" : "Personen"} ·{" "}
                    {r.customerPhone} · {r.customerEmail}
                  </p>
                  {r.note && (
                    <p className="mt-1 text-sm italic text-brand-navy/60">„{r.note}“</p>
                  )}
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-navy/40">
                    {r.status === "CONFIRMED" && "Bestätigt"}
                    {r.status === "ARRIVED" && "Angekommen"}
                    {r.status === "COMPLETED" && "Abgeschlossen"}
                    {r.source === "PHONE" ? " · Telefonisch" : " · Online"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.status === "CONFIRMED" && (
                    <IconButton
                      label="Angekommen"
                      onClick={() => run(() => markArrivedAction(r.id))}
                      disabled={isPending}
                    >
                      <UserCheck size={16} />
                    </IconButton>
                  )}
                  <IconButton label="Bearbeiten" onClick={() => openEdit(r)} disabled={isPending}>
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton
                    label="Stornieren"
                    onClick={() => run(() => cancelReservationAction(r.id))}
                    disabled={isPending}
                  >
                    <XCircle size={16} />
                  </IconButton>
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
          {table.todaysReservations.some((r) => r.status === "CANCELLED") && (
            <details className="text-sm text-brand-navy/50">
              <summary className="cursor-pointer select-none">Stornierte anzeigen</summary>
              <ul className="mt-2 space-y-1">
                {table.todaysReservations
                  .filter((r) => r.status === "CANCELLED")
                  .map((r) => (
                    <li key={r.id} className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="opacity-0" />
                      {toTimeHHmm(r.start)}–{toTimeHHmm(r.end)} Uhr · {r.customerName} (storniert)
                    </li>
                  ))}
              </ul>
            </details>
          )}
        </div>
      </Modal>

      <ReservationFormModal
        key={formToken}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        tables={allTables}
        editing={editing}
        defaultTableId={table.id}
      />

      <LockTableDialog
        open={lockDialogOpen}
        onClose={() => setLockDialogOpen(false)}
        isPending={isPending}
        onConfirm={(note) =>
          run(() => lockTableAction(table.id, note), () => setLockDialogOpen(false))
        }
      />

      <MarkOccupiedDialog
        open={occupyDialogOpen}
        onClose={() => setOccupyDialogOpen(false)}
        isPending={isPending}
        onConfirm={(from, until) =>
          run(
            () => markTableOccupiedAction(table.id, { from, until }),
            () => setOccupyDialogOpen(false),
          )
        }
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
    </>
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
      className={`rounded-xl border-2 p-2.5 transition-colors cursor-pointer disabled:opacity-50 ${
        danger
          ? "border-status-reserved-bg text-status-reserved hover:bg-status-reserved-bg"
          : "border-brand-cream-dark text-brand-navy hover:bg-brand-cream"
      }`}
    >
      {children}
    </button>
  );
}
