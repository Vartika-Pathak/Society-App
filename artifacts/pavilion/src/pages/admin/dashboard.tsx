import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  useGetDashboardSummary,
  getGetDashboardSummaryQueryKey,
  useListComplaints,
  useUpdateComplaintStatus,
  getListComplaintsQueryKey,
  type Complaint,
  type ComplaintStatus,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const flatTypeLabels: Record<string, string> = { "1bhk": "1 BHK", "2bhk": "2 BHK", "3bhk": "3 BHK", "4bhk": "4 BHK" };

const statusVariants: Record<ComplaintStatus, "default" | "secondary" | "outline"> = {
  open: "outline",
  in_progress: "secondary",
  resolved: "default",
};

function StatCard({ label, valuePaise }: { label: string; valuePaise: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">₹{(valuePaise / 100).toFixed(2)}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function ComplaintsCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const complaints = useListComplaints({ query: { queryKey: getListComplaintsQueryKey() } });
  const [responding, setResponding] = useState<Complaint | null>(null);
  const [status, setStatus] = useState<ComplaintStatus>("in_progress");
  const [resolutionNote, setResolutionNote] = useState("");

  const update = useUpdateComplaintStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListComplaintsQueryKey() });
        toast({ title: "Complaint updated" });
        setResponding(null);
      },
      onError: (error) => {
        toast({
          title: "Couldn't update complaint",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const openResponse = (complaint: Complaint) => {
    setResponding(complaint);
    setStatus(complaint.status === "open" ? "in_progress" : complaint.status);
    setResolutionNote(complaint.resolutionNote ?? "");
  };

  const submitResponse = () => {
    if (!responding) return;
    update.mutate({ id: responding.id, data: { status, resolutionNote: resolutionNote || undefined } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Complaints</CardTitle>
        <CardDescription>{(complaints.data ?? []).length} total</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {complaints.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : complaints.data && complaints.data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flat</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.data.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">{complaint.residentFlatNumber}</TableCell>
                  <TableCell className="capitalize">{complaint.category}</TableCell>
                  <TableCell className="max-w-xs truncate">{complaint.description}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[complaint.status]} className="capitalize">
                      {complaint.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" size="sm" variant="outline" onClick={() => openResponse(complaint)}>
                      Respond
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-sm">No complaints yet.</p>
        )}
      </CardContent>

      <Dialog open={responding !== null} onOpenChange={(open) => !open && setResponding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Complaint</DialogTitle>
          </DialogHeader>
          {responding && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {responding.residentName} — Flat {responding.residentFlatNumber}
                </p>
                <p className="text-sm mt-1">{responding.description}</p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ComplaintStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolution-note">Response Note</Label>
                <Textarea
                  id="resolution-note"
                  placeholder="Let the resident know what's being done…"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResponding(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={submitResponse} disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function AdminDashboard() {
  const summary = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });

  const chartData = (summary.data?.monthlyTrend ?? []).map((point) => ({
    month: point.month,
    Collection: point.incomePaise / 100,
    Expenses: point.expensePaise / 100,
  }));

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm">A financial overview of the society.</p>
        </div>

        {summary.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : summary.data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Cash Balance" valuePaise={summary.data.cashBalancePaise} />
              <StatCard label="Collected This Month" valuePaise={summary.data.totalCollectedThisMonthPaise} />
              <StatCard label="Expenses This Month" valuePaise={summary.data.totalExpensesThisMonthPaise} />
              <StatCard label="Due This Month" valuePaise={summary.data.totalDueThisMonthPaise} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Collection vs Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="Collection" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No data yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detailed Maintenance Summary</CardTitle>
                <CardDescription>By flat type, for the current month.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Flat Type</TableHead>
                      <TableHead>Flats</TableHead>
                      <TableHead>Monthly Rate</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Collected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.data.maintenanceSummary.map((row) => (
                      <TableRow key={row.flatType}>
                        <TableCell className="font-medium">{flatTypeLabels[row.flatType] ?? row.flatType}</TableCell>
                        <TableCell>{row.totalFlats}</TableCell>
                        <TableCell>₹{(row.monthlyAmountPaise / 100).toFixed(2)}</TableCell>
                        <TableCell>₹{(row.expectedTotalPaise / 100).toFixed(2)}</TableCell>
                        <TableCell>₹{(row.collectedTotalPaise / 100).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Couldn't load the dashboard.</p>
        )}

        <ComplaintsCard />
      </div>
    </AdminLayout>
  );
}
