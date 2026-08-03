import React from "react";
import { useListEvents } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, User, ChevronRight } from "lucide-react";
import { format, isFuture, isPast, parseISO } from "date-fns";

export default function Events() {
  const { data: events, isLoading } = useListEvents();

  // Sort events: upcoming first (by closest date), then past (most recent first)
  const sortedEvents = React.useMemo(() => {
    if (!events) return { upcoming: [], past: [] };
    
    const upcoming = events
      .filter(e => isFuture(parseISO(e.date)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
    const past = events
      .filter(e => isPast(parseISO(e.date)))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
    return { upcoming, past };
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
            From committee meetings to summer barbecues, see what's happening around Pavilion.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16 max-w-5xl">
        
        {/* Upcoming Events */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8 pb-4 border-b">
            <h2 className="text-2xl font-serif font-medium">Upcoming Events</h2>
            <Badge variant="secondary" className="rounded-full px-3">{sortedEvents.upcoming.length}</Badge>
          </div>
          
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : sortedEvents.upcoming.length > 0 ? (
            <div className="space-y-6">
              {sortedEvents.upcoming.map((event) => (
                <EventCard key={event.id} event={event} isUpcoming={true} />
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

        {/* Past Events */}
        <section>
          <div className="flex items-center gap-4 mb-8 pb-4 border-b">
            <h2 className="text-2xl font-serif font-medium text-muted-foreground">Past Events</h2>
          </div>
          
          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Skeleton className="h-32 rounded-2xl" />
               <Skeleton className="h-32 rounded-2xl" />
             </div>
          ) : sortedEvents.past.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-70 hover:opacity-100 transition-opacity duration-300">
              {sortedEvents.past.map((event) => (
                <EventCard key={event.id} event={event} isUpcoming={false} />
              ))}
            </div>
          ) : null}
        </section>

      </div>
    </div>
  );
}

function EventCard({ event, isUpcoming }: { event: any, isUpcoming: boolean }) {
  const eventDate = new Date(event.date);
  
  return (
    <Card className={`overflow-hidden border group transition-all duration-300 ${isUpcoming ? 'hover:shadow-md bg-card' : 'bg-muted/50 border-transparent shadow-none'}`}>
      <CardContent className="p-0 flex flex-col md:flex-row">
        {/* Date block */}
        <div className={`md:w-48 p-6 flex flex-col items-center justify-center shrink-0 border-b md:border-b-0 md:border-r ${isUpcoming ? 'bg-primary/5 text-primary' : 'bg-muted text-muted-foreground'}`}>
          <span className="text-sm font-bold uppercase tracking-widest">{format(eventDate, 'MMM')}</span>
          <span className="text-4xl font-serif font-medium my-1">{format(eventDate, 'dd')}</span>
          <span className="text-sm opacity-80">{format(eventDate, 'yyyy')}</span>
        </div>
        
        {/* Content block */}
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 className={`text-2xl font-serif font-medium ${isUpcoming ? 'group-hover:text-primary transition-colors' : ''}`}>
              {event.title}
            </h3>
            {isUpcoming && <Badge className="bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0 shrink-0">Upcoming</Badge>}
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
