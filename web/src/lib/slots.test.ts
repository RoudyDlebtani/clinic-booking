import { describe, expect, it } from "vitest";
import {
  generateSlots,
  minutesToLabel,
  minutesToTime,
  timeToMinutes,
} from "./slots";

const NINE_TO_TWELVE = [{ start: 9 * 60, end: 12 * 60 }];

describe("generateSlots", () => {
  it("steps through a window by the appointment length", () => {
    const slots = generateSlots({
      workingHours: NINE_TO_TWELVE,
      slotDurationMinutes: 30,
    });
    expect(slots.map(minutesToTime)).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
    ]);
  });

  it("never produces a slot that runs past the window", () => {
    // 60-minute slots in a 90-minute window → only 09:00 fits fully.
    const slots = generateSlots({
      workingHours: [{ start: 9 * 60, end: 10 * 60 + 30 }],
      slotDurationMinutes: 60,
    });
    expect(slots.map(minutesToTime)).toEqual(["09:00"]);
  });

  it("removes slots that overlap an existing appointment", () => {
    const slots = generateSlots({
      workingHours: NINE_TO_TWELVE,
      slotDurationMinutes: 30,
      booked: [{ start: 10 * 60, end: 10 * 60 + 30 }],
    });
    expect(slots.map(minutesToTime)).not.toContain("10:00");
    expect(slots.map(minutesToTime)).toContain("10:30");
  });

  it("treats booked ranges as half-open (back-to-back is fine)", () => {
    // A booking ending exactly at 10:00 must not block the 10:00 slot.
    const slots = generateSlots({
      workingHours: NINE_TO_TWELVE,
      slotDurationMinutes: 30,
      booked: [{ start: 9 * 60 + 30, end: 10 * 60 }],
    });
    expect(slots.map(minutesToTime)).toContain("10:00");
    expect(slots.map(minutesToTime)).not.toContain("09:30");
  });

  it("drops a partially overlapping booking", () => {
    // A 45-minute booking from 10:15 spans into both the 10:00 and 10:30 slots.
    const slots = generateSlots({
      workingHours: NINE_TO_TWELVE,
      slotDurationMinutes: 30,
      booked: [{ start: 10 * 60 + 15, end: 11 * 60 }],
    });
    const labels = slots.map(minutesToTime);
    expect(labels).not.toContain("10:00");
    expect(labels).not.toContain("10:30");
    expect(labels).toContain("11:00");
  });

  it("hides slots that have already started today", () => {
    const slots = generateSlots({
      workingHours: NINE_TO_TWELVE,
      slotDurationMinutes: 30,
      nowMinutes: 10 * 60 + 10, // 10:10 now
    });
    const labels = slots.map(minutesToTime);
    expect(labels).not.toContain("10:00");
    expect(labels).toContain("10:30");
  });

  it("returns nothing on a day off", () => {
    expect(
      generateSlots({
        workingHours: NINE_TO_TWELVE,
        slotDurationMinutes: 30,
        dayOff: true,
      }),
    ).toEqual([]);
  });

  it("merges and sorts multiple working windows", () => {
    const slots = generateSlots({
      workingHours: [
        { start: 13 * 60, end: 14 * 60 },
        { start: 9 * 60, end: 10 * 60 },
      ],
      slotDurationMinutes: 30,
    });
    expect(slots.map(minutesToTime)).toEqual([
      "09:00",
      "09:30",
      "13:00",
      "13:30",
    ]);
  });

  it("returns an empty list for non-positive durations", () => {
    expect(
      generateSlots({ workingHours: NINE_TO_TWELVE, slotDurationMinutes: 0 }),
    ).toEqual([]);
  });
});

describe("time helpers", () => {
  it("round-trips minutes ↔ HH:MM", () => {
    expect(minutesToTime(timeToMinutes("14:05"))).toBe("14:05");
  });

  it("parses HH:MM:SS", () => {
    expect(timeToMinutes("09:30:00")).toBe(570);
  });

  it("formats friendly 12h labels", () => {
    expect(minutesToLabel(0)).toBe("12:00 AM");
    expect(minutesToLabel(9 * 60 + 30)).toBe("9:30 AM");
    expect(minutesToLabel(12 * 60)).toBe("12:00 PM");
    expect(minutesToLabel(13 * 60 + 15)).toBe("1:15 PM");
  });
});
