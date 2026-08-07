import type { InsertResidentMeeting } from "../schema/residentMeetings";

// A starter set of recurring committee/resident meetings — real dates should replace these
// as they're scheduled; this just gives the "Resident Meetings" section something to show
// on a fresh deploy instead of being empty.
export const upcomingResidentMeetings: InsertResidentMeeting[] = [
  {
    title: "Monthly Managing Committee Meeting",
    date: new Date("2026-08-30T18:30:00"),
    location: "Clubhouse Hall",
    notes: "Routine maintenance, budget review, and open resident concerns.",
  },
  {
    title: "Monthly Managing Committee Meeting",
    date: new Date("2026-09-27T18:30:00"),
    location: "Clubhouse Hall",
    notes: "Routine maintenance, budget review, and open resident concerns.",
  },
  {
    title: "Quarterly General Body Meeting",
    date: new Date("2026-10-25T17:00:00"),
    location: "Clubhouse Hall",
    notes: "Open to all residents — society finances, upcoming projects, and elections.",
  },
];
