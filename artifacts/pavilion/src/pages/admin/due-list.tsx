import React, { useState } from "react";
import { Download } from "lucide-react";
import { useGetDueList, getGetDueListQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv-export";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function DueList() {
  const [month, setMonth] = useState(currentMonth());
  const params = { month };
  const dueList = useGetDueList(params, { query: { queryKey: getGetDueListQueryKey(params) } });

  const totalDue = (dueList.data ?? []).reduce((sum, entry) => sum + entry.dueAmountPaise, 0);

  const handleExport = () => {
    if (!dueList.data) return;
    downloadCsv(
      `due-list-${month}.csv`,
      ["Building", "Flat", "Flat Type", "Expected", "Collected", "Due"],
      dueList.data.map((entry) => [
        entry.buildingName,
        entry.flatNumber,
        entry.flatType,
        (entry.expectedAmountPaise / 100).toFixed(2),
        (entry.collectedAmountPaise / 100).toFixed(2),
        (entry.dueAmountPaise / 100).toFixed(2),
      ]),
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-serif font-medium mb-1">Due List</h1>
            <p className="text-muted-foreground text-sm">Outstanding maintenance dues by flat for a given month.</p>
          </div>
          <div className="flex items-end gap-2">
            <div className="space-y-2">
              <Label htmlFor="due-list-month">Month</Label>
              <Input id="due-list-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <Button type="button" variant="outline" onClick={handleExport} disabled={!dueList.data?.length}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Outstanding: ₹{(totalDue / 100).toFixed(2)}</CardTitle>
            <CardDescription>{(dueList.data ?? []).length} flats</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {dueList.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : dueList.data && dueList.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Building</TableHead>
                    <TableHead>Flat</TableHead>
                    <TableHead>Flat Type</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Collected</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dueList.data.map((entry) => (
                    <TableRow key={entry.flatId}>
                      <TableCell>{entry.buildingName}</TableCell>
                      <TableCell className="font-medium">{entry.flatNumber}</TableCell>
                      <TableCell className="uppercase">{entry.flatType}</TableCell>
                      <TableCell>₹{(entry.expectedAmountPaise / 100).toFixed(2)}</TableCell>
                      <TableCell>₹{(entry.collectedAmountPaise / 100).toFixed(2)}</TableCell>
                      <TableCell>₹{(entry.dueAmountPaise / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={entry.dueAmountPaise > 0 ? "destructive" : "default"}>
                          {entry.dueAmountPaise > 0 ? "Due" : "Paid"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No flats found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
