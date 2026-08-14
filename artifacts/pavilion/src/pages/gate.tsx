import React, { useState } from "react";
import {
  useLookupVisit,
  useDecideVisit,
  type VisitLookupResult,
  type VisitVisitType,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const visitTypeLabels: Record<VisitVisitType, string> = {
  cab_delivery: "Cab / Delivery",
  guest: "Guest",
  household_help: "Household help",
  maintenance_staff: "Maintenance staff",
};

export default function Gate() {
  const { toast } = useToast();
  const [otpCode, setOtpCode] = useState("");
  const [found, setFound] = useState<VisitLookupResult | null>(null);
  const [decision, setDecision] = useState<"approved" | "denied" | null>(null);

  const lookup = useLookupVisit({
    mutation: {
      onSuccess: (visit) => {
        setFound(visit);
        setDecision(null);
      },
      onError: () => {
        setFound(null);
        toast({
          title: "No matching entry",
          description: "That code doesn't match a pending visitor entry, or it's expired.",
          variant: "destructive",
        });
      },
    },
  });

  const decide = useDecideVisit({
    mutation: {
      onSuccess: (visit) => {
        setDecision(visit.status === "approved" ? "approved" : "denied");
      },
      onError: () => {
        toast({
          title: "Couldn't record the decision",
          description: "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    lookup.mutate({ data: { otpCode } });
  };

  const reset = () => {
    setOtpCode("");
    setFound(null);
    setDecision(null);
  };

  return (
    <div className="w-full">
      <div className="bg-primary/5 py-16 border-b">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-2">Gate</h1>
          <p className="text-muted-foreground">Enter a visitor's OTP to review and approve entry.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16 max-w-xl">
        {!found && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Check a visitor OTP</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookup} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otpCode">OTP code</Label>
                  <Input
                    id="otpCode"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code from the visitor"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    title="Enter the 6-digit code"
                    autoFocus
                    required
                  />
                </div>
                <Button type="submit" disabled={lookup.isPending} className="w-full">
                  {lookup.isPending ? "Checking…" : "Check code"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {found && !decision && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visitor details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Visitor</dt>
                  <dd className="font-medium">{found.visitorName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium">{visitTypeLabels[found.visitType]}</dd>
                </div>
                {found.visitorPhone && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium">{found.visitorPhone}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Visiting</dt>
                  <dd className="font-medium">
                    {found.residentName} · Flat {found.residentFlatNumber}
                  </dd>
                </div>
              </dl>
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ id: found.id, data: { approve: true } })}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ id: found.id, data: { approve: false } })}
                >
                  Deny
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {decision && found && (
          <Card
            className={decision === "approved" ? "border-primary bg-primary/5" : "border-destructive"}
          >
            <CardHeader>
              <CardTitle className="text-lg">
                {found.visitorName} was {decision}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={reset} className="w-full">
                Check another visitor
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
