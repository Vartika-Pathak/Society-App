import type { InsertEvent } from "../schema/events";

// A starter set of Indian festivals and community functions for the Social
// Calendar. 2026 festival dates are the real ones (checked against calendar
// sources, not guessed) — Independence Day, Raksha Bandhan, Ganesh Chaturthi,
// Navratri, Dussehra, and Diwali all shift year to year on the lunar-solar
// Panchang, so don't reuse these dates as-is in a future year without
// re-checking them.
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
    title: "Society Annual General Body Meeting",
    description:
      "Annual review of society finances and maintenance updates, plus elections for two open committee seats. All residents are requested to attend.",
    date: new Date("2026-08-22T18:00:00"),
    location: "Clubhouse Hall",
    organizer: "Managing Committee",
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
    title: "Blood Donation Camp",
    description:
      "Free health check-up and blood donation drive, run in partnership with the local blood bank. Open to all residents aged 18-65.",
    date: new Date("2026-09-20T10:00:00"),
    location: "Clubhouse Hall",
    organizer: "Health & Wellness Committee",
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
];
