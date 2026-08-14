import React, { useState } from "react";
import { Download } from "lucide-react";
import { useListMaintenanceCollections, getListMaintenanceCollectionsQueryKey } from "@workspace/api-client-react";
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

export default function MonthlyCollectionDetail() {
  const [month, setMonth] = useState(currentMonth());
  const params = { forMonth: month };
  const collections = useListMaintenanceCollections(params, {
    query: { queryKey: getListMaintenanceCollectionsQueryKey(params) },
  });

  const total = (collections.data ?? []).reduce((sum, c) => sum + c.amountPaise, 0);

  const handleExport = () => {
    if (!collections.data) return;
    downloadCsv(
      `monthly-collections-${month}.csv`,
      ["Building", "Flat", "Payer", "Amount", "Date", "Mode"],
      collections.data.map((c) => [c.buildingName, c.flatNumber, c.payerName, (c.amountPaise / 100).toFixed(2), c.paymentDate, c.paymentMode]),
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-serif font-medium mb-1">Monthly Collection Detail</h1>
            <p className="text-muted-foreground text-sm">Every maintenance payment recorded for a given month.</p>
          </div>
          <div className="flex items-end gap-2">
            <div className="space-y-2">
              <Label htmlFor="collections-month">Month</Label>
              <Input id="collections-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <Button type="button" variant="outline" onClick={handleExport} disabled={!collections.data?.length}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Collected: ₹{(total / 100).toFixed(2)}</CardTitle>
            <CardDescription>{(collections.data ?? []).length} payments</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {collections.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : collections.isError ? (
              <p className="text-destructive text-sm">Couldn't load collections — try refreshing the page.</p>
            ) : collections.data && collections.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Building</TableHead>
                    <TableHead>Flat</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Mode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.data.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.buildingName}</TableCell>
                      <TableCell className="font-medium">{c.flatNumber}</TableCell>
                      <TableCell>{c.payerName}</TableCell>
                      <TableCell>₹{(c.amountPaise / 100).toFixed(2)}</TableCell>
                      <TableCell>{formatDate(c.paymentDate)}</TableCell>
                      <TableCell className="capitalize">{c.paymentMode.replace("_", " ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No collections recorded for this month.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
