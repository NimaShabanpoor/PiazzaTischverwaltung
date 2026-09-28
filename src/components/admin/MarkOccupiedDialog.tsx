"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ErrorText, Input, Label } from "@/components/ui/Field";
import { addMinutes, toTimeHHmm, zurichNow } from "@/lib/time";

function defaultFrom(): string {
  return toTimeHHmm(zurichNow());
}

function defaultUntil(): string {
  return toTimeHHmm(addMinutes(zurichNow(), 120));
}

export function MarkOccupiedDialog({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (from: string, until: string) => void;
  isPending?: boolean;
}) {
  const [from, setFrom] = useState(defaultFrom);
  const [until, setUntil] = useState(defaultUntil);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (until <= from) {
      setError("Die Bis-Zeit muss nach der Von-Zeit liegen.");
      return;
    }
    setError(null);
    onConfirm(from, until);
  }

  return (
    <Modal open={open} onClose={onClose} title="Tisch als besetzt markieren">
      <p className="text-brand-navy/70">
        Für welchen Zeitraum heute ist der Tisch besetzt? Danach ist er automatisch wieder normal
        nutzbar – z.B. für eine spätere Reservation oder am nächsten Tag.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="occupied-from">Von</Label>
          <Input
            id="occupied-from"
            type="time"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="occupied-until">Bis</Label>
          <Input
            id="occupied-until"
            type="time"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
          />
        </div>
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          Abbrechen
        </Button>
        <Button variant="secondary" onClick={submit} disabled={isPending}>
          {isPending ? "Bitte warten…" : "Als besetzt markieren"}
        </Button>
      </div>
    </Modal>
  );
}
