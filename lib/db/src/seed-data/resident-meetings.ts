import type { InsertResidentMeeting } from "../schema/residentMeetings";

// Meetings, drives, and camps — anything that isn't a festival/celebration — real dates
// should replace these as they're scheduled; this just gives the "Resident Meetings"
// section something to show on a fresh deploy instead of being empty.
export const upcomingResidentMeetings: InsertResidentMeeting[] = [
  {
    title: "Society Annual General Body Meeting",
    date: new Date("2026-08-22T18:00:00"),
    location: "Clubhouse Hall",
    notes:
      "Annual review of society finances and maintenance updates, plus elections for two open committee seats. All residents are requested to attend.",
  },
  {
    title: "Monthly Managing Committee Meeting",
    date: new Date("2026-08-30T18:30:00"),
    location: "Clubhouse Hall",
    notes: "Routine maintenance, budget review, and open resident concerns.",
  },
  {
    title: "Blood Donation Camp",
    date: new Date("2026-09-20T10:00:00"),
    location: "Clubhouse Hall",
    notes:
      "Free health check-up and blood donation drive, run in partnership with the local blood bank. Open to all residents aged 18-65.",
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
