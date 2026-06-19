/**
 * Seeds the clinic catalogue: specialties only. Doctors are no longer seeded —
 * the listing shows real doctors who register an account. Re-running this is
 * safe and never touches doctors or appointments.
 *
 *   npm run migrate   # once, to create the schema
 *   npm run seed
 */
import { sql } from "drizzle-orm";
import { db, pool } from "../db/client";
import { specialties } from "../db/schema";

const SPECIALTIES = [
  { name: "General Practice", description: "Everyday health concerns and check-ups." },
  { name: "Cardiology", description: "Heart and cardiovascular care." },
  { name: "Dermatology", description: "Skin, hair and nail conditions." },
  { name: "Pediatrics", description: "Healthcare for infants and children." },
  { name: "Orthopedics", description: "Bones, joints and muscles." },
];

async function main() {
  console.log("Seeding specialties…");
  await db
    .insert(specialties)
    .values(SPECIALTIES)
    .onConflictDoUpdate({
      target: specialties.name,
      set: { description: sql`excluded.description` },
    });

  console.log(`\nDone. Seeded ${SPECIALTIES.length} specialties.`);
  console.log("No doctors are seeded — register a doctor account to add one.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
