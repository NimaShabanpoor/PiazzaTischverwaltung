"use client";

import { useState } from "react";
import { AlertCircle, Check, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { decideReservationAction, type DecisionResult } from "@/lib/actions/reservationDecision";
import type { Decision } from "@/lib/reservationRequests";

/**
 * Annehmen/Ablehnen für eine Online-Anfrage. Der Link in der Mail kann eine
 * Entscheidung vorauswählen (`?aktion=`) – geändert wird aber erst mit dem
 * Klick hier, damit Mail-Vorschauen nichts auslösen.
 */
export function DecisionButtons({
  token,
  preselect,
  customerName,
}: {
  token: string;
  preselect: Decision | null;
  customerName: string;
}) {
  const [busy, setBusy] = useState<Decision | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: Decision) {
    setBusy(decision);
    setError(null);
    const res = await decideReservationAction(token, decision);
    setBusy(null);
    if (res.ok) {
      setResult(res.data);
    } else {
      setError(res.error);
    }
  }

  if (result) {
    const firstName = customerName.split(" ")[0];
    return (
      <div
        className={
          result.accepted
            ? "rounded-2xl bg-status-free-bg p-5 text-brand-navy"
            : "rounded-2xl bg-status-reserved-bg p-5 text-brand-navy"
        }
      >
        <p className="flex items-center gap-2 font-display text-lg font-semibold">
          {result.accepted ? (
            <Check size={22} className="shrink-0 text-status-free" />
          ) : (
            <X size={22} className="shrink-0 text-status-reserved" />
          )}
          {result.accepted ? "Reservation bestätigt" : "Anfrage abgelehnt"}
        </p>

        {result.alreadyDecided ? (
          <p className="mt-2 text-sm text-brand-navy/70">
            Diese Anfrage war bereits entschieden – es wurde nichts geändert und keine
            weitere E-Mail versendet.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-brand-navy/70">
              {result.accepted
                ? `Der Tisch ist für ${firstName} reserviert.`
                : `Der Tisch ist wieder frei und kann neu vergeben werden.`}
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm">
              <Mail size={16} className="shrink-0 text-brand-teal" />
              {result.emailQueued ? (
                <span>
                  {result.accepted ? "Die Bestätigung" : "Die Absage"} geht an{" "}
                  <strong>{result.customerEmail}</strong>.
                </span>
              ) : (
                <span className="text-brand-navy/60">
                  Kein E-Mail-Versand eingerichtet – bitte {firstName} selbst informieren
                  ({result.customerEmail}).
                </span>
              )}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant={preselect === "ablehnen" ? "outline" : "secondary"}
          size="lg"
          className="flex-1"
          disabled={busy !== null}
          onClick={() => decide("annehmen")}
        >
          <Check size={20} />
          {busy === "annehmen" ? "Wird bestätigt…" : "Annehmen"}
        </Button>
        <Button
          variant={preselect === "ablehnen" ? "danger" : "outline"}
          size="lg"
          className="flex-1"
          disabled={busy !== null}
          onClick={() => decide("ablehnen")}
        >
          <X size={20} />
          {busy === "ablehnen" ? "Wird abgelehnt…" : "Ablehnen"}
        </Button>
      </div>

      <p className="mt-3 text-sm text-brand-navy/50">
        Der Gast erhält Ihre Entscheidung automatisch per E-Mail.
      </p>

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-status-reserved-bg p-3 text-sm text-status-reserved">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
