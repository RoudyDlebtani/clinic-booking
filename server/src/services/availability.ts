import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { doctorAvailability, doctorTimeOff, doctors } from "../db/schema";
import { CLINIC_TIMEZONE } from "../lib/constants";
import { generateSlots, timeToMinutes, type MinuteRange } from "../lib/slots";
import { nowMinutesInTz, todayInTz, weekdayOf } from "../lib/time";

/**
 * Computes the free appointment start times for a doctor on one local date.
 * Pulls the doctor's weekly hours, any time-off for that day, and the booked
 * windows, then runs the pure slot algorithm. Returns minutes-from-midnight.
 */
export async function getAvailableSlots(
  doctorId: string,
  date: string,
): Promise<number[]> {
  const tz = CLINIC_TIMEZONE;
  const weekday = weekdayOf(date);

  const [doctor] = await db
    .select({
      slot: doctors.slot_duration_minutes,
      active: doctors.is_active,
    })
    .from(doctors)
    .where(eq(doctors.id, doctorId));

  if (!doctor || !doctor.active || !doctor.slot) return [];

  const availability = await db
    .select({
      start_time: doctorAvailability.start_time,
      end_time: doctorAvailability.end_time,
    })
    .from(doctorAvailability)
    .where(
      and(
        eq(doctorAvailability.doctor_id, doctorId),
        eq(doctorAvailability.weekday, weekday),
      ),
    );

  const timeOff = await db
    .select({ id: doctorTimeOff.id })
    .from(doctorTimeOff)
    .where(
      and(eq(doctorTimeOff.doctor_id, doctorId), eq(doctorTimeOff.date, date)),
    );

  // Busy windows across all patients, as opaque minute ranges in clinic time.
  const booked = await db.execute<{ start_min: number; end_min: number }>(sql`
    select
      (extract(hour   from (a.starts_at at time zone ${tz})) * 60
        + extract(minute from (a.starts_at at time zone ${tz})))::int as start_min,
      (extract(hour   from (a.ends_at at time zone ${tz})) * 60
        + extract(minute from (a.ends_at at time zone ${tz})))::int as end_min
    from appointments a
    where a.doctor_id = ${doctorId}
      and a.status not in ('cancelled', 'declined')
      and (a.starts_at at time zone ${tz})::date = ${date}
  `);

  const workingHours: MinuteRange[] = availability.map((w) => ({
    start: timeToMinutes(w.start_time),
    end: timeToMinutes(w.end_time),
  }));

  const bookedRanges: MinuteRange[] = booked.rows.map((b) => ({
    start: b.start_min,
    end: b.end_min,
  }));

  const isToday = date === todayInTz(tz);

  return generateSlots({
    workingHours,
    slotDurationMinutes: doctor.slot,
    booked: bookedRanges,
    nowMinutes: isToday ? nowMinutesInTz(tz) : null,
    dayOff: timeOff.length > 0,
  });
}
