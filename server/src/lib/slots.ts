/**
 * Slot generation — the core scheduling algorithm (ported from the frontend so
 * availability is now computed authoritatively on the server).
 *
 * Pure integer math on "minutes from midnight", no timezone or Date objects.
 */

/** A half-open interval [start, end) measured in minutes from midnight. */
export interface MinuteRange {
  start: number;
  end: number;
}

export interface GenerateSlotsOptions {
  workingHours: MinuteRange[];
  slotDurationMinutes: number;
  booked?: MinuteRange[];
  nowMinutes?: number | null;
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
    for (
      let start = window.start;
      start + slotDurationMinutes <= window.end;
      start += slotDurationMinutes
    ) {
      const end = start + slotDurationMinutes;
      if (nowMinutes != null && start <= nowMinutes) continue;
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
