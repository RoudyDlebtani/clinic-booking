import { z } from "zod";

const uuid = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Invalid id",
  );
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");
const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time");

export const signupSchema = z.object({
  fullName: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(1, "Name is required").max(120),
  ),
  email: z.string().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
  role: z.enum(["patient", "doctor"]).default("patient"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const bookSchema = z.object({
  doctorId: uuid,
  date: isoDate,
  startTime: time,
  reason: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null),
    z.string().max(500, "Reason is too long").nullable(),
  ),
});

export const slotsQuerySchema = z.object({ date: isoDate });

export const doctorProfileSchema = z.object({
  name: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(1, "Name is required").max(120),
  ),
  specialtyId: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null),
    uuid.nullable(),
  ),
  bio: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null),
    z.string().max(1000, "Bio is too long").nullable(),
  ),
  consultationFee: z.coerce.number().min(0, "Fee can't be negative").max(100000),
  slotDurationMinutes: z.coerce
    .number()
    .int()
    .min(5, "Visit must be at least 5 minutes")
    .max(240, "Visit can't exceed 240 minutes"),
  isActive: z.boolean().default(true),
});

export const availabilitySchema = z.object({
  windows: z
    .array(
      z
        .object({
          weekday: z.coerce.number().int().min(0).max(6),
          startTime: time,
          endTime: time,
        })
        .refine((w) => w.startTime < w.endTime, {
          message: "Start time must be before end time",
        }),
    )
    .max(100),
});

export const appointmentStatusSchema = z.object({
  status: z.enum(["accepted", "declined", "completed"]),
});
