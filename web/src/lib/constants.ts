/**
 * The single timezone the clinic operates in. Doctors' working hours and the
 * times patients see are all expressed in this zone; appointments are stored
 * in UTC and converted on the way in and out (see supabase/schema.sql and
 * lib/time.ts). Change this one constant to relocate the clinic.
 */
export const CLINIC_TIMEZONE = "America/New_York";

/** Weekday labels indexed by Postgres/JS dow (0 = Sunday). */
export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** How many days ahead a patient may book. */
export const BOOKING_WINDOW_DAYS = 30;
