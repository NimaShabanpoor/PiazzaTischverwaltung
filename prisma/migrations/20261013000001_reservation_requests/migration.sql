-- Online-Reservationen sind ab jetzt Anfragen: Sie werden erst nach der
-- Freigabe durch das Restaurant zu einer gueltigen Reservation.
-- ANGEFRAGT = wartet auf Entscheidung, ABGELEHNT = vom Restaurant abgelehnt.
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'ANGEFRAGT';
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'ABGELEHNT';

-- Geheimer Code fuer den Freigabe-Link in der Anfrage-Mail (einmalig nutzbar).
ALTER TABLE "reservations"
  ADD COLUMN "decisionToken" TEXT,
  ADD COLUMN "decidedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "reservations_decisionToken_key" ON "reservations"("decisionToken");
