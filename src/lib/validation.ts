import { z } from "zod";
import {
  MAX_GROUP_REQUEST_SIZE,
  MAX_ONLINE_PARTY_SIZE,
  MIN_RESERVATION_DURATION_MINUTES,
} from "./constants";
import { timeToMinutes } from "./time";

const dateISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum");
const timeHHmm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ungültige Uhrzeit");

const MIN_DURATION_MESSAGE = `Die Reservation muss mindestens ${MIN_RESERVATION_DURATION_MINUTES} Minuten dauern.`;
const ORDER_MESSAGE = "Die Bis-Zeit muss nach der Von-Zeit liegen.";

export const markOccupiedSchema = z
  .object({
    from: timeHHmm,
    until: timeHHmm,
  })
  .refine((d) => d.until > d.from, { message: ORDER_MESSAGE, path: ["until"] });

export const availabilityQuerySchema = z
  .object({
    date: dateISO,
    startTime: timeHHmm,
    endTime: timeHHmm,
    partySize: z.coerce.number().int().min(1).max(MAX_ONLINE_PARTY_SIZE),
  })
  .refine((d) => d.endTime > d.startTime, { message: ORDER_MESSAGE, path: ["endTime"] });

const ONLINE_LIMIT_MESSAGE = `Online können maximal ${MAX_ONLINE_PARTY_SIZE} Personen reserviert werden. Für grössere Gruppen senden Sie bitte eine Anfrage.`;

const reservationBaseSchema = z.object({
  tableId: z.string().min(1),
  date: dateISO,
  startTime: timeHHmm,
  endTime: timeHHmm,
  partySize: z.coerce.number().int().min(1).max(MAX_GROUP_REQUEST_SIZE),
  customerName: z.string().trim().min(2, "Bitte Namen angeben").max(120),
  customerPhone: z
    .string()
    .trim()
    .min(6, "Bitte gültige Telefonnummer angeben")
    .max(30)
    .regex(/^[0-9+()/.\-\s]+$/, "Ungültige Telefonnummer"),
  customerEmail: z.string().trim().email("Ungültige E-Mail-Adresse"),
  note: z.string().trim().max(500).optional(),
});

function hasMinDuration(startTime: string, endTime: string) {
  return timeToMinutes(endTime) - timeToMinutes(startTime) >= MIN_RESERVATION_DURATION_MINUTES;
}

export const createReservationSchema = reservationBaseSchema
  .refine((d) => d.partySize <= MAX_ONLINE_PARTY_SIZE, {
    message: ONLINE_LIMIT_MESSAGE,
    path: ["partySize"],
  })
  .refine((d) => d.endTime > d.startTime, { message: ORDER_MESSAGE, path: ["endTime"] })
  .refine((d) => hasMinDuration(d.startTime, d.endTime), {
    message: MIN_DURATION_MESSAGE,
    path: ["endTime"],
  });

export const groupRequestSchema = reservationBaseSchema
  .omit({ tableId: true })
  .extend({
    partySize: z.coerce
      .number()
      .int()
      .min(MAX_ONLINE_PARTY_SIZE + 1, `Anfragen sind für Gruppen ab ${MAX_ONLINE_PARTY_SIZE + 1} Personen gedacht.`)
      .max(MAX_GROUP_REQUEST_SIZE),
  })
  .refine((d) => d.endTime > d.startTime, { message: ORDER_MESSAGE, path: ["endTime"] })
  .refine((d) => hasMinDuration(d.startTime, d.endTime), {
    message: MIN_DURATION_MESSAGE,
    path: ["endTime"],
  });

export const adminCreateReservationSchema = reservationBaseSchema
  .extend({ source: z.enum(["ONLINE", "PHONE"]).default("PHONE") })
  .refine((d) => d.endTime > d.startTime, { message: ORDER_MESSAGE, path: ["endTime"] })
  .refine((d) => hasMinDuration(d.startTime, d.endTime), {
    message: MIN_DURATION_MESSAGE,
    path: ["endTime"],
  });

export const adminUpdateReservationSchema = z
  .object({
    tableId: z.string().min(1).optional(),
    date: dateISO.optional(),
    startTime: timeHHmm.optional(),
    endTime: timeHHmm.optional(),
    partySize: z.coerce.number().int().min(1).max(MAX_GROUP_REQUEST_SIZE).optional(),
    customerName: z.string().trim().min(2).max(120).optional(),
    customerPhone: z
      .string()
      .trim()
      .min(6)
      .max(30)
      .regex(/^[0-9+()/.\-\s]+$/)
      .optional(),
    customerEmail: z.string().trim().email().optional(),
    note: z.string().trim().max(500).nullable().optional(),
    status: z.enum(["CONFIRMED", "ARRIVED", "CANCELLED", "COMPLETED"]).optional(),
  })
  .refine((d) => (d.startTime === undefined) === (d.endTime === undefined), {
    message: "Von- und Bis-Zeit müssen gemeinsam angegeben werden.",
    path: ["endTime"],
  })
  .refine((d) => !d.startTime || !d.endTime || d.endTime > d.startTime, {
    message: ORDER_MESSAGE,
    path: ["endTime"],
  })
  .refine((d) => !d.startTime || !d.endTime || hasMinDuration(d.startTime, d.endTime), {
    message: MIN_DURATION_MESSAGE,
    path: ["endTime"],
  });

export const updateTableSchema = z.object({
  number: z.coerce.number().int().min(1).max(4).optional(),
  seats: z.coerce.number().int().min(1).max(MAX_GROUP_REQUEST_SIZE).optional(),
  active: z.boolean().optional(),
  status: z.enum(["FREI", "BESETZT", "GESPERRT"]).optional(),
  lockNote: z.string().trim().max(200).nullable().optional(),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});
