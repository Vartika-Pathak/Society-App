import React from "react";
import { Link } from "wouter";
import { useGetCommunityStats, useGetUpcomingEvents, useGetLatestNewsPosts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Waves, Dumbbell, Car, Wifi, TreePine, ShieldCheck, ArrowRight, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetCommunityStats();
  const { data: upcomingEvents, isLoading: eventsLoading } = useGetUpcomingEvents();
  const { data: latestNews, isLoading: newsLoading } = useGetLatestNewsPosts();

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[560px] flex items-center">
        {/* Full background image */}
        <img
          src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1800&q=80"
          alt="Modern apartment building"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/30" />
        <div className="container relative mx-auto px-4 md:px-8 py-24 max-w-5xl">
          <span className="inline-block py-1 px-3 rounded-full bg-white/20 text-white text-sm font-medium mb-6 tracking-wide uppercase backdrop-blur-sm">
            Welcome to the building
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-medium text-white mb-8 leading-tight tracking-tight max-w-3xl">
            Your home, <br className="hidden md:block" />
            <span className="italic font-light text-white/80">our community.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl leading-relaxed">
            Pavilion is the central hub for our residents. Discover upcoming events, read the latest announcements, and connect with your neighbours.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Link href="/signup">
              <Button size="lg" className="rounded-full px-8 h-14 text-base shadow-md w-full sm:w-auto bg-white text-primary hover:bg-white/90">
                Join the Community
              </Button>
            </Link>
            <Link href="/events">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base border-white/60 text-white hover:bg-white/10 backdrop-blur w-full sm:w-auto">
                View Calendar
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Amenities Strip */}
      <section className="border-y bg-card z-10 relative">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-border">
            {[
              { icon: Waves,       label: "Swimming Pool",   desc: "25m heated pool" },
              { icon: Dumbbell,    label: "Gym & Fitness",   desc: "Open 6am – 10pm" },
              { icon: TreePine,    label: "Roof Terrace",    desc: "City views & seating" },
              { icon: Car,         label: "Secure Parking",  desc: "Residents & visitors" },
              { icon: Wifi,        label: "High-Speed Wi-Fi",desc: "All common areas" },
              { icon: ShieldCheck, label: "24/7 Concierge",  desc: "Always on hand" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="p-6 text-center flex flex-col items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm leading-tight">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Photo Strip */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-serif font-medium mb-1">Life at Pavilion</h2>
              <p className="text-muted-foreground text-sm">Moments from our community.</p>
            </div>
            <Link href="/gallery" className="flex items-center text-primary text-sm font-medium hover:underline">
              View gallery <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { src: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80", alt: "Residents lounge" },
              { src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80", alt: "Common area" },
              { src: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80", alt: "Garden terrace" },
              { src: "https://images.unsplash.com/photo-1599619351208-3e6c839d6828?auto=format&fit=crop&w=600&q=80", alt: "Building entrance" },
            ].map((photo, i) => (
              <Link key={i} href="/gallery" className="group overflow-hidden rounded-2xl aspect-square block">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
            ))}
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
