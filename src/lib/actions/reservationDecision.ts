"use server";

import { decideReservation, type Decision } from "../reservationRequests";
import { queueReservationDecision } from "../notifications";
import type { ActionResult } from "./customer";

export type DecisionResult = {
  accepted: boolean;
  /** true = jemand hat diese Anfrage vorher schon entschieden. */
  alreadyDecided: boolean;
  customerEmail: string;
  /** true, wenn die Antwort-Mail an den Gast rausgeht (SMTP eingerichtet). */
  emailQueued: boolean;
};

/**
 * Nimmt eine Online-Anfrage an oder lehnt sie ab. Bewusst eine Server Action
 * (kein Link-Aufruf): So ändert erst ein Klick auf der Seite den Status, und
 * Mail-Vorschauen, die Links im Hintergrund öffnen, lösen nichts aus.
 */
export async function decideReservationAction(
  token: string,
  decision: Decision,
): Promise<ActionResult<DecisionResult>> {
  if (decision !== "annehmen" && decision !== "ablehnen") {
    return { ok: false, error: "Unbekannte Entscheidung." };
  }

  try {
    const outcome = await decideReservation(token, decision);

    if (outcome.kind === "unbekannt") {
      return {
        ok: false,
        error: "Dieser Link gehört zu keiner Anfrage mehr.",
      };
    }

    if (outcome.kind === "schon-entschieden") {
      return {
        ok: true,
        data: {
          accepted: outcome.reservation.status === "CONFIRMED",
          alreadyDecided: true,
          customerEmail: outcome.reservation.customerEmail,
          emailQueued: false,
        },
      };
    }

    const emailQueued = queueReservationDecision(outcome.reservation, outcome.accepted);

    return {
      ok: true,
      data: {
        accepted: outcome.accepted,
        alreadyDecided: false,
        customerEmail: outcome.reservation.customerEmail,
        emailQueued,
      },
    };
  } catch (err) {
    console.error("decideReservationAction failed", err);
    return {
      ok: false,
      error: "Die Entscheidung konnte nicht gespeichert werden. Bitte erneut versuchen.",
    };
  }
}
