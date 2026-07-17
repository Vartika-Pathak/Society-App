import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, Heart, Shield, Users } from "lucide-react";

export default function About() {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-primary/5 py-16 md:py-24 border-b">
        <div className="container mx-auto px-4 md:px-8 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-6">About Pavilion</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            More than just an address. Pavilion is a vibrant community of neighbors who care about making our building a wonderful place to live.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-20 space-y-32">
        
        {/* Story Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
              <img 
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80" 
                alt="Building exterior" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 w-64 aspect-square rounded-2xl overflow-hidden bg-secondary hidden md:block border-4 border-background shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80" 
                alt="Building interior" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div className="order-1 lg:order-2 lg:pl-12">
            <h2 className="text-3xl font-serif font-medium mb-6">Our Story</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
              <p>
                Established in 2018, Pavilion was built on the belief that a residential building should be more than just a place to sleep. It should be a place where people connect, look out for one another, and build a genuine sense of home.
              </p>
              <p>
                Our society was formed to manage the day-to-day operations of the building, but quickly evolved into a social hub. From summer rooftop barbecues to holiday lobby decorations, the society ensures our building feels alive and welcoming.
              </p>
              <p>
                Whether you've been here since the beginning or just moved in last week, you're an important part of what makes Pavilion special.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-serif font-medium mb-4">Our Values</h2>
            <p className="text-muted-foreground">The principles that guide how we live together and manage our shared spaces.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card border rounded-2xl p-8 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif font-medium mb-3">Community First</h3>
              <p className="text-muted-foreground leading-relaxed">
                We prioritize decisions that benefit the collective well-being of all residents, fostering an inclusive and supportive environment.
              </p>
            </div>
            
            <div className="bg-card border rounded-2xl p-8 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif font-medium mb-3">Respect & Care</h3>
              <p className="text-muted-foreground leading-relaxed">
                We treat our neighbors, staff, and shared spaces with respect, maintaining a peaceful and clean living environment for everyone.
              </p>
            </div>
            
            <div className="bg-card border rounded-2xl p-8 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif font-medium mb-3">Active Participation</h3>
              <p className="text-muted-foreground leading-relaxed">
                A community thrives when its members are engaged. We encourage everyone to attend events, share ideas, and contribute to the society.
              </p>
            </div>
          </div>
        </section>

        {/* Committee */}
        <section className="bg-secondary/30 rounded-3xl p-8 md:p-16 border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div>
              <h2 className="text-3xl font-serif font-medium mb-4">Building Committee</h2>
              <p className="text-muted-foreground max-w-xl">
                Elected annually by the residents, the committee volunteers their time to handle building maintenance, finances, and community events.
              </p>
            </div>
            <Link href="/contact">
              <Button variant="outline" className="rounded-full shrink-0 bg-background">Contact Committee</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { role: "President", name: "Sarah Jenkins", flat: "4A" },
              { role: "Treasurer", name: "David Chen", flat: "7C" },
              { role: "Secretary", name: "Elena Rodriguez", flat: "2B" },
              { role: "Social Chair", name: "Marcus Johnson", flat: "5D" }
            ].map((member, i) => (
              <div key={i} className="bg-background rounded-xl p-6 border shadow-sm text-center">
                <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 text-xl font-serif">
                  {member.name.charAt(0)}
                </div>
                <h3 className="font-medium text-lg mb-1">{member.name}</h3>
                <p className="text-sm text-primary font-medium mb-2">{member.role}</p>
                <p className="text-xs text-muted-foreground">Flat {member.flat}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
