import { Router } from "express";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db } from "../db/client";
import { doctorAvailability, doctors, specialties } from "../db/schema";
import { asyncHandler, HttpError } from "../lib/http";
import { slotsQuerySchema } from "../lib/validation";
import { getAvailableSlots } from "../services/availability";

export const catalogRouter = Router();

const doctorColumns = {
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
};

type DoctorRow = {
  consultation_fee: string;
  specialty_id: string | null;
  specialty_name: string | null;
} & Record<string, unknown>;

/** Shapes a joined row into the DoctorWithSpecialty JSON the frontend expects. */
function toDoctor(row: DoctorRow) {
  const { specialty_name, consultation_fee, ...doctor } = row;
  return {
    ...doctor,
    consultation_fee: Number(consultation_fee),
    specialty: doctor.specialty_id
      ? { id: doctor.specialty_id, name: specialty_name }
      : null,
  };
}

catalogRouter.get(
  "/specialties",
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select()
      .from(specialties)
      .orderBy(asc(specialties.name));
    res.json(rows);
  }),
);

catalogRouter.get(
  "/doctors",
  asyncHandler(async (req, res) => {
    const specialtyId =
      typeof req.query.specialtyId === "string" ? req.query.specialtyId : null;

    // Only doctors with a linked account are listed — seeded/unlinked rows hidden.
    const where = specialtyId
      ? and(
          isNotNull(doctors.user_id),
          eq(doctors.is_active, true),
          eq(doctors.specialty_id, specialtyId),
        )
      : and(isNotNull(doctors.user_id), eq(doctors.is_active, true));

    const rows = await db
      .select(doctorColumns)
      .from(doctors)
      .leftJoin(specialties, eq(doctors.specialty_id, specialties.id))
      .where(where)
      .orderBy(asc(doctors.name));

    res.json(rows.map(toDoctor));
  }),
);

catalogRouter.get(
  "/doctors/:id",
  asyncHandler(async (req, res) => {
    const [row] = await db
      .select(doctorColumns)
      .from(doctors)
      .leftJoin(specialties, eq(doctors.specialty_id, specialties.id))
      .where(and(eq(doctors.id, req.params.id), isNotNull(doctors.user_id)));

    if (!row) throw new HttpError(404, "Doctor not found.");
    res.json(toDoctor(row));
  }),
);

catalogRouter.get(
  "/doctors/:id/availability",
  asyncHandler(async (req, res) => {
    const rows = await db
      .select()
      .from(doctorAvailability)
      .where(eq(doctorAvailability.doctor_id, req.params.id))
      .orderBy(asc(doctorAvailability.weekday), asc(doctorAvailability.start_time));
    res.json(rows);
  }),
);

catalogRouter.get(
  "/doctors/:id/slots",
  asyncHandler(async (req, res) => {
    const parsed = slotsQuerySchema.safeParse(req.query);
    if (!parsed.success) throw new HttpError(400, "Invalid date.");
    res.json(await getAvailableSlots(req.params.id, parsed.data.date));
  }),
);
