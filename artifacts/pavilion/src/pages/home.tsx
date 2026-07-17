import React from "react";
import { Link } from "wouter";
import { useGetCommunityStats, useGetUpcomingEvents, useGetLatestNewsPosts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, Newspaper, Image as ImageIcon, ArrowRight, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetCommunityStats();
  const { data: upcomingEvents, isLoading: eventsLoading } = useGetUpcomingEvents();
  const { data: latestNews, isLoading: newsLoading } = useGetLatestNewsPosts();

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary/5 pt-20 pb-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-[0.03]" />
        <div className="container relative mx-auto px-4 md:px-8 text-center max-w-4xl">
          <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 tracking-wide uppercase">
            Welcome to the building
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-medium text-foreground mb-8 leading-tight tracking-tight">
            Your home, <br className="hidden md:block" />
            <span className="text-primary italic font-light">our community.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Pavilion is the central hub for our residents. Discover upcoming events, read the latest announcements, and connect with your neighbors.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/join">
              <Button size="lg" className="rounded-full px-8 h-14 text-base shadow-md w-full sm:w-auto">
                Join the Directory
              </Button>
            </Link>
            <Link href="/events">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base bg-background/50 backdrop-blur w-full sm:w-auto">
                View Calendar
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y bg-card z-10 relative">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-serif font-medium mb-1">
                {statsLoading ? <Skeleton className="h-9 w-16 mx-auto" /> : stats?.totalMembers || 0}
              </h3>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Neighbors</p>
            </div>
            
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-accent/50 flex items-center justify-center mb-4 text-accent-foreground">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-serif font-medium mb-1">
                {statsLoading ? <Skeleton className="h-9 w-16 mx-auto" /> : stats?.upcomingEventsCount || 0}
              </h3>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Upcoming Events</p>
            </div>
            
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4 text-foreground">
                <Newspaper className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-serif font-medium mb-1">
                {statsLoading ? <Skeleton className="h-9 w-16 mx-auto" /> : stats?.totalNewsPosts || 0}
              </h3>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">News Posts</p>
            </div>
            
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <ImageIcon className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-serif font-medium mb-1">
                {statsLoading ? <Skeleton className="h-9 w-16 mx-auto" /> : stats?.totalGalleryPhotos || 0}
              </h3>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Gallery Photos</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 py-24 space-y-24">
        
        {/* Latest News */}
        <section>
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-serif font-medium mb-3">Notice Board</h2>
              <p className="text-muted-foreground">The latest announcements and community updates.</p>
            </div>
            <Link href="/news" className="hidden md:flex items-center text-primary font-medium hover:underline">
              All News <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {newsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-4">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : latestNews?.length ? (
              latestNews.map((post) => (
                <Link key={post.id} href={`/news/${post.id}`} className="group flex flex-col cursor-pointer">
                  <div className="overflow-hidden rounded-xl mb-5 bg-muted aspect-video relative">
                    {post.imageUrl ? (
                      <img 
                        src={post.imageUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Newspaper className="h-10 w-10 opacity-20" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span className="font-medium text-primary bg-primary/5 px-2 py-0.5 rounded">Announcement</span>
                    <time>{format(new Date(post.publishedAt), 'MMM d, yyyy')}</time>
                  </div>
                  <h3 className="text-xl font-serif font-medium mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                </Link>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-muted/30 rounded-xl border border-dashed">
                <p className="text-muted-foreground">No news posted yet.</p>
              </div>
            )}
          </div>
          <div className="mt-8 md:hidden text-center">
            <Link href="/news">
              <Button variant="outline" className="rounded-full w-full">View All News</Button>
            </Link>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="bg-secondary/50 rounded-3xl p-8 md:p-12 border">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-serif font-medium mb-3">Social Calendar</h2>
              <p className="text-muted-foreground">Get together with your neighbors.</p>
            </div>
            <Link href="/events" className="hidden md:flex items-center text-primary font-medium hover:underline">
              Full Calendar <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {eventsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))
            ) : upcomingEvents?.length ? (
              upcomingEvents.slice(0, 4).map((event) => (
                <Card key={event.id} className="border-none shadow-sm hover:shadow-md transition-shadow group">
                  <CardContent className="p-6 flex items-start gap-6">
                    <div className="flex flex-col items-center justify-center min-w-16 h-16 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <span className="text-sm font-bold uppercase tracking-wider">{format(new Date(event.date), 'MMM')}</span>
                      <span className="text-2xl font-serif leading-none mt-0.5">{format(new Date(event.date), 'dd')}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-medium mb-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>{format(new Date(event.date), 'h:mm a')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <p className="text-muted-foreground">No upcoming events right now. Check back later!</p>
              </div>
            )}
          </div>
          <div className="mt-8 md:hidden text-center">
            <Link href="/events">
              <Button variant="outline" className="rounded-full bg-background w-full">View Calendar</Button>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
