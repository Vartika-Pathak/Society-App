import React from "react";
import { useListAuditLogs, getListAuditLogsQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const methodVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  POST: "default",
  PUT: "secondary",
  PATCH: "secondary",
  DELETE: "destructive",
};

export default function AuditLogs() {
  const logs = useListAuditLogs({ query: { queryKey: getListAuditLogsQueryKey() } });

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Audit Logs</h1>
          <p className="text-muted-foreground text-sm">Every admin create/update/delete action, captured automatically.</p>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>Most recent {logs.data?.length ?? 0} entries</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {logs.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : logs.data && logs.data.length > 0 ? (
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
                  {logs.data.map((log) => (
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
            ) : (
              <p className="text-muted-foreground text-sm">No audit log entries yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
