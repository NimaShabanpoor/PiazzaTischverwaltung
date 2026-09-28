"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorText, Input, Label } from "@/components/ui/Field";
import { TableGraphic } from "@/components/TableGraphic";
import { updateTableAction } from "@/lib/actions/adminTables";
import type { TableDTO } from "@/lib/adminTypes";

export function TableConfigList({ tables }: { tables: TableDTO[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {tables.map((table) => (
        <TableConfigCard key={table.id} table={table} />
      ))}
    </div>
  );
}

function TableConfigCard({ table }: { table: TableDTO }) {
  const [number, setNumber] = useState(table.number);
  const [seats, setSeats] = useState(table.seats);
  const [active, setActive] = useState(table.active);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dirty = number !== table.number || seats !== table.seats || active !== table.active;

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateTableAction(table.id, { number, seats, active });
      if (res.ok) {
        setSaved(true);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="rounded-3xl border-2 border-brand-cream-dark bg-white p-5">
      <div className="mb-4 flex items-center gap-4">
        <TableGraphic
          number={number}
          seats={seats}
          status={active ? "FREI" : "GESPERRT"}
          size={72}
        />
        <div>
          <p className="font-display text-lg font-semibold text-brand-navy">
            Tisch {table.number}
          </p>
          <p className="text-sm text-brand-navy/50">
            {active ? "Aktiv" : "Deaktiviert"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`number-${table.id}`}>Tischnummer</Label>
          <Input
            id={`number-${table.id}`}
            type="number"
            min={1}
            max={4}
            value={number}
            onChange={(e) => setNumber(Number(e.target.value) || 1)}
          />
        </div>
        <div>
          <Label htmlFor={`seats-${table.id}`}>Sitzplätze</Label>
          <Input
            id={`seats-${table.id}`}
            type="number"
            min={1}
            max={20}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value) || 1)}
          />
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-5 w-5 accent-brand-teal"
        />
        <span className="font-medium text-brand-navy">Tisch ist aktiv (buchbar)</span>
      </label>

      <ErrorText>{error}</ErrorText>
      {saved && !dirty && (
        <p className="mt-1.5 text-sm font-medium text-status-free">Gespeichert.</p>
      )}

      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={!dirty || isPending} size="md">
          <Save size={16} />
          {isPending ? "Speichern…" : "Speichern"}
        </Button>
      </div>
    </div>
  );
}
