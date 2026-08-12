import React, { useEffect, useState } from "react";
import { useListAuditLogs, getListAuditLogsQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin-layout";
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

const methodVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  POST: "default",
  PUT: "secondary",
  PATCH: "secondary",
  DELETE: "destructive",
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const SHOW_ALL = "all";

export default function AuditLogs() {
  const logs = useListAuditLogs({ query: { queryKey: getListAuditLogsQueryKey() } });
  const [pageSize, setPageSize] = useState<string>("10");
  const [page, setPage] = useState(0);

  const total = logs.data?.length ?? 0;
  const effectivePageSize = pageSize === SHOW_ALL ? Math.max(total, 1) : Number(pageSize);
  const pageCount = Math.max(1, Math.ceil(total / effectivePageSize));

  // Land back on a valid page whenever the page size changes or the log count shrinks/grows
  // (e.g. after a refetch) so we never render an out-of-range slice.
  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  const pageStart = page * effectivePageSize;
  const visibleLogs = logs.data?.slice(pageStart, pageStart + effectivePageSize) ?? [];

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Audit Logs</h1>
          <p className="text-muted-foreground text-sm">Every admin create/update/delete action, captured automatically.</p>
        </div>

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
            {logs.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : logs.isError ? (
              <p className="text-destructive text-sm">Couldn't load audit logs — try refreshing the page.</p>
            ) : total > 0 ? (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Path</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{log.adminName}</TableCell>
                        <TableCell>
                          <Badge variant={methodVariants[log.method] ?? "outline"}>{log.method}</Badge>
                        </TableCell>
                        <TableCell>{log.summary}</TableCell>
                        <TableCell className="text-muted-foreground">{log.path}</TableCell>
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
              <p className="text-muted-foreground text-sm">No audit log entries yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
