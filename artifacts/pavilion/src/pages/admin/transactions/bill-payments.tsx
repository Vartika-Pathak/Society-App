import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import {
  useListBillPayments,
  useCreateBillPayment,
  useDeleteBillPayment,
  useListVendorBills,
  getListBillPaymentsQueryKey,
  getListVendorBillsQueryKey,
  type BillPaymentPaymentMode,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const paymentModeLabels: Record<BillPaymentPaymentMode, string> = {
  cash: "Cash",
  cheque: "Cheque",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
};

const emptyForm = {
  vendorBillId: "",
  amountRupees: "",
  paymentDate: "",
  paymentMode: "cash" as BillPaymentPaymentMode,
  referenceNumber: "",
  notes: "",
};

export default function BillPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);

  const payments = useListBillPayments(undefined, { query: { queryKey: getListBillPaymentsQueryKey() } });
  const bills = useListVendorBills({ query: { queryKey: getListVendorBillsQueryKey() } });

  const billsById = new Map((bills.data ?? []).map((b) => [b.id, b]));

  const onMutated = (message: string) => {
    queryClient.invalidateQueries({ queryKey: getListBillPaymentsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListVendorBillsQueryKey() });
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

  const create = useCreateBillPayment({
    mutation: { onSuccess: () => onMutated("Payment recorded"), onError: onError("Couldn't record payment") },
  });
  const remove = useDeleteBillPayment({
    mutation: { onSuccess: () => onMutated("Payment deleted"), onError: onError("Couldn't delete payment") },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendorBillId) return;
    create.mutate({
      data: {
        vendorBillId: Number(form.vendorBillId),
        amountPaise: Math.round(Number(form.amountRupees) * 100),
        paymentDate: form.paymentDate,
        paymentMode: form.paymentMode,
        referenceNumber: form.referenceNumber || undefined,
        notes: form.notes || undefined,
      },
    });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Bill Payments</h1>
          <p className="text-muted-foreground text-sm">Record payments made against vendor bills.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Bill Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Vendor Bill</Label>
                <Select value={form.vendorBillId} onValueChange={(v) => setForm((f) => ({ ...f, vendorBillId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor bill" />
                  </SelectTrigger>
                  <SelectContent>
                    {bills.data?.map((bill) => (
                      <SelectItem key={bill.id} value={String(bill.id)}>
                        {bill.billNumber} — {bill.vendorName} (₹{(bill.amountPaise / 100).toFixed(2)}, paid ₹
                        {(bill.paidAmountPaise / 100).toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Amount (₹)</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.amountRupees}
                  onChange={(e) => setForm((f) => ({ ...f, amountRupees: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-date">Payment Date</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select
                  value={form.paymentMode}
                  onValueChange={(v) => setForm((f) => ({ ...f, paymentMode: v as BillPaymentPaymentMode }))}
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
                <Label htmlFor="payment-reference">Reference Number</Label>
                <Input
                  id="payment-reference"
                  placeholder="Optional"
                  value={form.referenceNumber}
                  onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="payment-notes">Notes</Label>
                <Input
                  id="payment-notes"
                  placeholder="Optional"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={create.isPending || !form.vendorBillId}>
                  {create.isPending ? "Recording…" : "Record Payment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            {payments.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : payments.data && payments.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.data.map((payment) => {
                    const bill = billsById.get(payment.vendorBillId);
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{bill?.billNumber ?? `#${payment.vendorBillId}`}</TableCell>
                        <TableCell>{bill?.vendorName ?? "—"}</TableCell>
                        <TableCell>₹{(payment.amountPaise / 100).toFixed(2)}</TableCell>
                        <TableCell>{payment.paymentDate}</TableCell>
                        <TableCell>{paymentModeLabels[payment.paymentMode]}</TableCell>
                        <TableCell>{payment.referenceNumber || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={remove.isPending}
                            onClick={() => remove.mutate({ id: payment.id })}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No bill payments yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
