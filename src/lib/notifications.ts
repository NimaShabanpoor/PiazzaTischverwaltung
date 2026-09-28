import { after } from "next/server";
import { adminNotifyAddress, isMailConfigured, sendMail } from "./mail";
import {
  groupRequestAdminEmail,
  groupRequestDeclinedEmail,
  groupRequestReceivedEmail,
  reservationConfirmationEmail,
  type GroupRequestMailData,
} from "./emailTemplates";
import { shortConfirmationCode } from "./confirmationCode";
import { toDateISO, toTimeHHmm } from "./time";

type ReservationForMail = {
  confirmationCode: string;
  customerName: string;
  customerEmail: string;
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

export function queueReservationConfirmation(reservation: ReservationForMail): boolean {
  const mail = reservationConfirmationEmail({
    customerName: reservation.customerName,
    dateISO: toDateISO(reservation.start),
    startTime: toTimeHHmm(reservation.start),
    endTime: toTimeHHmm(reservation.end),
    tableNumber: reservation.table.number,
    partySize: reservation.partySize,
    code: shortConfirmationCode(reservation.confirmationCode),
    note: reservation.note,
  });
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
    if (adminAddress) {
      await sendMail({ to: adminAddress, ...groupRequestAdminEmail(data) });
    }
  });
  return isMailConfigured();
}

export function queueGroupRequestDeclined(request: GroupRequestForMail): boolean {
  const mail = groupRequestDeclinedEmail(toGroupMailData(request));
  after(() => sendMail({ to: request.customerEmail, ...mail }));
  return isMailConfigured();
}
