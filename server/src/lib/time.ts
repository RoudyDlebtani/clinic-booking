/**
 * Timezone helpers built on the Intl API. The clinic's "today" and "now" are
 * computed relative to a given IANA timezone, so they are correct regardless of
 * where the server runs.
 */

/** The current date in `tz` as a "yyyy-mm-dd" string. */
export function todayInTz(tz: string): string {
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

/** The dow (0 = Sunday) of a "yyyy-mm-dd" date string, timezone-independent. */
export function weekdayOf(dateStr: string): number {
  // Noon UTC dodges any DST/offset edge at midnight; a calendar date maps to
  // exactly one weekday regardless of timezone.
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}
