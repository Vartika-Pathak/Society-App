import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListVendorBills,
  useCreateVendorBill,
  useDeleteVendorBill,
  useListVendors,
  useListExpenseCategories,
  getListVendorBillsQueryKey,
  getListVendorsQueryKey,
  getListExpenseCategoriesQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const emptyForm = {
  vendorId: "",
  expenseCategoryId: "",
  billNumber: "",
  billDate: "",
  amountRupees: "",
  description: "",
};

const statusVariants: Record<string, "default" | "secondary" | "outline"> = {
  paid: "default",
  partially_paid: "secondary",
  unpaid: "outline",
};
const statusLabels: Record<string, string> = {
  paid: "Paid",
  partially_paid: "Partially Paid",
  unpaid: "Unpaid",
};

export default function MaintenanceExpenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);

  const bills = useListVendorBills({ query: { queryKey: getListVendorBillsQueryKey() } });
  const vendors = useListVendors({ query: { queryKey: getListVendorsQueryKey() } });
  const expenseCategories = useListExpenseCategories({ query: { queryKey: getListExpenseCategoriesQueryKey() } });

  const onMutated = (message: string) => {
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

  const create = useCreateVendorBill({
    mutation: { onSuccess: () => onMutated("Vendor bill added"), onError: onError("Couldn't add vendor bill") },
  });
  const remove = useDeleteVendorBill({
    mutation: { onSuccess: () => onMutated("Vendor bill deleted"), onError: onError("Couldn't delete vendor bill") },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendorId || !form.expenseCategoryId) return;
    create.mutate({
      data: {
        vendorId: Number(form.vendorId),
        expenseCategoryId: Number(form.expenseCategoryId),
        billNumber: form.billNumber,
        billDate: form.billDate,
        amountPaise: Math.round(Number(form.amountRupees) * 100),
        description: form.description || undefined,
      },
    });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Maintenance Expenses</h1>
          <p className="text-muted-foreground text-sm">Record vendor bills for maintenance expenses.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create New Maintenance Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select value={form.vendorId} onValueChange={(v) => setForm((f) => ({ ...f, vendorId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.data?.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expense Category</Label>
                <Select value={form.expenseCategoryId} onValueChange={(v) => setForm((f) => ({ ...f, expenseCategoryId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an expense category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.data?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bill-number">Bill Number</Label>
                <Input
                  id="bill-number"
                  value={form.billNumber}
                  onChange={(e) => setForm((f) => ({ ...f, billNumber: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bill-date">Bill Date</Label>
                <Input
                  id="bill-date"
                  type="date"
                  value={form.billDate}
                  onChange={(e) => setForm((f) => ({ ...f, billDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bill-amount">Amount (₹)</Label>
                <Input
                  id="bill-amount"
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.amountRupees}
                  onChange={(e) => setForm((f) => ({ ...f, amountRupees: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bill-description">Description</Label>
                <Input
                  id="bill-description"
                  placeholder="Optional notes"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={create.isPending || !form.vendorId || !form.expenseCategoryId}>
                  {create.isPending ? "Saving…" : "Create Expense"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            {bills.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : bills.data && bills.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Bill Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.data.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">{bill.billNumber}</TableCell>
                      <TableCell>{bill.vendorName}</TableCell>
                      <TableCell>{bill.expenseCategoryName}</TableCell>
                      <TableCell>{bill.billDate}</TableCell>
                      <TableCell>₹{(bill.amountPaise / 100).toFixed(2)}</TableCell>
                      <TableCell>₹{(bill.paidAmountPaise / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[bill.status]}>{statusLabels[bill.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate({ id: bill.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No maintenance expenses yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
