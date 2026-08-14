import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Check, ShieldCheck } from "lucide-react";
import {
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
import { apiPost, ApiFetchError } from "@/lib/api-fetch";
import { formatDateTime } from "@/lib/format-date";

const visitTypeLabels: Record<VisitVisitType, string> = {
  cab_delivery: "Cab / Delivery",
  guest: "Guest",
  household_help: "Household help",
  maintenance_staff: "Maintenance staff",
};

// "awaiting_verification" only exists on backends (Java) that email the
// visitor an OTP the resident has to confirm before the entry is usable at
// the gate — it isn't part of the generated Visit status union, so this is
// typed loosely rather than narrowed to Visit["status"].
const statusVariants: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  awaiting_verification: "outline",
  pending: "secondary",
  approved: "default",
  denied: "destructive",
};

const statusLabels: Record<string, string> = {
  awaiting_verification: "Awaiting verification",
};

// A subset of Visit fields, hand-typed because the create/confirm endpoints
// go through apiPost rather than the generated client (see api-fetch.ts).
// `status` is widened to `string` since the Java backend's "awaiting_verification"
// value isn't part of the generated Visit["status"] union.
type VisitLike = Pick<
  Visit,
  "id" | "visitType" | "visitorName" | "visitorPhone" | "otpCode" | "expiresAt" | "createdAt"
> & { status: string };

function OtpDisplay({ visit, onDismiss }: { visit: VisitLike; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!visit.otpCode) return;
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
          Valid until {formatDateTime(visit.expiresAt)}. The gate guard will ask for
          this code.
        </p>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Log another visitor
        </Button>
      </CardContent>
    </Card>
  );
}

function ConfirmOtp({
  visit,
  onConfirmed,
  onCancel,
}: {
  visit: VisitLike;
  onConfirmed: (visit: VisitLike) => void;
  onCancel: () => void;
}) {
  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const confirmed = await apiPost<VisitLike>(`/api/visits/${visit.id}/confirm`, { otpCode });
      onConfirmed(confirmed);
    } catch (err) {
      setError(err instanceof ApiFetchError ? err.message : "Couldn't verify that code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Confirm {visit.visitorName}'s email</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          We emailed a code to the address you gave us. Ask {visit.visitorName} for it and enter it
          here — this proves the email is real and gives them the same code the gate guard will ask for.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirmOtp">Verification code</Label>
            <Input
              id="confirmOtp"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              pattern="[0-9]{6}"
              title="Enter the 6-digit code"
              autoFocus
              required
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Confirming…" : "Confirm"}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
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
  const [visitorEmail, setVisitorEmail] = useState("");
  const [justCreated, setJustCreated] = useState<VisitLike | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myVisits = useListMyVisits();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const visit = await apiPost<VisitLike>("/api/visits", {
        visitType,
        visitorName,
        visitorPhone,
        visitorEmail: visitorEmail || undefined,
      });
      queryClient.invalidateQueries({ queryKey: getListMyVisitsQueryKey() });
      setJustCreated(visit);
      setVisitorName("");
      setVisitorPhone("");
      setVisitorEmail("");
    } catch (error) {
      toast({
        title: "Couldn't log the visitor",
        description: error instanceof ApiFetchError ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        {justCreated && justCreated.status === "awaiting_verification" ? (
          <ConfirmOtp
            visit={justCreated}
            onConfirmed={(visit) => {
              setJustCreated(visit);
              queryClient.invalidateQueries({ queryKey: getListMyVisitsQueryKey() });
            }}
            onCancel={() => setJustCreated(null)}
          />
        ) : justCreated ? (
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
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
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
                    pattern="[A-Za-z ]{2,100}"
                    title="Letters and spaces only"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitorPhone">Phone</Label>
                  <Input
                    id="visitorPhone"
                    type="tel"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="For the gate to reach them if needed"
                    inputMode="numeric"
                    pattern="[6-9][0-9]{9}"
                    title="10-digit mobile number starting with 6-9"
                    maxLength={10}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitorEmail">Email (optional)</Label>
                  <Input
                    id="visitorEmail"
                    type="email"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    placeholder="We'll email them the OTP — you'll need to confirm it"
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Generating OTP…" : "Generate OTP"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-lg font-serif font-medium mb-4">Your recent entries</h2>
          {myVisits.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : myVisits.isError ? (
            <p className="text-destructive text-sm">Couldn't load your entries — try refreshing the page.</p>
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
                      {visitTypeLabels[visit.visitType]} · {formatDateTime(visit.createdAt)}
                    </p>
                  </div>
                  <Badge variant={statusVariants[visit.status]}>{statusLabels[visit.status] ?? visit.status}</Badge>
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
