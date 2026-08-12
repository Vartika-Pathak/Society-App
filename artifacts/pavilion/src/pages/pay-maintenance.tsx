import React, { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMyMaintenanceDue,
  usePayMaintenance,
  useConfirmMaintenancePayment,
  getGetMyMaintenanceDueQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, CheckCircle2 } from "lucide-react";

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function hasStatus(error: unknown): error is { status: number } {
  return typeof error === "object" && error !== null && typeof (error as { status?: unknown }).status === "number";
}

export default function PayMaintenance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const confirmedRef = useRef(false);

  const due = useGetMyMaintenanceDue({ query: { queryKey: getGetMyMaintenanceDueQueryKey(), retry: false } });

  const pay = usePayMaintenance({
    mutation: {
      onSuccess: (result) => {
        if (result.status === "nothing_due") {
          toast({ title: "Nothing due", description: "This month is already fully paid." });
          queryClient.invalidateQueries({ queryKey: getGetMyMaintenanceDueQueryKey() });
        } else if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        }
      },
      onError: (error) => {
        toast({
          title: "Couldn't start payment",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const confirm = useConfirmMaintenancePayment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyMaintenanceDueQueryKey() });
        toast({ title: "Payment received", description: "This month's maintenance is now paid." });
      },
      onError: (error) => {
        toast({
          title: "We couldn't confirm that payment",
          description: error instanceof Error ? error.message : "Please contact the committee.",
          variant: "destructive",
        });
      },
    },
  });

  // Coming back from Stripe Checkout: confirm the payment once, then strip the
  // session_id out of the URL so a page refresh doesn't re-run it.
  useEffect(() => {
    if (confirmedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) return;
    confirmedRef.current = true;
    confirm.mutate({ data: { sessionId } });
    params.delete("session_id");
    const newSearch = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (newSearch ? `?${newSearch}` : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notFound = hasStatus(due.error) && due.error.status === 404;

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium mb-1">Pay Maintenance</h1>
        <p className="text-muted-foreground text-sm">Pay this month's maintenance due for your flat.</p>
      </div>

      {due.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : notFound ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">No flat assigned yet</p>
            <p className="text-muted-foreground text-sm">
              The admin hasn't linked your account to a flat yet, so there's nothing to pay against.
            </p>
          </CardContent>
        </Card>
      ) : due.data ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {due.data.flatNumber}
                  {due.data.buildingName ? `, ${due.data.buildingName}` : ""}
                </CardTitle>
                <CardDescription>{due.data.forMonth}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Expected</p>
                <p className="font-medium mt-1">{formatRupees(due.data.expectedAmountPaise)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Collected</p>
                <p className="font-medium mt-1">{formatRupees(due.data.collectedAmountPaise)}</p>
              </div>
            </div>

            {due.data.dueAmountPaise <= 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4 text-primary">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">This month is fully paid.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-muted-foreground text-sm">Amount due</p>
                  <p className="text-2xl font-serif font-medium">{formatRupees(due.data.dueAmountPaise)}</p>
                </div>
                <Button type="button" className="w-full" disabled={pay.isPending} onClick={() => pay.mutate()}>
                  {pay.isPending ? "Starting payment…" : `Pay ${formatRupees(due.data.dueAmountPaise)}`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-destructive text-sm">Couldn't load your maintenance due — try refreshing the page.</p>
      )}
    </div>
  );
}
