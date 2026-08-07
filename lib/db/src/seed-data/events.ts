import type { InsertEvent } from "../schema/events";

// A starter set of Indian festivals, national holidays, and community functions for the
// Social Calendar. 2026 festival dates are the real ones (checked against calendar sources,
// not guessed) — Independence Day, Raksha Bandhan, Ganesh Chaturthi, Navratri, Dussehra, and
// Diwali all shift year to year on the lunar-solar Panchang, so don't reuse these dates as-is
// in a future year without re-checking them. Gandhi Jayanti, Christmas, New Year's Day, and
// Republic Day are fixed solar-calendar dates, so those are safe to reuse every year as-is.
// Deliberately not including other lunar-dated festivals (Holi, Eid, Onam, etc.) here — their
// dates shift yearly too and none were verified against a real calendar source.
export const festivalAndCommunityEvents: InsertEvent[] = [
  {
    title: "Independence Day Flag Hoisting & Cultural Program",
    description:
      "Flag hoisting ceremony followed by patriotic songs, a cultural program by our kids, and breakfast for all residents.",
    date: new Date("2026-08-15T08:00:00"),
    location: "Main Lawn",
    organizer: "Residents' Welfare Committee",
  },
  {
    title: "Raksha Bandhan Celebration",
    description:
      "An evening of rakhi tying, sweets, and games celebrating the bond between siblings. All families welcome.",
    date: new Date("2026-08-28T17:00:00"),
    location: "Community Hall",
    organizer: "Ladies Club",
  },
  {
    title: "Ganesh Chaturthi Community Puja",
    description:
      "Ganpati sthapana followed by daily aarti through the festival. Volunteers welcome for decoration and prasad distribution.",
    date: new Date("2026-09-14T09:00:00"),
    location: "Society Temple Courtyard",
    organizer: "Cultural Committee",
  },
  {
    title: "Navratri Garba Night",
    description:
      "Traditional garba and dandiya night with live dhol, food stalls, and a best-dressed competition.",
    date: new Date("2026-10-15T19:30:00"),
    location: "Open Ground",
    organizer: "Cultural Committee",
  },
  {
    title: "Dussehra Celebration",
    description: "Ravan Dahan followed by a community dinner, marking the victory of good over evil.",
    date: new Date("2026-10-20T18:30:00"),
    location: "Main Lawn",
    organizer: "Cultural Committee",
  },
  {
    title: "Diwali Mela & Fireworks Night",
    description:
      "Diyas, a rangoli competition, a mini food mela, and a supervised fireworks display for the whole community. Prizes for kids' diya and rangoli entries.",
    date: new Date("2026-11-08T18:00:00"),
    location: "Central Courtyard",
    organizer: "Residents' Welfare Committee",
  },
  {
    title: "Society Sports Day",
    description:
      "A day of friendly games for all ages — cricket, badminton, tug-of-war, and a kids' relay race. Trophies and refreshments for everyone.",
    date: new Date("2026-11-22T08:00:00"),
    location: "Society Sports Ground",
    organizer: "Sports Committee",
  },
  {
    title: "New Year's Eve Community Party",
    description: "Ring in the New Year with music, dinner, and a midnight countdown for the whole Pavilion community.",
    date: new Date("2026-12-31T20:00:00"),
    location: "Clubhouse Terrace",
    organizer: "Events Committee",
  },
  {
    title: "Gandhi Jayanti",
    description: "National holiday marking Mahatma Gandhi's birth anniversary — a short tribute and prayer meet.",
    date: new Date("2026-10-02T09:00:00"),
    location: "Society Temple Courtyard",
    organizer: "Residents' Welfare Committee",
  },
  {
    title: "Christmas Celebration",
    description: "Carols, a small Secret Santa exchange, and cake for kids and families in the community.",
    date: new Date("2026-12-25T17:00:00"),
    location: "Clubhouse Hall",
    organizer: "Events Committee",
  },
  {
    title: "New Year's Day",
    description: "National holiday — office and management desk closed for the day.",
    date: new Date("2027-01-01T00:00:00"),
    location: "Society Premises",
    organizer: "Managing Committee",
  },
  {
    title: "Republic Day Flag Hoisting",
    description: "Flag hoisting ceremony and patriotic cultural program marking Republic Day.",
    date: new Date("2027-01-26T08:00:00"),
    location: "Main Lawn",
    organizer: "Residents' Welfare Committee",
  },
];
