import React from "react";
import { Link } from "wouter";
import { Waves, Dumbbell, Car, Wifi, TreePine, ShieldCheck, ArrowRight, MapPin, Award } from "lucide-react";

export default function Home() {

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
        
        {/* About the Building */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text side */}
          <div>
            <h2 className="text-4xl font-serif font-medium text-foreground mb-3">Pavilion</h2>
            <div className="flex items-center gap-1.5 text-primary mb-8">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Riverside Quarter, London</span>
            </div>
            <div className="space-y-5 text-muted-foreground leading-relaxed text-[15px]">
              <p>
                Pavilion is a contemporary residential development set within a beautifully landscaped riverside setting. Thoughtfully designed for modern living, it offers a curated collection of one, two, and three-bedroom apartments alongside expansive penthouse suites — each finished to an exceptional standard with floor-to-ceiling glazing and private balconies.
              </p>
              <p>
                Residents enjoy exclusive access to a private health club, 25-metre swimming pool, landscaped roof terrace, and a dedicated concierge. The building's central location places world-class dining, culture, and transport links just minutes away, making Pavilion as well-connected as it is refined.
              </p>
              <p>
                Pavilion has been recognised with the <span className="text-foreground font-medium">"Best Residential Development — London"</span> award at the 2024 Property Excellence Awards and the <span className="text-foreground font-medium">"Outstanding Community Living"</span> commendation at the National Homes Awards.
              </p>
            </div>
          </div>

          {/* Awards / highlights side */}
          <div className="flex flex-col gap-5">
            {[
              {
                icon: Award,
                title: "Best Residential Development — London",
                subtitle: "Property Excellence Awards 2024",
              },
              {
                icon: Award,
                title: "Outstanding Community Living",
                subtitle: "National Homes Awards 2023",
              },
              {
                icon: MapPin,
                title: "Riverside Quarter, London",
                subtitle: "Close to tube, rail & riverside walks",
              },
            ].map(({ icon: Icon, title, subtitle }) => (
              <div
                key={title}
                className="flex items-start gap-5 p-6 rounded-2xl border bg-card shadow-sm"
              >
                <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground leading-snug">{title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
