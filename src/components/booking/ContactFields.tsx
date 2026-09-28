"use client";

import { Input, Label, Textarea } from "@/components/ui/Field";

export type ContactData = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  note: string;
};

export function ContactFields({
  data,
  onChange,
}: {
  data: ContactData;
  onChange: (patch: Partial<ContactData>) => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="customerName">Name *</Label>
        <Input
          id="customerName"
          value={data.customerName}
          onChange={(e) => onChange({ customerName: e.target.value })}
          placeholder="Vorname Nachname"
          autoComplete="name"
        />
      </div>
      <div>
        <Label htmlFor="customerPhone">Telefonnummer *</Label>
        <Input
          id="customerPhone"
          type="tel"
          value={data.customerPhone}
          onChange={(e) => onChange({ customerPhone: e.target.value })}
          placeholder="079 123 45 67"
          autoComplete="tel"
        />
      </div>
      <div>
        <Label htmlFor="customerEmail">E-Mail *</Label>
        <Input
          id="customerEmail"
          type="email"
          value={data.customerEmail}
          onChange={(e) => onChange({ customerEmail: e.target.value })}
          placeholder="name@beispiel.ch"
          autoComplete="email"
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="note">Anmerkungen (optional)</Label>
        <Textarea
          id="note"
          rows={3}
          value={data.note}
          onChange={(e) => onChange({ note: e.target.value })}
          placeholder="z.B. Allergien, Geburtstag, Kinderstuhl…"
        />
      </div>
    </div>
  );
}
