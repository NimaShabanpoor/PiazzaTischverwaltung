import { randomBytes } from "node:crypto";
import { ReservationStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { createReservation, type CreateReservationInput } from "./reservations";
import { zurichNow } from "./time";

/**
 * Online-Reservationen sind Anfragen: Sie werden mit dem Status ANGEFRAGT
 * angelegt und erst gültig, wenn das Restaurant sie über den Link in der
 * Anfrage-Mail annimmt. Der Tisch ist währenddessen belegt (siehe
 * ACTIVE_RESERVATION_STATUSES), damit ihn niemand sonst anfragen kann.
 */

/** Geheimer, nicht erratbarer Code für den Freigabe-Link (192 Bit). */
function createDecisionToken(): string {
  return randomBytes(24).toString("base64url");
}

export type ReservationRequest = Awaited<ReturnType<typeof requestReservation>>;

/** Legt eine Online-Anfrage an und gibt sie samt Freigabe-Code zurück. */
export async function requestReservation(input: CreateReservationInput) {
  const decisionToken = createDecisionToken();
  const reservation = await createReservation(
    { ...input, source: "ONLINE" },
    { status: ReservationStatus.ANGEFRAGT, decisionToken },
  );
  return { reservation, decisionToken };
}

/** Lädt die Anfrage zum Freigabe-Code – nur lesend, für die Entscheidungsseite. */
export async function findRequestByToken(token: string) {
  if (!token.trim()) return null;
  return prisma.reservation.findUnique({
    where: { decisionToken: token },
    include: { table: true },
  });
}

export type Decision = "annehmen" | "ablehnen";

export type DecisionOutcome =
  /** Der Link gehört zu keiner Anfrage (falsch kopiert oder Reservation gelöscht). */
  | { kind: "unbekannt" }
  /** Jemand hat bereits entschieden – die zweite Entscheidung zählt nicht. */
  | { kind: "schon-entschieden"; reservation: NonNullable<Awaited<ReturnType<typeof findRequestByToken>>> }
  | { kind: "entschieden"; accepted: boolean; reservation: NonNullable<Awaited<ReturnType<typeof findRequestByToken>>> };

/**
 * Nimmt eine Anfrage an oder lehnt sie ab. Nur der Status ANGEFRAGT lässt sich
 * entscheiden, deshalb ändert ein zweiter Klick auf den Link nichts mehr.
 * Bei der Ablehnung wird der Tisch frei, weil ABGELEHNT nicht mehr zu den
 * belegenden Status gehört.
 */
export async function decideReservation(
  token: string,
  decision: Decision,
): Promise<DecisionOutcome> {
  if (!token.trim()) return { kind: "unbekannt" };

  return prisma.$transaction(async (tx) => {
    const existing = await tx.reservation.findUnique({
      where: { decisionToken: token },
      include: { table: true },
    });
    if (!existing) return { kind: "unbekannt" };
    if (existing.status !== ReservationStatus.ANGEFRAGT) {
      return { kind: "schon-entschieden", reservation: existing };
    }

    const accepted = decision === "annehmen";
    const reservation = await tx.reservation.update({
      where: { id: existing.id },
      data: {
        status: accepted ? ReservationStatus.CONFIRMED : ReservationStatus.ABGELEHNT,
        decidedAt: zurichNow(),
      },
      include: { table: true },
    });
    return { kind: "entschieden", accepted, reservation };
  });
}

/**
 * Anfragen, die noch auf eine Entscheidung warten – für den Hinweis im
 * Admin-Bereich, damit der Chef nicht auf die Mail angewiesen ist.
 */
export async function listOpenRequests() {
  return prisma.reservation.findMany({
    where: { status: ReservationStatus.ANGEFRAGT },
    include: { table: true },
    orderBy: { start: "asc" },
  });
}
