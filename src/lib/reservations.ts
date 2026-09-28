import { Prisma, ReservationStatus, TableStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { combineDateAndTime, toDateISO, toTimeHHmm, zurichNow } from "./time";

export const ACTIVE_RESERVATION_STATUSES: ReservationStatus[] = [
  ReservationStatus.CONFIRMED,
  ReservationStatus.ARRIVED,
];

export class ReservationConflictError extends Error {
  constructor(message = "Dieser Tisch ist im gewählten Zeitraum bereits reserviert.") {
    super(message);
    this.name = "ReservationConflictError";
  }
}

export class ReservationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationValidationError";
  }
}

export type TableAvailability = {
  id: string;
  number: number;
  seats: number;
  status: TableStatus;
  available: boolean;
  reason: "gesperrt" | "besetzt-manuell" | "zu-klein" | "reserviert" | null;
};

type BusyWindowTable = {
  status: TableStatus;
  busyFrom: Date | null;
  busyUntil: Date | null;
};

/**
 * BESETZT ist zeitlich begrenzt (busyFrom/busyUntil): ein Tisch, der z.B.
 * mittags manuell als besetzt markiert wurde, blockiert nur diesen
 * Zeitraum – abends oder am nächsten Tag ist er wieder normal buchbar.
 * Ist kein Zeitfenster hinterlegt (Alt-/Fehlerfall), gilt BESETZT
 * vorsichtshalber als durchgehend blockierend.
 */
function overlapsBusyWindow(table: BusyWindowTable, rangeStart: Date, rangeEnd: Date): boolean {
  if (table.status !== TableStatus.BESETZT) return false;
  if (!table.busyFrom || !table.busyUntil) return true;
  return table.busyFrom < rangeEnd && table.busyUntil > rangeStart;
}

function isBusyAt(table: BusyWindowTable, at: Date): boolean {
  if (table.status !== TableStatus.BESETZT) return false;
  if (!table.busyFrom || !table.busyUntil) return true;
  return table.busyFrom <= at && table.busyUntil > at;
}

/**
 * Ermittelt für alle aktiven Tische, ob sie für den angefragten Zeitraum
 * (Von-Bis, frei wählbar) gebucht werden können.
 */
export async function getAvailabilityForSlot(
  dateISO: string,
  startTime: string,
  endTime: string,
  partySize: number,
): Promise<TableAvailability[]> {
  const start = combineDateAndTime(dateISO, startTime);
  const end = combineDateAndTime(dateISO, endTime);

  const tables = await prisma.table.findMany({
    where: { active: true },
    orderBy: { number: "asc" },
    include: {
      reservations: {
        where: {
          status: { in: ACTIVE_RESERVATION_STATUSES },
          start: { lt: end },
          end: { gt: start },
        },
        select: { id: true },
      },
    },
  });

  return tables.map((table) => {
    if (table.status === TableStatus.GESPERRT) {
      return {
        id: table.id,
        number: table.number,
        seats: table.seats,
        status: table.status,
        available: false,
        reason: "gesperrt",
      };
    }
    if (overlapsBusyWindow(table, start, end)) {
      return {
        id: table.id,
        number: table.number,
        seats: table.seats,
        status: table.status,
        available: false,
        reason: "besetzt-manuell",
      };
    }
    if (table.seats < partySize) {
      return {
        id: table.id,
        number: table.number,
        seats: table.seats,
        status: table.status,
        available: false,
        reason: "zu-klein",
      };
    }
    if (table.reservations.length > 0) {
      return {
        id: table.id,
        number: table.number,
        seats: table.seats,
        status: table.status,
        available: false,
        reason: "reserviert",
      };
    }
    return {
      id: table.id,
      number: table.number,
      seats: table.seats,
      status: table.status,
      available: true,
      reason: null,
    };
  });
}

export type CreateReservationInput = {
  tableId: string;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  note?: string;
  source?: "ONLINE" | "PHONE";
};

/**
 * Legt eine Reservation an. Prüft Verfügbarkeit unmittelbar vor dem
 * Schreiben (verhindert die allermeisten Doppelbuchungen) UND verlässt
 * sich zusätzlich auf eine DB-seitige Exclusion-Constraint
 * (`reservations_no_overlap`), die echte Gleichzeitigkeits-Konflikte
 * absolut zuverlässig verhindert.
 */
export type ReservationWriteOptions = {
  /**
   * false = der Chef darf mehr Personen eintragen, als der Tisch Plätze hat
   * (z.B. bei Gruppen, für die Tische zusammengestellt werden).
   */
  enforceCapacity?: boolean;
};

