/**
 * Seeds the clinic catalogue: specialties + a set of ready-made demo doctors so
 * a freshly signed-up patient immediately has doctors to browse and book.
 *
 * Each demo doctor is a full account (a `users` row with role 'doctor' linked to
 * a `doctors` profile) plus Mon–Fri working hours — only doctors with a linked
 * account are listed by the API, and only doctors with availability are bookable.
 *
 * Re-running is safe: everything is upserted (users by email, doctors by
 * user_id) and working hours are replaced, so it never duplicates rows. It does
 * NOT delete patient accounts or appointments.
 *
 *   npm run migrate   # once, to create the schema
 *   npm run seed
 */
import { eq, sql } from "drizzle-orm";
import { db, pool } from "../db/client";
import { hashPassword } from "../auth";
import {
  doctorAvailability,
  doctors,
  specialties,
  users,
} from "../db/schema";

const SPECIALTIES = [
  { name: "General Practice", description: "Everyday health concerns and check-ups." },
  { name: "Cardiology", description: "Heart and cardiovascular care." },
  { name: "Dermatology", description: "Skin, hair and nail conditions." },
  { name: "Pediatrics", description: "Healthcare for infants and children." },
  { name: "Orthopedics", description: "Bones, joints and muscles." },
];

/** Shared login password for every demo doctor account. */
const DEMO_PASSWORD = "doctor123";

const DOCTORS = [
  {
    name: "Dr. Sarah Chen",
    email: "sarah.chen@medibook.demo",
    specialty: "General Practice",
    fee: 60,
    slot: 30,
    bio: "Family physician focused on preventive care and long-term wellbeing.",
  },
  {
    name: "Dr. James Okafor",
    email: "james.okafor@medibook.demo",
    specialty: "Cardiology",
    fee: 150,
    slot: 30,
    bio: "Cardiologist with a special interest in hypertension and heart health.",
  },
  {
    name: "Dr. Maria Rossi",
    email: "maria.rossi@medibook.demo",
    specialty: "Dermatology",
    fee: 120,
    slot: 20,
    bio: "Dermatologist treating skin, hair and nail conditions of all ages.",
  },
  {
    name: "Dr. Aisha Khan",
    email: "aisha.khan@medibook.demo",
    specialty: "Pediatrics",
    fee: 90,
    slot: 30,
    bio: "Pediatrician caring for infants, children and adolescents.",
  },
  {
    name: "Dr. David Mueller",
    email: "david.mueller@medibook.demo",
    specialty: "Orthopedics",
    fee: 130,
    slot: 45,
    bio: "Orthopedic specialist for bones, joints, sports and mobility issues.",
  },
];

/** Mon–Fri, 09:00–17:00 (Postgres dow: 0=Sun … 6=Sat). */
const WORK_WEEKDAYS = [1, 2, 3, 4, 5];
const WORK_START = "09:00";
const WORK_END = "17:00";

async function main() {
  console.log("Seeding specialties…");
  await db
    .insert(specialties)
    .values(SPECIALTIES)
    .onConflictDoUpdate({
      target: specialties.name,
      set: { description: sql`excluded.description` },
    });

  // Map specialty name -> id so we can link doctors.
  const specRows = await db
    .select({ id: specialties.id, name: specialties.name })
    .from(specialties);
  const specialtyId = new Map(specRows.map((s) => [s.name, s.id]));

  const password_hash = await hashPassword(DEMO_PASSWORD);

  console.log("Seeding demo doctors…");
  for (const d of DOCTORS) {
    // 1) The login account (role 'doctor'). Upsert by email.
    const [user] = await db
      .insert(users)
      .values({
        email: d.email,
        password_hash,
        full_name: d.name,
        role: "doctor",
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { full_name: d.name, role: "doctor", password_hash },
      })
      .returning({ id: users.id });

    // 2) The bookable profile, linked to the account. Upsert by user_id.
    const [doctor] = await db
      .insert(doctors)
      .values({
        user_id: user.id,
        name: d.name,
        specialty_id: specialtyId.get(d.specialty) ?? null,
        bio: d.bio,
        photo_url: `https://i.pravatar.cc/300?u=${encodeURIComponent(d.email)}`,
        consultation_fee: d.fee.toFixed(2),
        slot_duration_minutes: d.slot,
        is_active: true,
      })
      .onConflictDoUpdate({
        target: doctors.user_id,
        set: {
          name: d.name,
          specialty_id: specialtyId.get(d.specialty) ?? null,
          bio: d.bio,
          photo_url: `https://i.pravatar.cc/300?u=${encodeURIComponent(d.email)}`,
          consultation_fee: d.fee.toFixed(2),
          slot_duration_minutes: d.slot,
          is_active: true,
        },
      })
      .returning({ id: doctors.id });

    // 3) Replace weekly working hours so re-runs stay clean.
    await db
      .delete(doctorAvailability)
      .where(eq(doctorAvailability.doctor_id, doctor.id));
    await db.insert(doctorAvailability).values(
      WORK_WEEKDAYS.map((weekday) => ({
        doctor_id: doctor.id,
        weekday,
        start_time: WORK_START,
        end_time: WORK_END,
      })),
    );
  }

  console.log(
    `\nDone. Seeded ${SPECIALTIES.length} specialties and ${DOCTORS.length} demo doctors.`,
  );
  console.log(`Doctor logins (password: ${DEMO_PASSWORD}):`);
  for (const d of DOCTORS) console.log(`  • ${d.email}  — ${d.name}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
