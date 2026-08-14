import React, { useEffect, useState } from "react";
import { useListEvents } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, User, Users } from "lucide-react";
import { format, isFuture, parseISO } from "date-fns";
import { apiGet } from "@/lib/api-fetch";
import { formatDateTime } from "@/lib/format-date";

interface ResidentMeeting {
  id: number;
  title: string;
  date: string;
  location: string;
  notes: string | null;
}

export default function Events() {
  const { data: events, isLoading } = useListEvents();

  const [meetings, setMeetings] = useState<ResidentMeeting[] | null>(null);
  const [meetingsLoading, setMeetingsLoading] = useState(true);

  useEffect(() => {
    apiGet<ResidentMeeting[]>("/api/resident-meetings")
      .then(setMeetings)
      .catch(() => setMeetings([]))
      .finally(() => setMeetingsLoading(false));
  }, []);

  // Only ever upcoming — once an event's date has passed it drops off rather than
  // lingering on the page (e.g. Independence Day disappears the moment Aug 15 ends).
  const upcomingEvents = React.useMemo(() => {
    if (!events) return [];
    return events
      .filter((e) => isFuture(parseISO(e.date)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  return (
    <div className="w-full pb-24">
      {/* Header */}
      <div className="relative overflow-hidden bg-primary py-12 border-b">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-10 container mx-auto px-4 md:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4 text-primary-foreground">Social Calendar</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            From committee meetings to festivals and celebrations, see what's happening around Pavilion.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16 max-w-5xl">

        {/* Upcoming Events */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8 pb-4 border-b">
            <h2 className="text-2xl font-serif font-medium">Upcoming Events</h2>
            <Badge variant="secondary" className="rounded-full px-3">{upcomingEvents.length}</Badge>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="space-y-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed">
              <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
              <p className="text-muted-foreground">Check back later for new activities.</p>
            </div>
          )}
        </section>

        {/* Resident Meetings */}
        <section>
          <div className="flex items-center gap-4 mb-8 pb-4 border-b">
            <h2 className="text-2xl font-serif font-medium">Resident Meetings</h2>
            <Badge variant="secondary" className="rounded-full px-3">{meetings?.length ?? 0}</Badge>
          </div>

          {meetingsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : meetings && meetings.length > 0 ? (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No meetings scheduled</h3>
              <p className="text-muted-foreground">Check back later for the next committee or general body meeting.</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  const eventDate = new Date(event.date);

  return (
    <Card className="overflow-hidden border group transition-all duration-300 hover:shadow-md bg-card">
      <CardContent className="p-0 flex flex-col md:flex-row">
        {/* Date block */}
        <div className="md:w-48 p-6 flex flex-col items-center justify-center shrink-0 border-b md:border-b-0 md:border-r bg-primary/5 text-primary">
          <span className="text-sm font-bold uppercase tracking-widest">{format(eventDate, 'MMM')}</span>
          <span className="text-4xl font-serif font-medium my-1">{format(eventDate, 'dd')}</span>
          <span className="text-sm opacity-80">{format(eventDate, 'yyyy')}</span>
        </div>

        {/* Content block */}
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 className="text-2xl font-serif font-medium group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0 shrink-0">Upcoming</Badge>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{format(eventDate, 'h:mm a')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
            {event.organizer && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>{event.organizer}</span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-muted-foreground leading-relaxed">
              {event.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MeetingCard({ meeting }: { meeting: ResidentMeeting }) {
  const meetingDate = new Date(meeting.date);

  return (
    <Card className="overflow-hidden border">
      <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <Users className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-1">{meeting.title}</h3>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{formatDateTime(meetingDate)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{meeting.location}</span>
            </div>
          </div>
          {meeting.notes && <p className="text-sm text-muted-foreground mt-2">{meeting.notes}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
