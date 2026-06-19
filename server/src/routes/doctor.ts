import { Router } from "express";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  appointments,
  doctorAvailability,
  doctors,
  specialties,
  users,
} from "../db/schema";
import { requireAuth, requireDoctor } from "../auth";
import { asyncHandler, HttpError } from "../lib/http";
import {
  appointmentStatusSchema,
  availabilitySchema,
  doctorProfileSchema,
  slotsQuerySchema,
} from "../lib/validation";
import { CLINIC_TIMEZONE } from "../lib/constants";

export const doctorRouter = Router();
doctorRouter.use(requireAuth, requireDoctor);

/** The signed-in doctor's own profile (incl. inactive) plus weekly hours. */
doctorRouter.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const [row] = await db
      .select({
        id: doctors.id,
        name: doctors.name,
        specialty_id: doctors.specialty_id,
        bio: doctors.bio,
        photo_url: doctors.photo_url,
        consultation_fee: doctors.consultation_fee,
        slot_duration_minutes: doctors.slot_duration_minutes,
        is_active: doctors.is_active,
        created_at: doctors.created_at,
        specialty_name: specialties.name,
      })
      .from(doctors)
      .leftJoin(specialties, eq(doctors.specialty_id, specialties.id))
      .where(eq(doctors.id, req.doctorId!));

    if (!row) throw new HttpError(404, "Doctor profile not found.");

    const availability = await db
      .select()
      .from(doctorAvailability)
      .where(eq(doctorAvailability.doctor_id, req.doctorId!))
      .orderBy(
        asc(doctorAvailability.weekday),
        asc(doctorAvailability.start_time),
      );

    const { specialty_name, consultation_fee, ...doctor } = row;
    res.json({
      ...doctor,
      consultation_fee: Number(consultation_fee),
      specialty: doctor.specialty_id
        ? { id: doctor.specialty_id, name: specialty_name }
        : null,
      availability,
    });
  }),
);

/** Updates the doctor's editable profile fields. */
doctorRouter.patch(
  "/profile",
  asyncHandler(async (req, res) => {
    const parsed = doctorProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid input");
    }
    const { name, specialtyId, bio, consultationFee, slotDurationMinutes, isActive } =
      parsed.data;

    await db
      .update(doctors)
      .set({
        name,
        specialty_id: specialtyId,
        bio,
        consultation_fee: String(consultationFee),
        slot_duration_minutes: slotDurationMinutes,
        is_active: isActive,
      })
      .where(eq(doctors.id, req.doctorId!));

    res.json({ ok: true });
  }),
);

/** Replaces the doctor's whole weekly availability with the supplied windows. */
doctorRouter.put(
  "/availability",
  asyncHandler(async (req, res) => {
    const parsed = availabilitySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid input");
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(doctorAvailability)
        .where(eq(doctorAvailability.doctor_id, req.doctorId!));
      if (parsed.data.windows.length > 0) {
        await tx.insert(doctorAvailability).values(
          parsed.data.windows.map((w) => ({
            doctor_id: req.doctorId!,
            weekday: w.weekday,
            start_time: w.startTime,
            end_time: w.endTime,
          })),
        );
      }
    });

    res.json({ ok: true });
  }),
);

/** The doctor's appointments, optionally limited to one clinic-local day. */
doctorRouter.get(
  "/appointments",
  asyncHandler(async (req, res) => {
    let where = eq(appointments.doctor_id, req.doctorId!);
    if (typeof req.query.date === "string") {
      const parsed = slotsQuerySchema.safeParse({ date: req.query.date });
      if (!parsed.success) throw new HttpError(400, "Invalid date.");
      where = and(
        where,
        sql`(${appointments.starts_at} at time zone ${CLINIC_TIMEZONE})::date = ${parsed.data.date}`,
      )!;
    }

    const rows = await db
      .select({
        id: appointments.id,
        patient_id: appointments.patient_id,
        patient_name: appointments.patient_name,
        patient_email: users.email,
        reason: appointments.reason,
        starts_at: appointments.starts_at,
        ends_at: appointments.ends_at,
        status: appointments.status,
        created_at: appointments.created_at,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.patient_id, users.id))
      .where(where)
      .orderBy(asc(appointments.starts_at));

    res.json(rows);
  }),
);

/** Accept / decline a pending request, or mark an accepted visit completed. */
doctorRouter.patch(
  "/appointments/:id",
  asyncHandler(async (req, res) => {
    const parsed = appointmentStatusSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid status.");
    const next = parsed.data.status;

    const [current] = await db
      .select({ status: appointments.status })
      .from(appointments)
      .where(
        and(
          eq(appointments.id, req.params.id),
          eq(appointments.doctor_id, req.doctorId!),
        ),
      );

    if (!current) throw new HttpError(404, "Appointment not found.");

    const allowed: Record<string, string[]> = {
      pending: ["accepted", "declined"],
      accepted: ["completed", "declined"],
    };
    if (!allowed[current.status]?.includes(next)) {
      throw new HttpError(
        400,
        `Can't change a ${current.status} appointment to ${next}.`,
      );
    }

    await db
      .update(appointments)
      .set({ status: next })
      .where(eq(appointments.id, req.params.id));

    res.json({ ok: true });
  }),
);
