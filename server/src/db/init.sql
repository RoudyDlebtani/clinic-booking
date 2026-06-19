-- =============================================================
-- MediBook — Clinic Appointment System (self-hosted Postgres)
-- Authoritative schema. Run via `npm run migrate`.
-- Authorization is enforced by the API (JWT), so there are no RLS
-- policies or SECURITY DEFINER functions here — the booking logic that
-- used to live in SQL now lives in the Express API. The one thing kept
-- in the database is the exclusion constraint, because only the database
-- can guarantee no double-booking under concurrent requests.
-- =============================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists btree_gist;  -- exclusion constraint below

-- ---------- Auth ----------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  full_name     text,
  phone         text,
  role          text not null default 'patient' check (role in ('patient', 'doctor')),
  created_at    timestamptz not null default now()
);

-- Account type. Existing databases predate this column.
alter table users add column if not exists role text not null default 'patient';
alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check check (role in ('patient', 'doctor'));

-- ---------- Reference data (the clinic catalogue) ----------
create table if not exists specialties (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists doctors (
  id                    uuid primary key default gen_random_uuid(),
  -- Links a doctor profile to its login. NULL for the seeded demo doctors.
  user_id               uuid unique references users (id) on delete cascade,
  name                  text not null,
  specialty_id          uuid references specialties (id) on delete set null,
  bio                   text,
  photo_url             text,
  consultation_fee      numeric(10, 2) not null default 0 check (consultation_fee >= 0),
  slot_duration_minutes int not null default 30 check (slot_duration_minutes between 5 and 240),
  is_active             boolean not null default true,
  created_at            timestamptz not null default now()
);

-- Doctor-account link. Existing databases predate this column.
alter table doctors add column if not exists user_id uuid references users (id) on delete cascade;
create unique index if not exists doctors_user_id_idx on doctors (user_id);

-- Recurring weekly working hours. weekday uses Postgres' dow convention:
-- 0 = Sunday ... 6 = Saturday. Times are in the clinic's local timezone.
create table if not exists doctor_availability (
  id         uuid primary key default gen_random_uuid(),
  doctor_id  uuid not null references doctors (id) on delete cascade,
  weekday    smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time   time not null,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);

-- One-off days a doctor is unavailable (holiday, conference, sick day).
create table if not exists doctor_time_off (
  id         uuid primary key default gen_random_uuid(),
  doctor_id  uuid not null references doctors (id) on delete cascade,
  date       date not null,
  reason     text,
  created_at timestamptz not null default now(),
  unique (doctor_id, date)
);

create table if not exists appointments (
  id           uuid primary key default gen_random_uuid(),
  doctor_id    uuid not null references doctors (id) on delete cascade,
  patient_id   uuid not null references users (id) on delete cascade,
  patient_name text not null,
  reason       text,
  -- Filled in when a patient cancels, explaining why (shown to the doctor).
  cancellation_reason text,
  -- Always stored in UTC. The API converts to/from the clinic timezone.
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  -- Lifecycle: a patient's request starts 'pending'; the doctor accepts
  -- ('accepted'), declines ('declined') or later marks it 'completed'. The
  -- patient may 'cancel' their own request. 'declined'/'cancelled' free the slot.
  status       text not null default 'pending',
  created_at   timestamptz not null default now(),
  check (starts_at < ends_at)
);

-- Cancellation reason. Existing databases predate this column.
alter table appointments add column if not exists cancellation_reason text;

-- Status set + default. Named so it can be evolved idempotently on existing DBs.
alter table appointments alter column status set default 'pending';
alter table appointments drop constraint if exists appointments_status_check;
alter table appointments
  add constraint appointments_status_check
  check (status in ('pending', 'accepted', 'declined', 'booked', 'completed', 'cancelled'));

-- ---------- No-double-booking guarantee ----------
-- Two active appointments for the SAME doctor can never have overlapping time
-- ranges. A 'pending' request reserves the slot just like an accepted one;
-- only 'cancelled'/'declined' free it. Enforced by the database, so it holds
-- even under concurrent bookings — the API cannot be raced around it.
alter table appointments drop constraint if exists appointments_no_overlap;
alter table appointments
  add constraint appointments_no_overlap
  exclude using gist (
    doctor_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status not in ('cancelled', 'declined'));

-- ---------- Indexes ----------
create index if not exists doctors_specialty_idx on doctors (specialty_id);
create index if not exists availability_doctor_idx on doctor_availability (doctor_id, weekday);
create index if not exists time_off_doctor_idx on doctor_time_off (doctor_id, date);
create index if not exists appointments_patient_idx on appointments (patient_id, starts_at desc);
create index if not exists appointments_doctor_idx on appointments (doctor_id, starts_at);
