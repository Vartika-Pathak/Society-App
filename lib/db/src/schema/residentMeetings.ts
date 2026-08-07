import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Kept separate from events (rather than an event "category") since meetings only need to show
// when and where, not the richer festival/celebration presentation the Events page uses.
export const residentMeetingsTable = sqliteTable("resident_meetings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  location: text("location").notNull(),
  notes: text("notes"),
});

export const insertResidentMeetingSchema = createInsertSchema(residentMeetingsTable).omit({ id: true });
export type InsertResidentMeeting = z.infer<typeof insertResidentMeetingSchema>;
export type ResidentMeeting = typeof residentMeetingsTable.$inferSelect;
