import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { addMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { db } from "../db/client";
import { appointments, doctors, specialties, users } from "../db/schema";
import { requireAuth } from "../auth";
import { asyncHandler, HttpError } from "../lib/http";
import { bookSchema } from "../lib/validation";
import { CLINIC_TIMEZONE } from "../lib/constants";

export const appointmentsRouter = Router();
appointmentsRouter.use(requireAuth);

/** Maps a joined row into the AppointmentWithDoctor shape the frontend expects. */
function toAppointment(row: Record<string, unknown>) {
  const {
    doctor_id,
    doctor_name,
    doctor_photo_url,
    doctor_specialty_name,
    ...appointment
  } = row;
  return {
    ...appointment,
    doctor_id,
    doctor: {
      id: doctor_id,
      name: doctor_name,
      photo_url: doctor_photo_url,
      specialty: doctor_specialty_name ? { name: doctor_specialty_name } : null,
    },
  };
}

appointmentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const rows = await db
      .select({
        id: appointments.id,
        doctor_id: appointments.doctor_id,
        patient_id: appointments.patient_id,
        patient_name: appointments.patient_name,
        reason: appointments.reason,
        starts_at: appointments.starts_at,
        ends_at: appointments.ends_at,
        status: appointments.status,
        created_at: appointments.created_at,
        doctor_name: doctors.name,
        doctor_photo_url: doctors.photo_url,
        doctor_specialty_name: specialties.name,
      })
      .from(appointments)
      .leftJoin(doctors, eq(appointments.doctor_id, doctors.id))
      .leftJoin(specialties, eq(doctors.specialty_id, specialties.id))
      .where(eq(appointments.patient_id, req.userId!))
      .orderBy(desc(appointments.starts_at));

    res.json(rows.map(toAppointment));
  }),
);

appointmentsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = bookSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid input");
    }
    const { doctorId, date, startTime, reason } = parsed.data;

    const [doctor] = await db
      .select({
        slot: doctors.slot_duration_minutes,
        active: doctors.is_active,
      })
      .from(doctors)
      .where(eq(doctors.id, doctorId));

    if (!doctor) throw new HttpError(404, "Doctor not found.");
    if (!doctor.active) {
      throw new HttpError(400, "This doctor is not accepting appointments.");
    }

    // Interpret the wall-clock date+time in the clinic timezone, store UTC.
    const startsAt = fromZonedTime(`${date} ${startTime}`, CLINIC_TIMEZONE);
    if (Number.isNaN(startsAt.getTime())) {
      throw new HttpError(400, "Invalid date or time.");
    }
    const endsAt = addMinutes(startsAt, doctor.slot);
    if (startsAt.getTime() < Date.now()) {
      throw new HttpError(400, "That time is in the past.");
    }

    const [profile] = await db
      .select({ full_name: users.full_name })
      .from(users)
      .where(eq(users.id, req.userId!));

    try {
      const [appointment] = await db
        .insert(appointments)
        .values({
          doctor_id: doctorId,
          patient_id: req.userId!,
          patient_name: profile?.full_name ?? "Patient",
          reason,
          starts_at: startsAt,
          ends_at: endsAt,
        })
        .returning();
      res.status(201).json(appointment);
    } catch (err) {
      // The exclusion constraint is the final guard against double-booking.
      const code =
        (err as { code?: string })?.code ??
        (err as { cause?: { code?: string } })?.cause?.code;
      if (code === "23P01") {
        throw new HttpError(
          409,
          "Sorry, that slot was just taken. Please pick another.",
        );
      }
      throw err;
    }
  }),
);

appointmentsRouter.patch(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const updated = await db
      .update(appointments)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(appointments.id, req.params.id),
          eq(appointments.patient_id, req.userId!),
        ),
      )
      .returning({ id: appointments.id });

    if (updated.length === 0) throw new HttpError(404, "Appointment not found.");
    res.json({ ok: true });
  }),
);
