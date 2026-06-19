import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Drizzle table definitions. These mirror server/src/db/init.sql, which is the
 * authoritative DDL (it also adds the btree_gist exclusion constraint that
 * makes double-booking impossible — something Drizzle's schema DSL can't yet
 * express). Column keys are kept snake_case so query results match the JSON
 * shapes the frontend already expects.
 */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  full_name: text("full_name"),
  phone: text("phone"),
  role: text("role").notNull().default("patient"),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const specialties = pgTable("specialties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const doctors = pgTable("doctors", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  specialty_id: uuid("specialty_id").references(() => specialties.id, {
    onDelete: "set null",
  }),
  bio: text("bio"),
  photo_url: text("photo_url"),
  consultation_fee: numeric("consultation_fee", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  slot_duration_minutes: integer("slot_duration_minutes").notNull().default(30),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const doctorAvailability = pgTable("doctor_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  doctor_id: uuid("doctor_id")
    .notNull()
    .references(() => doctors.id, { onDelete: "cascade" }),
  weekday: smallint("weekday").notNull(),
  start_time: time("start_time").notNull(),
  end_time: time("end_time").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const doctorTimeOff = pgTable("doctor_time_off", {
  id: uuid("id").primaryKey().defaultRandom(),
  doctor_id: uuid("doctor_id")
    .notNull()
    .references(() => doctors.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  reason: text("reason"),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  doctor_id: uuid("doctor_id")
    .notNull()
    .references(() => doctors.id, { onDelete: "cascade" }),
  patient_id: uuid("patient_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  patient_name: text("patient_name").notNull(),
  reason: text("reason"),
  starts_at: timestamp("starts_at", { withTimezone: true }).notNull(),
  ends_at: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("pending"),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
