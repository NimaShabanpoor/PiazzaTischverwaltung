import { RESTAURANT_INFO } from "./constants";
import { formatDateDeCH, formatWeekdayDe } from "./time";

export type MailContent = {
  subject: string;
  html: string;
  text: string;
};

export type ReservationMailData = {
  customerName: string;
  dateISO: string;
  startTime: string;
  endTime: string;
  tableNumber: number;
  partySize: number;
  code: string;
  note: string | null;
};

export type GroupRequestMailData = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  dateISO: string;
  startTime: string;
  endTime: string;
  partySize: number;
  note: string | null;
};

// E-Mail-Programme ignorieren <style>-Blöcke oft – daher alles inline.
const C = {
  brown: "#7a5640",
  cream: "#faf5ea",
  creamDark: "#ecdfc4",
  teal: "#0b6e6e",
  orange: "#c94d28",
  navy: "#1b2740",
  muted: "#5b6472",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function appUrl(path: string): string {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  return `${base}${path}`;
}

function dateLabel(dateISO: string): string {
  return `${formatWeekdayDe(dateISO)}, ${formatDateDeCH(dateISO)}`;
}

function personsLabel(count: number): string {
  return `${count} ${count === 1 ? "Person" : "Personen"}`;
}

function layout(title: string, body: string): string {
  const footer = [
    RESTAURANT_INFO.name,
    RESTAURANT_INFO.addressLine,
    RESTAURANT_INFO.phone,
    RESTAURANT_INFO.email,
  ]
    .map(escapeHtml)
    .join(" · ");

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${C.cream};font-family:Arial,Helvetica,sans-serif;color:${C.navy};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:${C.brown};padding:20px 28px;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold;">Piazza <span style="color:${C.creamDark};">106</span></td></tr>
<tr><td style="padding:28px;">${body}</td></tr>
<tr><td style="padding:18px 28px;background:${C.cream};font-size:12px;line-height:1.5;color:${C.muted};">${footer}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.3;color:${C.navy};">${escapeHtml(text)}</h1>`;
}

/** `html` muss bereits sicher sein (Benutzereingaben vorher mit escapeHtml). */
function paragraph(html: string): string {
  return `<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${C.navy};">${html}</p>`;
}

function smallNote(html: string): string {
  return `<p style="margin:18px 0 0;font-size:13px;line-height:1.5;color:${C.muted};">${html}</p>`;
}

function codeBox(code: string): string {
  return `<div style="margin:0 0 20px;padding:16px;border:2px dashed ${C.teal};border-radius:12px;text-align:center;">
<div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${C.muted};">Bestätigungscode</div>
<div style="margin-top:4px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;letter-spacing:2px;color:${C.teal};">${escapeHtml(code)}</div>
</div>`;
}

function details(rows: [string, string][]): string {
  const cells = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px 8px 0;font-size:13px;color:${C.muted};vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:8px 0;font-size:15px;font-weight:bold;color:${C.navy};">${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;border-top:1px solid ${C.creamDark};border-bottom:1px solid ${C.creamDark};">${cells}</table>`;
}

function button(label: string, href: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;background:${C.orange};color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;border-radius:10px;">${escapeHtml(label)}</a>`;
}

function textFooter(): string {
  return [
    "—",
    RESTAURANT_INFO.name,
    RESTAURANT_INFO.addressLine,
    `${RESTAURANT_INFO.phone} · ${RESTAURANT_INFO.email}`,
  ].join("\n");
}

function textRows(rows: [string, string][]): string {
  return rows.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function groupRows(d: GroupRequestMailData): [string, string][] {
  const rows: [string, string][] = [
    ["Datum", dateLabel(d.dateISO)],
    ["Uhrzeit", `${d.startTime} – ${d.endTime} Uhr`],
    ["Personen", personsLabel(d.partySize)],
  ];
  if (d.note) rows.push(["Anmerkung", d.note]);
  return rows;
}

/** An den Gast, sobald eine Reservation bestätigt ist (online oder vom Chef erfasst). */
export function reservationConfirmationEmail(d: ReservationMailData): MailContent {
  const rows: [string, string][] = [
    ["Datum", dateLabel(d.dateISO)],
    ["Uhrzeit", `${d.startTime} – ${d.endTime} Uhr`],
    ["Tisch", `Tisch ${d.tableNumber}`],
    ["Personen", personsLabel(d.partySize)],
  ];
  if (d.note) rows.push(["Anmerkung", d.note]);
  const manageUrl = appUrl("/meine-reservationen");

  const html = layout(
    "Reservationsbestätigung",
    [
      heading("Ihre Reservation ist bestätigt"),
      paragraph(
        `Guten Tag ${escapeHtml(d.customerName)}<br>vielen Dank für Ihre Reservation – wir freuen uns auf Ihren Besuch!`,
      ),
      codeBox(d.code),
      details(rows),
      paragraph(
        "Mit Ihrer E-Mail-Adresse und dem Bestätigungscode können Sie Ihre Reservation jederzeit online einsehen oder stornieren.",
      ),
      button("Meine Reservation", manageUrl),
      smallNote(`Für Änderungen erreichen Sie uns telefonisch unter ${escapeHtml(RESTAURANT_INFO.phone)}.`),
    ].join(""),
  );

  const text = [
    `Guten Tag ${d.customerName}`,
    "",
    "vielen Dank für Ihre Reservation – wir freuen uns auf Ihren Besuch!",
    "",
    `Bestätigungscode: ${d.code}`,
    textRows(rows),
    "",
    `Reservation einsehen oder stornieren: ${manageUrl}`,
    "",
    textFooter(),
  ].join("\n");

  return {
    subject: `Reservationsbestätigung ${RESTAURANT_INFO.name} – ${formatDateDeCH(d.dateISO)}, ${d.startTime} Uhr`,
    html,
    text,
  };
}

/** An den Gast: Gruppenanfrage ist eingegangen (noch keine verbindliche Reservation). */
export function groupRequestReceivedEmail(d: GroupRequestMailData): MailContent {
  const rows = groupRows(d);
  const html = layout(
    "Anfrage erhalten",
    [
      heading("Ihre Anfrage ist bei uns eingegangen"),
      paragraph(
        `Guten Tag ${escapeHtml(d.customerName)}<br>vielen Dank für Ihre Anfrage. Wir prüfen die Verfügbarkeit und melden uns so rasch wie möglich telefonisch oder per E-Mail bei Ihnen.`,
      ),
      details(rows),
      smallNote("Bitte beachten Sie: Dies ist noch keine verbindliche Reservation."),
    ].join(""),
  );
  const text = [
    `Guten Tag ${d.customerName}`,
    "",
    "vielen Dank für Ihre Anfrage. Wir prüfen die Verfügbarkeit und melden uns so rasch wie möglich telefonisch oder per E-Mail bei Ihnen.",
    "",
    textRows(rows),
    "",
    "Bitte beachten Sie: Dies ist noch keine verbindliche Reservation.",
    "",
    textFooter(),
  ].join("\n");

  return {
    subject: `Ihre Anfrage bei ${RESTAURANT_INFO.name} – ${formatDateDeCH(d.dateISO)}`,
    html,
    text,
  };
}

/** An das Restaurant: Hinweis auf eine neue Gruppenanfrage. */
export function groupRequestAdminEmail(d: GroupRequestMailData): MailContent {
  const rows: [string, string][] = [
    ...groupRows(d),
    ["Name", d.customerName],
    ["Telefon", d.customerPhone],
    ["E-Mail", d.customerEmail],
  ];
  const adminUrl = appUrl("/admin/anfragen");
  const html = layout(
    "Neue Gruppenanfrage",
    [
      heading(`Neue Gruppenanfrage: ${personsLabel(d.partySize)}`),
      paragraph("Über die Website ist eine neue Anfrage eingegangen."),
      details(rows),
      button("Anfrage bearbeiten", adminUrl),
    ].join(""),
  );
  const text = [
    "Über die Website ist eine neue Gruppenanfrage eingegangen.",
    "",
    textRows(rows),
    "",
    `Bearbeiten: ${adminUrl}`,
  ].join("\n");

  return {
    subject: `Neue Gruppenanfrage: ${personsLabel(d.partySize)} am ${formatDateDeCH(d.dateISO)}`,
    html,
    text,
  };
}

/** An den Gast, wenn der Chef die Gruppenanfrage ablehnt. */
export function groupRequestDeclinedEmail(d: GroupRequestMailData): MailContent {
  const rows = groupRows(d);
  const html = layout(
    "Ihre Anfrage",
    [
      heading("Ihre Anfrage"),
      paragraph(
        `Guten Tag ${escapeHtml(d.customerName)}<br>leider können wir Ihre Anfrage für den folgenden Termin nicht bestätigen.`,
      ),
      details(rows),
      paragraph(
        `Gerne finden wir einen anderen Termin für Sie – rufen Sie uns an unter ${escapeHtml(RESTAURANT_INFO.phone)}.`,
      ),
    ].join(""),
  );
  const text = [
    `Guten Tag ${d.customerName}`,
    "",
    "leider können wir Ihre Anfrage für den folgenden Termin nicht bestätigen.",
    "",
    textRows(rows),
    "",
    `Gerne finden wir einen anderen Termin für Sie – rufen Sie uns an unter ${RESTAURANT_INFO.phone}.`,
    "",
    textFooter(),
  ].join("\n");

  return {
    subject: `Ihre Anfrage bei ${RESTAURANT_INFO.name} – ${formatDateDeCH(d.dateISO)}`,
    html,
    text,
  };
}
