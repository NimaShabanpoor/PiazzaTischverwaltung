import { after } from "next/server";
import { adminNotifyAddress, approverAddress, isMailConfigured, sendMail } from "./mail";
import {
  groupRequestAdminEmail,
  groupRequestDeclinedEmail,
  groupRequestReceivedEmail,
  reservationConfirmationEmail,
  reservationDeclinedEmail,
  reservationPendingEmail,
  reservationRequestAdminEmail,
  type GroupRequestMailData,
  type ReservationMailData,
} from "./emailTemplates";
import { shortConfirmationCode } from "./confirmationCode";
import { toDateISO, toTimeHHmm } from "./time";

type ReservationForMail = {
  confirmationCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  start: Date;
  end: Date;
  partySize: number;
  note: string | null;
  table: { number: number };
};

type GroupRequestForMail = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  start: Date;
  end: Date;
  partySize: number;
  note: string | null;
};

/*
 * Alle E-Mails laufen über `after`: Sie werden erst verschickt, nachdem die
 * Antwort an den Browser gegangen ist. Eine langsame oder fehlerhafte Mail
 * verzögert oder verhindert also nie eine Buchung. Nur aus Server Actions
 * aufrufen. Rückgabe: ob überhaupt versendet wird (SMTP konfiguriert).
 */

function toReservationMailData(reservation: ReservationForMail): ReservationMailData {
  return {
    customerName: reservation.customerName,
    dateISO: toDateISO(reservation.start),
    startTime: toTimeHHmm(reservation.start),
    endTime: toTimeHHmm(reservation.end),
    tableNumber: reservation.table.number,
    partySize: reservation.partySize,
    code: shortConfirmationCode(reservation.confirmationCode),
    note: reservation.note,
  };
}

export function queueReservationConfirmation(reservation: ReservationForMail): boolean {
  const mail = reservationConfirmationEmail(toReservationMailData(reservation));
  after(() => sendMail({ to: reservation.customerEmail, ...mail }));
  return isMailConfigured();
}

/**
 * Neue Online-Anfrage: Der Gast erfährt, dass seine Reservation bearbeitet
 * wird, das Restaurant erhält die Anfrage mit den Knöpfen zum Entscheiden.
 */
export function queueReservationRequest(
  reservation: ReservationForMail,
  decisionToken: string,
): boolean {
  const data = toReservationMailData(reservation);
  const guestMail = reservationPendingEmail(data);
  const adminMail = reservationRequestAdminEmail({
    ...data,
    customerEmail: reservation.customerEmail,
    customerPhone: reservation.customerPhone,
    decisionToken,
  });
  const approver = approverAddress();
  after(async () => {
    await sendMail({ to: reservation.customerEmail, ...guestMail });
    await sendMail({ to: approver, ...adminMail });
  });
  return isMailConfigured();
}

/** Entscheidung des Restaurants: Zusage oder Absage an den Gast. */
export function queueReservationDecision(
  reservation: ReservationForMail,
  accepted: boolean,
): boolean {
  const data = toReservationMailData(reservation);
  const mail = accepted ? reservationConfirmationEmail(data) : reservationDeclinedEmail(data);
  after(() => sendMail({ to: reservation.customerEmail, ...mail }));
  return isMailConfigured();
}

function toGroupMailData(request: GroupRequestForMail): GroupRequestMailData {
  return {
    customerName: request.customerName,
    customerEmail: request.customerEmail,
    customerPhone: request.customerPhone,
    dateISO: toDateISO(request.start),
    startTime: toTimeHHmm(request.start),
    endTime: toTimeHHmm(request.end),
    partySize: request.partySize,
    note: request.note,
  };
}

export function queueGroupRequestReceived(request: GroupRequestForMail): boolean {
  const data = toGroupMailData(request);
  const adminAddress = adminNotifyAddress();
  after(async () => {
    await sendMail({ to: request.customerEmail, ...groupRequestReceivedEmail(data) });
    await sendMail({ to: adminAddress, ...groupRequestAdminEmail(data) });
  });
  return isMailConfigured();
}

export function queueGroupRequestDeclined(request: GroupRequestForMail): boolean {
  const mail = groupRequestDeclinedEmail(toGroupMailData(request));
  after(() => sendMail({ to: request.customerEmail, ...mail }));
  return isMailConfigured();
}
