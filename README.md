# Piazza 106 – Tischreservierung

Tischreservierungs- und Tischverwaltungssystem für das Restaurant **Piazza 106**
in Zürich. Verwaltet maximal 4 Tische, verhindert Doppelbuchungen zuverlässig
(inkl. Datenbank-Constraint) und bietet einen geschützten, tablet-tauglichen
Admin-Bereich für den Chef.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **PostgreSQL** (getestet mit [Neon](https://neon.tech)) + **Prisma 6**
- Server Actions statt eigener REST-API (moderner Next.js-Standard) – Login,
  Reservationen und Tischverwaltung laufen serverseitig, direkt aus den
  Formularen/Komponenten aufgerufen.
- Auth: eigener, schlanker Session-Cookie (JWT via `jose`, Passwort-Hash via
  `bcryptjs`) – bewusst ohne grosses Auth-Framework, da nur ein Admin-Login
  benötigt wird.

## Schnellstart

```bash
npm install
cp .env.example .env
# .env ausfüllen: DATABASE_URL, DIRECT_URL, SESSION_SECRET, ADMIN_PASSWORD
npx prisma migrate deploy
npm run db:seed
npm run dev
```

App läuft danach auf http://localhost:3000, Admin-Bereich auf
http://localhost:3000/admin.

### Datenbank

Jede PostgreSQL-Datenbank funktioniert. Für den Doppelbuchungsschutz auf
Datenbankebene wird die Extension `btree_gist` benötigt (wird durch die
Migration `20260914080400_no_overlap_constraint` automatisch aktiviert –
funktioniert bei den meisten gehosteten Postgres-Anbietern, inkl. Neon, ohne
weiteres Zutun).

`DIRECT_URL` sollte eine Verbindung **ohne** Connection-Pooler sein (Prisma
Migrate benötigt das); `DATABASE_URL` darf/soll die gepoolte Verbindung sein.
Falls dein Anbieter keinen separaten Pooler hat, einfach denselben Wert für
beide verwenden.

### Admin-Zugang

Der Seed-Lauf (`npm run db:seed`) legt genau 4 Tische (falls noch nicht
vorhanden) sowie einen Admin-Benutzer an, mit den in `.env` hinterlegten
`ADMIN_USERNAME` / `ADMIN_PASSWORD`. Danach kann das Passwort **nicht** über
die Oberfläche geändert werden (bewusst einfach gehalten) – dazu `.env`
anpassen und `npm run db:seed` erneut ausführen (überschreibt nur das
Passwort des bestehenden Benutzers, legt keine neuen Tische an).

## Funktionsübersicht

**Kundenbereich (`/reservieren`)**
Datum → Von/Bis-Zeit → Personenzahl → Tisch → Kontaktdaten → Bestätigung.
Jeder Schritt prüft serverseitig erneut (Zod), die Tischauswahl zeigt nur
wirklich verfügbare Tische an und aktualisiert sich live. Nach der Buchung
erhält der Gast eine **Bestätigungs-E-Mail** (siehe „E-Mail-Versand“).

Online können höchstens **4 Personen** (`MAX_ONLINE_PARTY_SIZE`) direkt
reservieren. Grössere Gruppen überspringen die Tischauswahl und senden eine
**Anfrage** an den Chef.

**Meine Reservation (`/meine-reservationen`)** – ohne Konto: E-Mail +
Bestätigungscode eingeben, eigene Reservationen sehen und stornieren.

**Admin-Bereich (`/admin`)**
- **Tischübersicht** – alle 4 Tische grafisch, Status auf einen Blick, Klick
  öffnet Details + Aktionen (besetzt markieren, freigeben, sperren, neue
  Reservation, Gast als angekommen markieren, bearbeiten, stornieren,
  löschen).
- **Tagesübersicht** – chronologische Liste aller Reservationen eines Tages,
  mit Tageswechsel und manueller Erfassung telefonischer Reservationen.
- **Anfragen** – Gruppenanfragen (ab 5 Personen) mit Zähler in der
  Navigation. „Als Reservation erfassen“ öffnet das vorausgefüllte Formular
  (der Chef darf dabei mehr Personen eintragen als der Tisch Plätze hat),
  „Ablehnen“ informiert den Gast per E-Mail.
- **Tische** – Tischnummer, Sitzplätze und Aktiv-Status der 4 Tische
  anpassen. Es können nie mehr als 4 Tische existieren (kein "Hinzufügen"
  vorgesehen).
- **Statistik** – Auslastung, Stosszeiten, Online- vs. Telefon-Anteil.

### E-Mail-Versand

Versendet werden: Reservationsbestätigung (online und vom Chef erfasst),
Eingangsbestätigung einer Gruppenanfrage, Absage einer Anfrage und optional
ein Hinweis an das Restaurant bei neuen Anfragen (`ADMIN_NOTIFY_EMAIL`).

Der Versand läuft über SMTP (`nodemailer`) und funktioniert mit dem Postfach
des Webhosters, Gmail (App-Passwort) oder Outlook. Dafür in `.env`
`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` und
`APP_URL` setzen (siehe `.env.example`). Sind die Werte leer, werden keine
E-Mails verschickt – Reservationen funktionieren trotzdem. Mails werden erst
nach der Antwort an den Browser versendet (`after`), eine langsame oder
fehlerhafte Mail verzögert also keine Buchung.

**Doppelbuchungsschutz**
Zweistufig: (1) Anwendungslogik prüft Überschneidungen unmittelbar vor dem
Speichern, (2) eine PostgreSQL-Exclusion-Constraint verhindert
überschneidende aktive Reservationen pro Tisch *garantiert*, auch bei
gleichzeitigen Anfragen.

## Bekannte Vereinfachungen (bewusst, siehe Aufgabenstellung "einfach halten")

- Ein einzelner Admin-Benutzer (kein Rollen-/Rechtesystem).
- Adresse/Telefon auf der Startseite und in den E-Mails sind Platzhalter –
  bitte in `src/lib/constants.ts` (`RESTAURANT_INFO`) anpassen.
- Gruppen werden nicht automatisch auf mehrere Tische verteilt: Der Chef
  erfasst die Reservation auf einem Tisch und sperrt/reserviert bei Bedarf
  den zweiten Tisch selbst.

## Nützliche Skripte

```bash
npm run dev        # Entwicklungsserver
npm run build      # Produktions-Build
npm run start      # Produktions-Server
npm run db:seed    # 4 Tische + Admin-Benutzer anlegen/aktualisieren
npm run db:studio  # Prisma Studio (Datenbank-GUI)
```