export async function createReservation(
  input: CreateReservationInput,
  options: ReservationWriteOptions = {},
) {
  const enforceCapacity = options.enforceCapacity ?? true;
  const start = combineDateAndTime(input.date, input.startTime);
  const end = combineDateAndTime(input.date, input.endTime);

  if (end <= start) {
    throw new ReservationValidationError("Die Bis-Zeit muss nach der Von-Zeit liegen.");
  }
  if (start.getTime() < zurichNow().getTime()) {
    throw new ReservationValidationError(
      "Reservationen in der Vergangenheit sind nicht möglich.",
    );
  }

  const table = await prisma.table.findUnique({ where: { id: input.tableId } });
  if (!table || !table.active) {
    throw new ReservationValidationError("Dieser Tisch existiert nicht oder ist deaktiviert.");
  }
  if (table.status === TableStatus.GESPERRT) {
    throw new ReservationValidationError("Dieser Tisch ist aktuell gesperrt.");
  }
  if (overlapsBusyWindow(table, start, end)) {
    throw new ReservationValidationError("Dieser Tisch ist im gewählten Zeitraum besetzt.");
  }
  if (enforceCapacity && table.seats < input.partySize) {
    throw new ReservationValidationError(
      `Tisch ${table.number} bietet nur Platz für ${table.seats} Personen.`,
    );
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const conflict = await tx.reservation.findFirst({
        where: {
          tableId: input.tableId,
          status: { in: ACTIVE_RESERVATION_STATUSES },
          start: { lt: end },
          end: { gt: start },
        },
        select: { id: true },
      });
      if (conflict) {
        throw new ReservationConflictError();
      }
      return tx.reservation.create({
        data: {
          tableId: input.tableId,
          start,
          end,
          partySize: input.partySize,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail,
          note: input.note,
          source: input.source ?? "ONLINE",
        },
        include: { table: true },
      });
    });
  } catch (err) {
    if (isExclusionViolation(err)) {
      throw new ReservationConflictError();
    }
    throw err;
  }
}

/** Erkennt die Postgres Exclusion-Constraint-Verletzung (Code 23P01). */
function isExclusionViolation(err: unknown): boolean {
  if (err instanceof ReservationConflictError) return true;
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const meta = err.meta as { code?: string; message?: string } | undefined;
    if (err.code === "P2010" || err.code === "P2034") return true;
    if (meta?.code === "23P01") return true;
    if (typeof meta?.message === "string" && meta.message.includes("23P01")) return true;
  }
  if (err instanceof Error && err.message.includes("23P01")) return true;
  return false;
}

export type UpdateReservationInput = {
  tableId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  partySize?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  note?: string | null;
  status?: ReservationStatus;
};

/**
 * Bearbeitet eine bestehende Reservation (Admin). Bei Änderung von
 * Tisch/Datum/Zeit wird erneut auf Überschneidungen geprüft (die eigene
 * Reservation wird dabei ausgeschlossen).
 */
export async function updateReservation(
  id: string,
  input: UpdateReservationInput,
  options: ReservationWriteOptions = {},
) {
  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) {
    throw new ReservationValidationError("Reservation wurde nicht gefunden.");
  }

  const tableId = input.tableId ?? existing.tableId;
  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table) {
    throw new ReservationValidationError("Dieser Tisch existiert nicht.");
  }

  const partySize = input.partySize ?? existing.partySize;
  // Nur prüfen, wenn Tisch oder Personenzahl geändert werden – sonst könnte z.B.
  // eine vom Chef erfasste Gruppenreservation nicht mehr storniert werden.
  const capacityChanged = input.tableId !== undefined || input.partySize !== undefined;
  if ((options.enforceCapacity ?? true) && capacityChanged && table.seats < partySize) {
    throw new ReservationValidationError(
      `Tisch ${table.number} bietet nur Platz für ${table.seats} Personen.`,
    );
  }

  let start = existing.start;
  let end = existing.end;
  if (input.date || input.startTime || input.endTime) {
    const dateISO = input.date ?? toDateISO(start);
    const startHHmm = input.startTime ?? toTimeHHmm(start);
    const endHHmm = input.endTime ?? toTimeHHmm(end);
    start = combineDateAndTime(dateISO, startHHmm);
    end = combineDateAndTime(dateISO, endHHmm);
    if (end <= start) {
      throw new ReservationValidationError("Die Bis-Zeit muss nach der Von-Zeit liegen.");
    }
  }

  const nextStatus = input.status ?? existing.status;

  try {
    return await prisma.$transaction(async (tx) => {
      if (ACTIVE_RESERVATION_STATUSES.includes(nextStatus)) {
        const conflict = await tx.reservation.findFirst({
          where: {
            id: { not: id },
            tableId,
            status: { in: ACTIVE_RESERVATION_STATUSES },
            start: { lt: end },
            end: { gt: start },
          },
          select: { id: true },
        });
        if (conflict) {
          throw new ReservationConflictError();
        }
      }

      return tx.reservation.update({
        where: { id },
        data: {
          tableId,
          start,
          end,
          partySize,
          customerName: input.customerName ?? existing.customerName,
          customerPhone: input.customerPhone ?? existing.customerPhone,
          customerEmail: input.customerEmail ?? existing.customerEmail,
          note: input.note === undefined ? existing.note : input.note,
          status: nextStatus,
        },
        include: { table: true },
      });
    });
  } catch (err) {
    if (isExclusionViolation(err)) {
      throw new ReservationConflictError();
    }
    throw err;
  }
}

/** Bestimmt den heute für den Kunden/Chef sichtbaren Status eines Tisches "jetzt". */
export function computeDisplayStatus(
  table: BusyWindowTable,
  reservationsNow: { start: Date; end: Date; status: ReservationStatus }[],
): TableStatus | "RESERVIERT" {
  if (table.status === TableStatus.GESPERRT) return TableStatus.GESPERRT;
  const now = zurichNow();
  if (isBusyAt(table, now)) return TableStatus.BESETZT;
  const hasCurrentReservation = reservationsNow.some(
    (r) =>
      ACTIVE_RESERVATION_STATUSES.includes(r.status) &&
      r.start.getTime() <= now.getTime() &&
      r.end.getTime() > now.getTime(),
  );
  if (hasCurrentReservation) return "RESERVIERT";
  return TableStatus.FREI;
}
