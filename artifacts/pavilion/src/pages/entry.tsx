import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Check } from "lucide-react";
import {
  useCreateVisit,
  useListMyVisits,
  getListMyVisitsQueryKey,
  type Visit,
  type VisitVisitType,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

const visitTypeLabels: Record<VisitVisitType, string> = {
  cab_delivery: "Cab / Delivery",
  guest: "Guest",
  household_help: "Household help",
};

const statusVariants: Record<Visit["status"], "secondary" | "default" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  denied: "destructive",
};

function OtpDisplay({ visit, onDismiss }: { visit: Visit; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(visit.otpCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-primary bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg">Share this OTP with {visit.visitorName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-4xl font-mono font-bold tracking-widest">{visit.otpCode}</span>
          <Button variant="outline" size="icon" onClick={copy} aria-label="Copy OTP">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Valid until {new Date(visit.expiresAt).toLocaleString()}. The gate guard will ask for
          this code.
        </p>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Log another visitor
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Entry() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [visitType, setVisitType] = useState<VisitVisitType>("guest");
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [justCreated, setJustCreated] = useState<Visit | null>(null);

  const createVisit = useCreateVisit({
    mutation: {
      onSuccess: (visit) => {
        queryClient.invalidateQueries({ queryKey: getListMyVisitsQueryKey() });
        setJustCreated(visit);
        setVisitorName("");
        setVisitorPhone("");
      },
      onError: () => {
        toast({
          title: "Couldn't log the visitor",
          description: "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const myVisits = useListMyVisits();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVisit.mutate({
      data: {
        visitType,
        visitorName,
        visitorPhone: visitorPhone || undefined,
      },
    });
  };

  return (
    <div className="w-full">
      <div className="bg-primary/5 py-16 border-b">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-2">Entry</h1>
          <p className="text-muted-foreground">
            Log a visitor and get an OTP to share with them for the gate.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16 max-w-2xl space-y-8">
        {justCreated ? (
          <OtpDisplay visit={justCreated} onDismiss={() => setJustCreated(null)} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Log a visitor</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Visitor type</Label>
                  <RadioGroup
                    value={visitType}
                    onValueChange={(v) => setVisitType(v as VisitVisitType)}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    {(Object.keys(visitTypeLabels) as VisitVisitType[]).map((type) => (
                      <Label
                        key={type}
                        htmlFor={type}
                        className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer ${
                          visitType === type ? "border-primary bg-primary/5" : ""
                        }`}
                      >
                        <RadioGroupItem value={type} id={type} />
                        {visitTypeLabels[type]}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitorName">Visitor name</Label>
                  <Input
                    id="visitorName"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Name the guard should expect"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitorPhone">Phone (optional)</Label>
                  <Input
                    id="visitorPhone"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    placeholder="For the gate to reach them if needed"
                  />
                </div>

                <Button type="submit" disabled={createVisit.isPending} className="w-full">
                  {createVisit.isPending ? "Generating OTP…" : "Generate OTP"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-lg font-serif font-medium mb-4">Your recent entries</h2>
          {myVisits.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : myVisits.data && myVisits.data.length > 0 ? (
            <div className="space-y-3">
              {myVisits.data.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{visit.visitorName}</p>
                    <p className="text-sm text-muted-foreground">
                      {visitTypeLabels[visit.visitType]} · {new Date(visit.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={statusVariants[visit.status]}>{visit.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No visitor entries yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
