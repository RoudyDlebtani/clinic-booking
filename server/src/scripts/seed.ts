/**
 * Seeds the clinic catalogue: specialties, doctors and their weekly hours.
 * Re-running replaces the demo doctors (and, by cascade, their availability and
 * any appointments) so the data stays clean.
 *
 *   npm run migrate   # once, to create the schema
 *   npm run seed
 */
import { ne, sql } from "drizzle-orm";
import { db, pool } from "../db/client";
import { doctorAvailability, doctors, specialties, users } from "../db/schema";
import { hashPassword } from "../auth";

// A ready-to-use doctor login so the doctor side is testable out of the box.
const DEMO_DOCTOR = {
  email: "doctor@medibook.test",
  password: "password",
  // Linked to this seeded doctor so it arrives with a specialty + working hours.
  linkedDoctorName: "Dr. Sarah Chen",
};

const SPECIALTIES = [
  { name: "General Practice", description: "Everyday health concerns and check-ups." },
  { name: "Cardiology", description: "Heart and cardiovascular care." },
  { name: "Dermatology", description: "Skin, hair and nail conditions." },
  { name: "Pediatrics", description: "Healthcare for infants and children." },
  { name: "Orthopedics", description: "Bones, joints and muscles." },
];

// Weekday hours use Postgres dow: 1 = Mon … 5 = Fri.
const FULL_WEEK = [1, 2, 3, 4, 5];
const MORNING = { start_time: "09:00", end_time: "12:00" };
const AFTERNOON = { start_time: "13:00", end_time: "17:00" };

interface DoctorSeed {
  name: string;
  specialty: string;
  bio: string;
  fee: number;
  slot: number;
  weekdays: number[];
  windows: { start_time: string; end_time: string }[];
}

const DOCTORS: DoctorSeed[] = [
  {
    name: "Dr. Sarah Chen",
    specialty: "General Practice",
    bio: "Family physician with 12 years of experience in preventive care.",
    fee: 80,
    slot: 30,
    weekdays: FULL_WEEK,
    windows: [MORNING, AFTERNOON],
  },
  {
    name: "Dr. Marcus Reed",
    specialty: "Cardiology",
    bio: "Interventional cardiologist focused on heart-disease prevention.",
    fee: 200,
    slot: 45,
    weekdays: [1, 3, 5],
    windows: [{ start_time: "10:00", end_time: "15:00" }],
  },
  {
    name: "Dr. Aisha Khan",
    specialty: "Dermatology",
    bio: "Board-certified dermatologist treating skin and cosmetic concerns.",
    fee: 150,
    slot: 20,
    weekdays: [2, 4],
    windows: [MORNING, AFTERNOON],
  },
  {
    name: "Dr. Tom Alvarez",
    specialty: "Pediatrics",
    bio: "Gentle, parent-friendly care for newborns through teens.",
    fee: 100,
    slot: 30,
    weekdays: FULL_WEEK,
    windows: [{ start_time: "08:30", end_time: "13:00" }],
  },
  {
    name: "Dr. Elena Rossi",
    specialty: "Orthopedics",
    bio: "Sports-medicine specialist in joint and ligament injuries.",
    fee: 180,
    slot: 40,
    weekdays: [1, 2, 4],
    windows: [{ start_time: "09:00", end_time: "16:00" }],
  },
];

async function main() {
  console.log("Seeding specialties…");
  const inserted = await db
    .insert(specialties)
    .values(SPECIALTIES)
    .onConflictDoUpdate({
      target: specialties.name,
      set: { description: sql`excluded.description` },
    })
    .returning({ id: specialties.id, name: specialties.name });

  const specialtyId = new Map(inserted.map((s) => [s.name, s.id]));

  console.log("Ensuring the demo doctor login exists…");
  const password_hash = await hashPassword(DEMO_DOCTOR.password);
  const [demoUser] = await db
    .insert(users)
    .values({
      email: DEMO_DOCTOR.email,
      password_hash,
      full_name: DEMO_DOCTOR.linkedDoctorName,
      role: "doctor",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { password_hash, role: "doctor" },
    })
    .returning({ id: users.id });

  console.log("Clearing existing demo doctors…");
  // Delete every doctor (cascades to availability, time-off, appointments).
  await db.delete(doctors).where(ne(doctors.id, sql`'00000000-0000-0000-0000-000000000000'`));

  console.log("Seeding doctors and availability…");
  for (const d of DOCTORS) {
    const [doctor] = await db
      .insert(doctors)
      .values({
        name: d.name,
        // Link one seeded doctor to the demo login so it's testable end-to-end.
        user_id: d.name === DEMO_DOCTOR.linkedDoctorName ? demoUser.id : null,
        specialty_id: specialtyId.get(d.specialty) ?? null,
        bio: d.bio,
        consultation_fee: String(d.fee),
        slot_duration_minutes: d.slot,
      })
      .returning({ id: doctors.id });

    const rows = d.weekdays.flatMap((weekday) =>
      d.windows.map((w) => ({
        doctor_id: doctor.id,
        weekday,
        start_time: w.start_time,
        end_time: w.end_time,
      })),
    );
    await db.insert(doctorAvailability).values(rows);

    console.log(`  ✓ ${d.name} (${rows.length} availability windows)`);
  }

  console.log("\nDone. Seeded", DOCTORS.length, "doctors.");
  console.log(
    `Demo doctor login → ${DEMO_DOCTOR.email} / ${DEMO_DOCTOR.password}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
