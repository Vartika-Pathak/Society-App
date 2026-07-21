import React from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DoorOpen, Wrench, MessageSquareWarning, CalendarCheck, Siren, ShieldCheck } from "lucide-react";

interface FeatureTile {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** When set, the tile links here instead of showing a "coming soon" toast. */
  href?: string;
}

const featureTiles: FeatureTile[] = [
  {
    title: "Entry",
    description: "Log a visitor — cab/delivery, guest, or household help — and share an entry OTP.",
    icon: DoorOpen,
    href: "/entry",
  },
  {
    title: "Maintenance",
    description: "Report a repair or maintenance issue, with photos, to the building staff.",
    icon: Wrench,
    href: "/maintenance",
  },
  {
    title: "Complain",
    description: "Raise a complaint about amenities, the lift, or anything else and track its status.",
    icon: MessageSquareWarning,
    href: "/complain",
  },
  {
    title: "Amenities",
    description: "Book a slot for shared amenities, with payment if the amenity requires it.",
    icon: CalendarCheck,
  },
  {
    title: "Emergency / Alerts",
    description: "Alert neighbors, the guard, and the admin immediately in an emergency.",
    icon: Siren,
  },
];

function FeatureTileCard({ tile }: { tile: FeatureTile }) {
  const { toast } = useToast();

  const card = (
    <Card
      role="button"
      tabIndex={0}
      onClick={
        tile.href
          ? undefined
          : () =>
              toast({
                title: `${tile.title} is coming soon`,
                description: "This feature isn't built yet — it's next on the list.",
              })
      }
      className="h-full cursor-pointer transition-colors hover:border-primary/50"
    >
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <tile.icon className="h-5 w-5" />
          </div>
          {!tile.href && <Badge variant="secondary">Coming soon</Badge>}
        </div>
        <CardTitle className="text-lg">{tile.title}</CardTitle>
        <CardDescription>{tile.description}</CardDescription>
      </CardHeader>
    </Card>
  );

  return tile.href ? <Link href={tile.href}>{card}</Link> : card;
}

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="w-full">
      <div className="bg-primary/5 py-16 border-b">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-2">
            Welcome, {user?.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Flat {user?.flatNumber} · {user?.email}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16">
        {(user?.role === "guard" || user?.role === "admin") && (
          <div className="mb-10">
            <h2 className="text-xl font-serif font-medium mb-6">Gate duty</h2>
            <Link href="/gate">
              <Card className="cursor-pointer border-primary bg-primary/5 hover:border-primary/70 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Gate</CardTitle>
                      <CardDescription>Check a visitor's OTP and approve or deny entry.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        )}

        <h2 className="text-xl font-serif font-medium mb-6">Resident features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureTiles.map((tile) => (
            <FeatureTileCard key={tile.title} tile={tile} />
          ))}
        </div>
      </div>
    </div>
  );
}
