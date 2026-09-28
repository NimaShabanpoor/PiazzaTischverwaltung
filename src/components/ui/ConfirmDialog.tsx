"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Bestätigen",
  danger,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  isPending?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-brand-navy/70">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          Abbrechen
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={isPending}>
          {isPending ? "Bitte warten…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
