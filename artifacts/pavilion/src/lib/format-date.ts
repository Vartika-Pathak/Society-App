const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// "14 August 2026" everywhere a date is shown, instead of locale-dependent
// formats like "8/14/2026" — accepts anything Date can parse: an ISO
// datetime, a date-only string ("2026-08-14"), or a Date instance.
export function formatDate(value: string | number | Date): string {
  // A bare "YYYY-MM-DD" has no timezone of its own — parsing it as UTC (the
  // default for date-only ISO strings) and then rendering in the viewer's
  // local time can roll it back a day west of UTC. Parsing as local midnight
  // instead keeps it the calendar day it was actually stored as everywhere.
  const date = typeof value === "string" && DATE_ONLY.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// "14 August 2026, 6:58 am" — for timestamps where the time matters too.
export function formatDateTime(value: string | number | Date): string {
  const date = new Date(value);
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  return `${formatDate(date)}, ${time}`;
}
