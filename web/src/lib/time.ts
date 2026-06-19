/**
 * Small timezone helpers built on the Intl API (no external date library).
 * Everything is expressed relative to a given IANA timezone so the clinic's
 * "today" and "now" are correct regardless of where the server runs.
 */

/** The current date in `tz` as a "yyyy-mm-dd" string. */
export function todayInTz(tz: string): string {
  // en-CA formats as yyyy-mm-dd, which is exactly what we want.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** The current wall-clock time in `tz` as minutes from midnight. */
export function nowMinutesInTz(tz: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

/** The dow (0 = Sunday) of a "yyyy-mm-dd" date string. */
export function weekdayOf(dateStr: string): number {
  // Append T12:00 to dodge any DST/UTC edge at midnight.
  return new Date(`${dateStr}T12:00:00`).getDay();
}

/** Add `days` to a "yyyy-mm-dd" string, returning a new "yyyy-mm-dd". */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Human label for a "yyyy-mm-dd" date, e.g. "Mon, Jun 16". */
export function formatDateLabel(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateStr}T12:00:00`));
}

/** Format a stored UTC timestamp as a clinic-time time-of-day, e.g. "2:30 PM". */
export function formatTimeOfDay(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Format a stored UTC timestamp in the clinic timezone, e.g. "Jun 16, 2:30 PM". */
export function formatAppointmentTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
