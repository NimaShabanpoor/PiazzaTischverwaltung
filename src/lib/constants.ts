// Zentrale Konfiguration für Piazza 106.
// Bewusst als Konstanten gehalten, damit die Anwendung einfach bleibt –
// keine zusätzliche Einstellungs-Oberfläche nötig.

/** Maximale Anzahl Tische, die das System jemals verwalten darf. */
export const MAX_TABLES = 4;

/**
 * Online können höchstens so viele Personen direkt reservieren. Grössere
 * Gruppen senden stattdessen eine Anfrage an den Chef.
 */
export const MAX_ONLINE_PARTY_SIZE = 4;

/** Obergrenze für Gruppenanfragen (reine Plausibilitätsprüfung). */
export const MAX_GROUP_REQUEST_SIZE = 30;

/**
 * Reservationen haben eine frei wählbare Von-Bis-Zeit (kein Fixraster mehr) –
 * so bleibt die restliche Zeit für andere Reservationen nutzbar.
 * Diese Werte steuern nur die Vorschläge im Formular bzw. die Mindestdauer.
 */
export const DEFAULT_RESERVATION_DURATION_MINUTES = 120;
export const MIN_RESERVATION_DURATION_MINUTES = 30;

/** Erste buchbare Uhrzeit (HH:mm), Restaurant-Öffnung. */
export const OPENING_TIME = "11:30";

/** Letzte Uhrzeit, zu der die Küche/Reservation endet (HH:mm). */
export const CLOSING_TIME = "14:00";

/** Raster für die Zeit-Auswahl in Minuten. */
export const TIME_SLOT_STEP_MINUTES = 30;

/** Zeitzone des Restaurants – für "heute"/"jetzt"-Berechnungen. */
export const RESTAURANT_TIMEZONE = "Europe/Zurich";

export const RESTAURANT_INFO = {
  name: "Piazza 106",
  city: "Zürich",
  addressLine: "Vulkanstrasse 106, 8048 Zürich",
  phone: "076 419 00 60",
  email: "reservierungen@piazza106events.ch",
};
