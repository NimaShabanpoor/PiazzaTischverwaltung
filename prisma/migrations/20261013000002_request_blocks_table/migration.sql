-- Eine offene Anfrage haelt den Tisch: Solange sie nicht entschieden ist,
-- darf niemand sonst denselben Tisch im selben Zeitraum belegen.
-- (Eigene Migration, weil Postgres den neuen Enum-Wert nicht in derselben
-- Transaktion verwenden darf, in der er angelegt wurde.)
ALTER TABLE "reservations" DROP CONSTRAINT reservations_no_overlap;

ALTER TABLE "reservations"
  ADD CONSTRAINT reservations_no_overlap
  EXCLUDE USING gist (
    "tableId" WITH =,
    tsrange("start", "end") WITH &&
  )
  WHERE ("status" IN ('ANGEFRAGT', 'CONFIRMED', 'ARRIVED'));
