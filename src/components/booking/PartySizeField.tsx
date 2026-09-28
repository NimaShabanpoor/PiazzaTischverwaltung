"use client";

import clsx from "clsx";
import { Check, Minus, Plus, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MAX_GROUP_REQUEST_SIZE, MAX_ONLINE_PARTY_SIZE } from "@/lib/constants";

const QUICK_SIZES = Array.from({ length: MAX_ONLINE_PARTY_SIZE }, (_, i) => i + 1);
const MIN_REQUEST_SIZE = MAX_ONLINE_PARTY_SIZE + 1;

export function PartySizeField({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (size: number) => void;
}) {
  const isRequest = value !== null && value > MAX_ONLINE_PARTY_SIZE;
  const requestSize = isRequest ? value : MIN_REQUEST_SIZE;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onChange(size)}
            className={clsx(
              "flex flex-col items-center gap-1 rounded-2xl border-2 py-4 font-medium transition-colors cursor-pointer",
              value === size
                ? "border-brand-orange bg-brand-orange text-white"
                : "border-brand-cream-dark bg-white text-brand-navy hover:border-brand-teal",
            )}
          >
            <Users size={20} />
            {size}
          </button>
        ))}
      </div>

      <div
        className={clsx(
          "mt-4 rounded-2xl border-2 p-4 transition-colors",
          isRequest
            ? "border-brand-orange bg-status-occupied-bg/50"
            : "border-brand-cream-dark bg-white",
        )}
      >
        <p className="font-semibold text-brand-navy">
          Mehr als {MAX_ONLINE_PARTY_SIZE} Personen?
        </p>
        <p className="mt-1 text-sm text-brand-navy/60">
          Grössere Gruppen können nicht direkt online reservieren. Senden Sie uns eine
          Anfrage – wir prüfen die Tische und melden uns bei Ihnen.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-xl border-2 border-brand-cream-dark bg-white px-3 py-2">
            <button
              type="button"
              aria-label="Weniger Personen"
              disabled={isRequest && requestSize <= MIN_REQUEST_SIZE}
              onClick={() => onChange(Math.max(MIN_REQUEST_SIZE, requestSize - 1))}
              className="rounded-full p-1.5 text-brand-navy hover:bg-brand-cream cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Minus size={18} />
            </button>
            <span className="min-w-20 text-center font-display font-semibold">
              {requestSize} Personen
            </span>
            <button
              type="button"
              aria-label="Mehr Personen"
              disabled={requestSize >= MAX_GROUP_REQUEST_SIZE}
              onClick={() => onChange(Math.min(MAX_GROUP_REQUEST_SIZE, requestSize + 1))}
              className="rounded-full p-1.5 text-brand-navy hover:bg-brand-cream cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Plus size={18} />
            </button>
          </div>

          {isRequest ? (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-navy">
              <Check size={16} className="text-status-free" />
              Gruppenanfrage gewählt
            </span>
          ) : (
            <Button variant="outline" size="md" onClick={() => onChange(requestSize)}>
              <Send size={16} />
              Anfrage stellen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
