import React, { useEffect, useState } from "react";
import {
  useListAllVisits,
  getListAllVisitsQueryKey,
  type VisitLogEntryVisitType,
} from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const visitTypeLabels: Record<VisitLogEntryVisitType, string> = {
  cab_delivery: "Cab / Delivery",
  guest: "Guest",
  household_help: "Household help",
  maintenance_staff: "Maintenance staff",
};

const statusVariants: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  awaiting_verification: "outline",
  pending: "secondary",
  approved: "default",
  denied: "destructive",
};

const statusLabels: Record<string, string> = {
  awaiting_verification: "Awaiting verification",
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const SHOW_ALL = "all";

export default function EntryLog() {
  const visits = useListAllVisits({ query: { queryKey: getListAllVisitsQueryKey() } });
  const [pageSize, setPageSize] = useState<string>("10");
  const [page, setPage] = useState(0);

  const total = visits.data?.length ?? 0;
  const effectivePageSize = pageSize === SHOW_ALL ? Math.max(total, 1) : Number(pageSize);
  const pageCount = Math.max(1, Math.ceil(total / effectivePageSize));

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  const pageStart = page * effectivePageSize;
  const visibleVisits = visits.data?.slice(pageStart, pageStart + effectivePageSize) ?? [];

  return (
    <div className="w-full">
      <div className="bg-primary/5 py-16 border-b">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-2">Entry Log</h1>
          <p className="text-muted-foreground">
            Everyone who's entered the society, labelled by type, and who invited them.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16 max-w-5xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
            <CardDescription>{total} entr{total === 1 ? "y" : "ies"} total</CardDescription>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <Select
                value={pageSize}
                onValueChange={(value) => {
                  setPageSize(value);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                  <SelectItem value={SHOW_ALL}>All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {visits.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : visits.isError ? (
              <p className="text-destructive text-sm">Couldn't load the entry log — try refreshing the page.</p>
            ) : total > 0 ? (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visitor</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invited by</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleVisits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell className="font-medium">{visit.visitorName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{visitTypeLabels[visit.visitType]}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariants[visit.status]}>
                            {statusLabels[visit.status] ?? visit.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {visit.residentName} · Flat {visit.residentFlatNumber}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{visit.visitorPhone ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {new Date(visit.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {pageCount > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {page + 1} of {pageCount}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={page === 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={page >= pageCount - 1}
                        onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No entries logged yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
