/**
 * Slot generation — the core scheduling algorithm.
 *
 * Given a doctor's working hours for a day, how long one appointment takes,
 * and which time ranges are already booked, this computes the list of free
 * start times a patient can pick.
 *
 * Everything here is pure integer math on "minutes from midnight" and carries
 * no timezone or Date objects. That keeps the tricky part — slot stepping and
 * overlap detection — easy to reason about and exhaustively unit-testable.
 * Timezone conversion lives in SQL (see supabase/schema.sql); the caller turns
 * the chosen minute-of-day back into a real timestamp.
 */

/** A half-open interval [start, end) measured in minutes from midnight. */
export interface MinuteRange {
  start: number;
  end: number;
}

export interface GenerateSlotsOptions {
  /** The doctor's working windows for this weekday, e.g. 09:00–12:00. */
  workingHours: MinuteRange[];
  /** Appointment length in minutes; also the step between candidate slots. */
  slotDurationMinutes: number;
  /** Already-booked windows for this doctor on this day. */
  booked?: MinuteRange[];
  /**
   * If the day being viewed is "today", the current time in minutes from
   * midnight (clinic-local). Slots starting at or before this are dropped so
   * patients can't book a time that has already passed. Omit for future days.
   */
  nowMinutes?: number | null;
  /** Whether the doctor has the whole day off (holiday, sick day). */
  dayOff?: boolean;
}

/** True if the half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap. */
function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Returns the sorted, de-duplicated list of available slot start times
 * (minutes from midnight) for a single day.
 */
export function generateSlots(options: GenerateSlotsOptions): number[] {
  const {
    workingHours,
    slotDurationMinutes,
    booked = [],
    nowMinutes = null,
    dayOff = false,
  } = options;

  if (dayOff || slotDurationMinutes <= 0) return [];

  const starts = new Set<number>();

  for (const window of workingHours) {
    // Walk the window in steps of one appointment length. The last slot must
    // fully fit before the window closes, hence `+ duration <= window.end`.
    for (
      let start = window.start;
      start + slotDurationMinutes <= window.end;
      start += slotDurationMinutes
    ) {
      const end = start + slotDurationMinutes;

      // Drop slots that have already started (only relevant for "today").
      if (nowMinutes != null && start <= nowMinutes) continue;

      // Drop slots that collide with an existing appointment.
      const clashes = booked.some((b) => overlaps(start, end, b.start, b.end));
      if (clashes) continue;

      starts.add(start);
    }
  }

  return [...starts].sort((a, b) => a - b);
}

/** Format a minute-of-day as a 24h "HH:MM" string. */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Parse a "HH:MM" or "HH:MM:SS" string into minutes from midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Format a minute-of-day as a friendly 12h label, e.g. "9:30 AM". */
export function minutesToLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
