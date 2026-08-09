import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, History } from "lucide-react";
import {
  useListMaintenanceCollections,
  useCreateMaintenanceCollection,
  useDeleteMaintenanceCollection,
  useBackfillMaintenanceCollections,
  useListFlats,
  getListMaintenanceCollectionsQueryKey,
  getListFlatsQueryKey,
  type MaintenanceCollectionPaymentMode,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const paymentModeLabels: Record<MaintenanceCollectionPaymentMode, string> = {
  cash: "Cash",
  cheque: "Cheque",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  online: "Online (Stripe)",
};

const emptyForm = {
  flatId: "",
  payerName: "",
  amountRupees: "",
  paymentDate: "",
  paymentMode: "cash" as MaintenanceCollectionPaymentMode,
  forMonth: "",
  referenceNumber: "",
  notes: "",
};

export default function MaintenanceCollections() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [historyFlatId, setHistoryFlatId] = useState<string>("all");

  const flats = useListFlats({ query: { queryKey: getListFlatsQueryKey() } });
  const collectionsParams = { flatId: historyFlatId !== "all" ? Number(historyFlatId) : undefined };
  const collections = useListMaintenanceCollections(collectionsParams, {
    query: { queryKey: getListMaintenanceCollectionsQueryKey(collectionsParams) },
  });

  const onMutated = (message: string) => {
    queryClient.invalidateQueries({ queryKey: getListMaintenanceCollectionsQueryKey() });
    toast({ title: message });
    setForm(emptyForm);
  };

  const onError = (title: string) => (error: unknown) => {
    toast({
      title,
      description: error instanceof Error ? error.message : "Please try again.",
      variant: "destructive",
    });
  };

  const create = useCreateMaintenanceCollection({
    mutation: { onSuccess: () => onMutated("Payment recorded"), onError: onError("Couldn't record payment") },
  });
  const remove = useDeleteMaintenanceCollection({
    mutation: { onSuccess: () => onMutated("Payment deleted"), onError: onError("Couldn't delete payment") },
  });
  const backfill = useBackfillMaintenanceCollections({
    mutation: {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getListMaintenanceCollectionsQueryKey() });
        toast({
          title: "Backfill complete",
          description: `${result.createdCount} payments added across ${result.monthsBackfilled.join(", ")} (${result.skippedCount} left unpaid or already recorded).`,
        });
      },
      onError: onError("Couldn't backfill past months"),
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.flatId) return;
    create.mutate({
      data: {
        flatId: Number(form.flatId),
        payerName: form.payerName,
        amountPaise: Math.round(Number(form.amountRupees) * 100),
        paymentDate: form.paymentDate,
        paymentMode: form.paymentMode,
        forMonth: form.forMonth,
        referenceNumber: form.referenceNumber || undefined,
        notes: form.notes || undefined,
      },
    });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-medium mb-1">Maintenance Collections</h1>
            <p className="text-muted-foreground text-sm">Record maintenance payments received from residents.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={backfill.isPending || !flats.data?.length}
            onClick={() => backfill.mutate({ data: { months: 3 } })}
          >
            <History className="h-4 w-4 mr-2" />
            {backfill.isPending ? "Backfilling…" : "Backfill past 3 months"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Record Maintenance Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Flat</Label>
                <Select value={form.flatId} onValueChange={(v) => setForm((f) => ({ ...f, flatId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a flat" />
                  </SelectTrigger>
                  <SelectContent>
                    {flats.data?.map((flat) => (
                      <SelectItem key={flat.id} value={String(flat.id)}>
                        {flat.buildingName} — {flat.flatNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payer-name">Payer Name</Label>
                <Input
                  id="payer-name"
                  value={form.payerName}
                  onChange={(e) => setForm((f) => ({ ...f, payerName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection-amount">Amount (₹)</Label>
                <Input
                  id="collection-amount"
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.amountRupees}
                  onChange={(e) => setForm((f) => ({ ...f, amountRupees: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection-date">Payment Date</Label>
                <Input
                  id="collection-date"
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection-month">For Month</Label>
                <Input
                  id="collection-month"
                  type="month"
                  value={form.forMonth}
                  onChange={(e) => setForm((f) => ({ ...f, forMonth: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select
                  value={form.paymentMode}
                  onValueChange={(v) => setForm((f) => ({ ...f, paymentMode: v as MaintenanceCollectionPaymentMode }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentModeLabels).map(([mode, label]) => (
                      <SelectItem key={mode} value={mode}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection-reference">Reference Number</Label>
                <Input
                  id="collection-reference"
                  placeholder="Optional"
                  value={form.referenceNumber}
                  onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection-notes">Notes</Label>
                <Input
                  id="collection-notes"
                  placeholder="Optional"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={create.isPending || !form.flatId}>
                  {create.isPending ? "Recording…" : "Record Payment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Member Payment History</CardTitle>
            <div className="pt-2 max-w-xs">
              <Select value={historyFlatId} onValueChange={setHistoryFlatId}>
                <SelectTrigger>
                  <SelectValue placeholder="All flats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All flats</SelectItem>
                  {flats.data?.map((flat) => (
                    <SelectItem key={flat.id} value={String(flat.id)}>
                      {flat.buildingName} — {flat.flatNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {collections.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : collections.data && collections.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flat</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>For Month</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.data.map((collection) => (
                    <TableRow key={collection.id}>
                      <TableCell className="font-medium">
                        {collection.buildingName} — {collection.flatNumber}
                      </TableCell>
                      <TableCell>{collection.payerName}</TableCell>
                      <TableCell>₹{(collection.amountPaise / 100).toFixed(2)}</TableCell>
                      <TableCell>{collection.paymentDate}</TableCell>
                      <TableCell>{collection.forMonth}</TableCell>
                      <TableCell>{paymentModeLabels[collection.paymentMode]}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate({ id: collection.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No maintenance collections yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
