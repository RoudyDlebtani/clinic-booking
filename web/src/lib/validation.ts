import { z } from "zod";

/**
 * Result returned by every Server Action. Lets client forms surface a real
 * error message instead of silently swallowing failures.
 */
export type ActionResult = { ok: true } | { ok: false; error: string };

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time");

export const bookSchema = z.object({
  doctorId: z.string().uuid("Invalid doctor"),
  date: isoDate,
  startTime: time,
  reason: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null),
    z.string().max(500, "Reason is too long").nullable(),
  ),
});

export const cancelSchema = z.object({
  appointmentId: z.string().uuid("Invalid appointment"),
});

export const profileSchema = z.object({
  fullName: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(1, "Name is required").max(120),
  ),
  phone: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null),
    z.string().max(30).nullable(),
  ),
});
