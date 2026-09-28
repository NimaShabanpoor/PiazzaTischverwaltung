"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Label, Textarea } from "@/components/ui/Field";

export function LockTableDialog({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  isPending?: boolean;
}) {
  const [note, setNote] = useState("");

  return (
    <Modal open={open} onClose={onClose} title="Tisch sperren">
      <p className="text-brand-navy/70">
        Der Tisch ist danach nicht mehr buchbar, bis er wieder freigegeben wird.
      </p>
      <div className="mt-4">
        <Label htmlFor="lock-note">Grund (optional)</Label>
        <Textarea
          id="lock-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="z.B. defekt, privater Anlass…"
        />
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          Abbrechen
        </Button>
        <Button onClick={() => onConfirm(note)} disabled={isPending}>
          {isPending ? "Bitte warten…" : "Tisch sperren"}
        </Button>
      </div>
    </Modal>
  );
}
