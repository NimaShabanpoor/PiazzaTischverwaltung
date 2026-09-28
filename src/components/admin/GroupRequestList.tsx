"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, Mail, Phone, Trash2, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ReservationFormModal, type ReservationPrefill } from "./ReservationFormModal";
import {
  acceptGroupRequestAction,
  declineGroupRequestAction,
  deleteGroupRequestAction,
} from "@/lib/actions/groupRequests";
import { formatDateDeCH, formatWeekdayDe, toDateISO, toTimeHHmm } from "@/lib/time";
import { MAX_ONLINE_PARTY_SIZE } from "@/lib/constants";
import type { GroupRequestDTO, TableDTO } from "@/lib/adminTypes";

const STATUS_LABEL: Record<GroupRequestDTO["status"], string> = {
  OFFEN: "Offen",
  ANGENOMMEN: "Angenommen",
  ABGELEHNT: "Abgelehnt",
};

function toPrefill(request: GroupRequestDTO): ReservationPrefill {
  return {
    date: toDateISO(request.start),
    startTime: toTimeHHmm(request.start),
    endTime: toTimeHHmm(request.end),
    partySize: request.partySize,
    customerName: request.customerName,
    customerPhone: request.customerPhone,
    customerEmail: request.customerEmail,
    note: request.note,
  };
}

export function GroupRequestList({
  requests,
  tables,
}: {
  requests: GroupRequestDTO[];
  tables: TableDTO[];
}) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [converting, setConverting] = useState<GroupRequestDTO | null>(null);
  // Erzwingt einen frischen Formular-Mount bei jedem Öffnen (statt Reset per Effect).
  const [formToken, setFormToken] = useState(0);
  const [declineTarget, setDeclineTarget] = useState<GroupRequestDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupRequestDTO | null>(null);

  const openRequests = requests.filter((r) => r.status === "OFFEN");
  const handledRequests = requests
    .filter((r) => r.status !== "OFFEN")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  function run(action: () => Promise<{ ok: boolean; error?: string }>, onDone?: () => void) {
    setActionError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok && res.error) setActionError(res.error);
      else onDone?.();
    });
  }

  function openConvert(request: GroupRequestDTO) {
    setConverting(request);
    setFormToken((t) => t + 1);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-brand-navy sm:text-3xl">
          Anfragen
        </h1>
        <p className="text-brand-navy/60">
          Gruppen ab {MAX_ONLINE_PARTY_SIZE + 1} Personen können nicht direkt online reservieren
          und senden hier eine Anfrage.
        </p>
      </div>

      {actionError && (
        <p className="mb-4 rounded-xl bg-status-reserved-bg p-3 text-sm font-medium text-status-reserved">
          {actionError}
        </p>
      )}

      {openRequests.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-brand-navy/60">
          Keine offenen Anfragen.
        </p>
      ) : (
        <div className="space-y-4">
          {openRequests.map((request) => {
            const dateISO = toDateISO(request.start);
            return (
              <div key={request.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold text-brand-navy">
                      {formatWeekdayDe(dateISO)}, {formatDateDeCH(dateISO)}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2 text-brand-navy/70">
                      <span>
                        {toTimeHHmm(request.start)} – {toTimeHHmm(request.end)} Uhr
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-brand-navy">
                        <Users size={16} />
                        {request.partySize} Personen
                      </span>
                    </p>
                  </div>
                  <span className="text-xs text-brand-navy/50">
                    eingegangen {formatDateDeCH(toDateISO(request.createdAt))}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-navy">
                  <span className="font-medium">{request.customerName}</span>
                  <a
                    href={`tel:${request.customerPhone.replace(/\s+/g, "")}`}
                    className="flex items-center gap-1 text-brand-teal hover:underline"
                  >
                    <Phone size={14} />
                    {request.customerPhone}
                  </a>
                  <a
                    href={`mailto:${request.customerEmail}`}
                    className="flex items-center gap-1 text-brand-teal hover:underline"
                  >
                    <Mail size={14} />
                    {request.customerEmail}
                  </a>
                </div>
                {request.note && (
                  <p className="mt-2 text-sm italic text-brand-navy/60">„{request.note}“</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="md" onClick={() => openConvert(request)} disabled={isPending}>
                    <CalendarPlus size={16} />
                    Als Reservation erfassen
                  </Button>
                  <Button
                    size="md"
                    variant="outline"
                    onClick={() => setDeclineTarget(request)}
                    disabled={isPending}
                  >
                    <XCircle size={16} />
                    Ablehnen
                  </Button>
                  <Button
                    size="md"
                    variant="ghost"
                    onClick={() => setDeleteTarget(request)}
                    disabled={isPending}
                    aria-label="Anfrage löschen"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {handledRequests.length > 0 && (
        <details className="mt-6 text-sm text-brand-navy/60">
          <summary className="cursor-pointer select-none font-medium">
            Bearbeitete Anfragen ({handledRequests.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {handledRequests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-2.5"
              >
                <span>
                  {formatDateDeCH(toDateISO(request.start))} · {toTimeHHmm(request.start)} Uhr ·{" "}
                  {request.partySize} Personen · {request.customerName}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-medium text-brand-navy">
                    {STATUS_LABEL[request.status]}
                  </span>
                  <button
                    type="button"
                    aria-label="Anfrage löschen"
                    onClick={() => setDeleteTarget(request)}
                    className="rounded-lg p-1.5 text-status-reserved hover:bg-status-reserved-bg cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <ReservationFormModal
        key={formToken}
        open={!!converting}
        onClose={() => setConverting(null)}
        tables={tables}
        prefill={converting ? toPrefill(converting) : undefined}
        onSaved={() => {
          if (converting) run(() => acceptGroupRequestAction(converting.id));
        }}
      />

      <ConfirmDialog
        open={!!declineTarget}
        onClose={() => setDeclineTarget(null)}
        title="Anfrage ablehnen"
        description={`${declineTarget?.customerName ?? "Der Gast"} erhält eine E-Mail, dass die Anfrage leider nicht bestätigt werden kann.`}
        confirmLabel="Ablehnen"
        danger
        isPending={isPending}
        onConfirm={() => {
          if (declineTarget) {
            run(() => declineGroupRequestAction(declineTarget.id), () => setDeclineTarget(null));
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Anfrage löschen"
        description="Die Anfrage wird endgültig gelöscht. Der Gast wird nicht benachrichtigt."
        confirmLabel="Endgültig löschen"
        danger
        isPending={isPending}
        onConfirm={() => {
          if (deleteTarget) {
            run(() => deleteGroupRequestAction(deleteTarget.id), () => setDeleteTarget(null));
          }
        }}
      />
    </div>
  );
}
