-- Verhindert Doppelbuchungen auf Datenbankebene:
-- Für denselben Tisch dürfen sich keine zwei aktiven Reservationen
-- (CONFIRMED oder ARRIVED) zeitlich überlappen.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "reservations"
  ADD CONSTRAINT reservations_no_overlap
  EXCLUDE USING gist (
    "tableId" WITH =,
    tsrange("start", "end") WITH &&
  )
  WHERE ("status" IN ('CONFIRMED', 'ARRIVED'));
