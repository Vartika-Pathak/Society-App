import type { AmenitySlot } from "@workspace/db";

// The hour (24h, server-local time) each slot ends at — used to decide whether a slot for a
// given date has already passed. Keep in sync with slotLabels in the frontend's amenities page.
const SLOT_END_HOUR: Record<AmenitySlot, number> = {
  morning: 12,
  afternoon: 17,
  evening: 21,
};

export function isSlotPast(bookingDate: string, slot: AmenitySlot, now: Date = new Date()): boolean {
  const slotEnd = new Date(`${bookingDate}T00:00:00`);
  slotEnd.setHours(SLOT_END_HOUR[slot], 0, 0, 0);
  return slotEnd.getTime() <= now.getTime();
}
