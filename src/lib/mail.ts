import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { RESTAURANT_NOTIFY_EMAIL } from "./constants";

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Anbieterunabhängiger Versand über SMTP (Postfach des Webhosters, Gmail,
 * Outlook, …). Die Zugangsdaten stehen in `.env` – siehe `.env.example`.
 */
export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Absender: MAIL_FROM, sonst das SMTP-Konto selbst (verlangen viele Anbieter ohnehin). */
function senderAddress(): string | undefined {
  return process.env.MAIL_FROM?.trim() || process.env.SMTP_USER;
}

/**
 * Restaurant-Adresse für alle Reservationen: Online-Anfragen zur Freigabe und
 * Hinweise zu Gruppenanfragen. Bewusst fest im Code (constants.ts), damit eine
 * alte ADMIN_NOTIFY_EMAIL / RESERVATION_APPROVER_EMAIL beim Hosting sie nicht
 * überschreibt.
 */
export function adminNotifyAddress(): string {
  return RESTAURANT_NOTIFY_EMAIL;
}

/** Adresse, die jede Online-Anfrage zur Freigabe erhält. */
export function approverAddress(): string {
  return RESTAURANT_NOTIFY_EMAIL;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Versendet eine E-Mail und wirft nie: Eine fehlgeschlagene Mail darf eine
 * Reservation oder Anfrage nicht verhindern. Gibt zurück, ob versendet wurde.
 */
export async function sendMail(message: MailMessage): Promise<boolean> {
  if (!isMailConfigured()) {
    console.info(
      `[mail] SMTP nicht konfiguriert – E-Mail „${message.subject}" wurde nicht versendet.`,
    );
    return false;
  }
  try {
    await getTransporter().sendMail({
      from: senderAddress(),
      // Antworten von Gästen landen direkt beim Restaurant.
      replyTo: RESTAURANT_NOTIFY_EMAIL,
      ...message,
    });
    return true;
  } catch (err) {
    console.error(`[mail] Versand von „${message.subject}" fehlgeschlagen`, err);
    return false;
  }
}
