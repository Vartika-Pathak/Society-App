import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListMaintenanceRates,
  useUpdateMaintenanceRate,
  useGetMaintenanceSettings,
  useUpdateMaintenanceSettings,
  getListMaintenanceRatesQueryKey,
  getGetMaintenanceSettingsQueryKey,
  type FlatFlatType,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const flatTypeLabels: Record<FlatFlatType, string> = {
  "1bhk": "1 BHK",
  "2bhk": "2 BHK",
  "3bhk": "3 BHK",
  "4bhk": "4 BHK",
};
const flatTypeOrder: FlatFlatType[] = ["1bhk", "2bhk", "3bhk", "4bhk"];

function RatesCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const rates = useListMaintenanceRates({ query: { queryKey: getListMaintenanceRatesQueryKey() } });
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!rates.data) return;
    setAmounts((prev) => {
      const next = { ...prev };
      for (const rate of rates.data) {
        if (!(rate.flatType in next)) next[rate.flatType] = (rate.monthlyAmountPaise / 100).toString();
      }
      return next;
    });
  }, [rates.data]);

  const update = useUpdateMaintenanceRate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMaintenanceRatesQueryKey() });
        toast({ title: "Maintenance rate updated" });
      },
      onError: (error) => {
        toast({
          title: "Couldn't update rate",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly Maintenance by Flat Type</CardTitle>
        <CardDescription>Set the recurring monthly maintenance amount charged to each flat type.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {flatTypeOrder.map((flatType) => (
            <form
              key={flatType}
              onSubmit={(e) => {
                e.preventDefault();
                const rupees = Number(amounts[flatType] ?? 0);
                update.mutate({ flatType, data: { monthlyAmountPaise: Math.round(rupees * 100) } });
              }}
              className="flex items-end gap-2"
            >
              <div className="space-y-2 flex-1">
                <Label htmlFor={`rate-${flatType}`}>{flatTypeLabels[flatType]} (₹/month)</Label>
                <Input
                  id={`rate-${flatType}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={amounts[flatType] ?? ""}
                  onChange={(e) => setAmounts((prev) => ({ ...prev, [flatType]: e.target.value }))}
                />
              </div>
              <Button type="submit" disabled={update.isPending}>
                Save
              </Button>
            </form>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const settings = useGetMaintenanceSettings({ query: { queryKey: getGetMaintenanceSettingsQueryKey() } });
  const [form, setForm] = useState({ dueDay: "10", lateFeePercent: "0", openingBalanceNote: "" });

  useEffect(() => {
    if (settings.data) {
      setForm({
        dueDay: String(settings.data.dueDay),
        lateFeePercent: String(settings.data.lateFeePercent),
        openingBalanceNote: settings.data.openingBalanceNote,
      });
    }
  }, [settings.data]);

  const update = useUpdateMaintenanceSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMaintenanceSettingsQueryKey() });
        toast({ title: "Maintenance settings updated" });
      },
      onError: (error) => {
        toast({
          title: "Couldn't update settings",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Due Date &amp; Late Fee</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate({
              data: {
                dueDay: Number(form.dueDay),
                lateFeePercent: Number(form.lateFeePercent),
                openingBalanceNote: form.openingBalanceNote,
              },
            });
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="space-y-2">
            <Label htmlFor="due-day">Due Day of Month</Label>
            <Input
              id="due-day"
              type="number"
              min={1}
              max={28}
              value={form.dueDay}
              onChange={(e) => setForm((f) => ({ ...f, dueDay: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="late-fee">Late Fee (%)</Label>
            <Input
              id="late-fee"
              type="number"
              min={0}
              max={100}
              value={form.lateFeePercent}
              onChange={(e) => setForm((f) => ({ ...f, lateFeePercent: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opening-balance-note">Opening Balance Note</Label>
            <Input
              id="opening-balance-note"
              placeholder="e.g. Carried forward from last society"
              value={form.openingBalanceNote}
              onChange={(e) => setForm((f) => ({ ...f, openingBalanceNote: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function MaintenanceSettings() {
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Maintenance Settings</h1>
          <p className="text-muted-foreground text-sm">Configure monthly maintenance rates, due date, and late fees.</p>
        </div>
        <RatesCard />
        <SettingsCard />
      </div>
    </AdminLayout>
  );
}
