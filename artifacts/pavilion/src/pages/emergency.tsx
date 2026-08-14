import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Siren } from "lucide-react";
import {
  useRaiseEmergencyAlert,
  useGetMyEmergencyAlert,
  useListActiveEmergencyAlerts,
  useResolveEmergencyAlert,
  getGetMyEmergencyAlertQueryKey,
  getListActiveEmergencyAlertsQueryKey,
  type EmergencyAlert,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format-date";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

// Poll fairly often — an emergency alert should show up for everyone
// without them needing to manually refresh.
const POLL_INTERVAL_MS = 5000;

function AlertRow({ alert, canResolve }: { alert: EmergencyAlert; canResolve: boolean }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const resolve = useResolveEmergencyAlert({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListActiveEmergencyAlertsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyEmergencyAlertQueryKey() });
      },
      onError: () => {
        toast({
          title: "Couldn't mark this resolved",
          description: "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  return (
    <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <div>
        <p className="font-medium">
          {alert.residentName} · Flat {alert.residentFlatNumber}
        </p>
        <p className="text-sm text-muted-foreground">
          Raised {formatDateTime(alert.createdAt)}
        </p>
      </div>
      {canResolve && (
        <Button
          variant="outline"
          disabled={resolve.isPending}
          onClick={() => resolve.mutate({ id: alert.id })}
        >
          Help arrived
        </Button>
      )}
    </div>
  );
}

export default function Emergency() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const myAlert = useGetMyEmergencyAlert({
    query: { queryKey: getGetMyEmergencyAlertQueryKey(), refetchInterval: POLL_INTERVAL_MS },
  });

  const activeAlerts = useListActiveEmergencyAlerts({
    query: { queryKey: getListActiveEmergencyAlertsQueryKey(), refetchInterval: POLL_INTERVAL_MS },
  });

  const raise = useRaiseEmergencyAlert({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyEmergencyAlertQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListActiveEmergencyAlertsQueryKey() });
      },
      onError: () => {
        toast({
          title: "Couldn't raise the alert",
          description: "Please try again, or contact the guard directly.",
          variant: "destructive",
        });
      },
    },
  });

  const resolveMine = useResolveEmergencyAlert({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyEmergencyAlertQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListActiveEmergencyAlertsQueryKey() });
        toast({ title: "Alert stopped", description: "Glad you're okay." });
      },
    },
  });

  const isStaff = user?.role === "guard" || user?.role === "admin";
  const otherActiveAlerts = (activeAlerts.data ?? []).filter((a) => a.id !== myAlert.data?.id);

  return (
    <div className="w-full">
      <div className="bg-destructive/10 py-16 border-b border-destructive/20">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-2">Emergency / Alerts</h1>
          <p className="text-muted-foreground">
            Alert neighbors, the guard, and the admin immediately in an emergency.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16 max-w-2xl space-y-10">
        {!isStaff && (
          <Card className={myAlert.data ? "border-destructive bg-destructive/5" : undefined}>
            <CardContent className="pt-6">
              {myAlert.data ? (
                <div className="text-center space-y-4">
                  <Siren className="h-10 w-10 text-destructive mx-auto animate-pulse" />
                  <div>
                    <p className="text-lg font-medium">Your alert is active</p>
                    <p className="text-sm text-muted-foreground">
                      Neighbors, the guard, and the admin have been notified. Help should be on
                      the way.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={resolveMine.isPending}
                    onClick={() => myAlert.data && resolveMine.mutate({ id: myAlert.data.id })}
                  >
                    Help has arrived — stop alert
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <Siren className="h-10 w-10 text-destructive mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Tap below only in a real emergency. Neighbors, the guard, and the admin will
                    be alerted immediately.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="lg" className="w-full">
                        Raise emergency alert
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Raise an emergency alert?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This immediately notifies every neighbor, the guard, and the admin that
                          you need help.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => raise.mutate()}
                        >
                          Yes, raise the alert
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-lg font-serif font-medium mb-4">
            {isStaff ? "Active alerts" : "Other active alerts"}
          </h2>
          {activeAlerts.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : activeAlerts.isError ? (
            <p className="text-destructive text-sm">Couldn't load alerts — try refreshing the page.</p>
          ) : (isStaff ? activeAlerts.data : otherActiveAlerts)?.length ? (
            <div className="space-y-3">
              {(isStaff ? activeAlerts.data! : otherActiveAlerts).map((alert) => (
                <AlertRow key={alert.id} alert={alert} canResolve={isStaff} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No active alerts right now.</p>
          )}
        </div>
      </div>
    </div>
  );
}
