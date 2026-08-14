import React, { useState } from "react";
import { Download } from "lucide-react";
import { useListVendorBills, getListVendorBillsQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv-export";
import { formatDate } from "@/lib/format-date";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function MonthlyExpenditureReport() {
  const [month, setMonth] = useState(currentMonth());
  const params = { month };
  const bills = useListVendorBills(params, { query: { queryKey: getListVendorBillsQueryKey(params) } });

  const total = (bills.data ?? []).reduce((sum, b) => sum + b.amountPaise, 0);

  const handleExport = () => {
    if (!bills.data) return;
    downloadCsv(
      `monthly-expenditure-${month}.csv`,
      ["Bill #", "Vendor", "Category", "Bill Date", "Amount", "Status"],
      bills.data.map((b) => [b.billNumber, b.vendorName, b.expenseCategoryName, b.billDate, (b.amountPaise / 100).toFixed(2), b.status]),
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-serif font-medium mb-1">Monthly Expenditure Report</h1>
            <p className="text-muted-foreground text-sm">Every vendor bill dated within a given month.</p>
          </div>
          <div className="flex items-end gap-2">
            <div className="space-y-2">
              <Label htmlFor="expenditure-month">Month</Label>
              <Input id="expenditure-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <Button type="button" variant="outline" onClick={handleExport} disabled={!bills.data?.length}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Billed: ₹{(total / 100).toFixed(2)}</CardTitle>
            <CardDescription>{(bills.data ?? []).length} bills</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {bills.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : bills.isError ? (
              <p className="text-destructive text-sm">Couldn't load bills — try refreshing the page.</p>
            ) : bills.data && bills.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Bill Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.data.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.billNumber}</TableCell>
                      <TableCell>{b.vendorName}</TableCell>
                      <TableCell>{b.expenseCategoryName}</TableCell>
                      <TableCell>{formatDate(b.billDate)}</TableCell>
                      <TableCell>₹{(b.amountPaise / 100).toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{b.status.replace("_", " ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No expenses recorded for this month.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
