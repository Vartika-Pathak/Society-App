import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateComplaint,
  useListComplaints,
  useUpdateComplaintStatus,
  useConfirmComplaintResolved,
  useReopenComplaint,
  getListComplaintsQueryKey,
  type Complaint,
  type ComplaintCategory,
  type ComplaintStatus,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const categoryLabels: Record<ComplaintCategory, string> = {
  maintenance: "Maintenance",
  security: "Security",
  noise: "Noise",
  other: "Other",
};

const statusLabels: Record<ComplaintStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

const statusVariants: Record<ComplaintStatus, "secondary" | "default" | "outline"> = {
  open: "secondary",
  in_progress: "default",
  resolved: "outline",
  closed: "secondary",
};

function ComplaintRow({
  serialNumber,
  complaint,
  canManage,
}: {
  serialNumber: number;
  complaint: Complaint;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [note, setNote] = useState(complaint.resolutionNote ?? "");
  const [reopenNote, setReopenNote] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListComplaintsQueryKey() });

  const updateStatus = useUpdateComplaintStatus({
    mutation: {
      onSuccess: invalidate,
      onError: () => {
        toast({
          title: "Couldn't update status",
          description: "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const confirmResolved = useConfirmComplaintResolved({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast({ title: "Closed", description: "Glad it's sorted out." });
      },
      onError: () => {
        toast({ title: "Couldn't close this complaint", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  const reopen = useReopenComplaint({
    mutation: {
      onSuccess: () => {
        invalidate();
        setReopenNote("");
        toast({ title: "Reopened", description: "The committee will take another look." });
      },
      onError: () => {
        toast({ title: "Couldn't reopen this complaint", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  return (
    <TableRow>
      <TableCell className="text-muted-foreground">{serialNumber}</TableCell>
      <TableCell className="font-medium whitespace-nowrap">{complaint.residentName}</TableCell>
      <TableCell className="whitespace-nowrap">{complaint.residentFlatNumber}</TableCell>
      <TableCell className="whitespace-nowrap">{categoryLabels[complaint.category]}</TableCell>
      <TableCell className="min-w-48 max-w-80">{complaint.description}</TableCell>
      <TableCell className="whitespace-nowrap">{new Date(complaint.createdAt).toLocaleDateString()}</TableCell>
      <TableCell className="min-w-56">
        {canManage ? (
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note for the resident (optional)"
            className="min-h-16 text-sm"
          />
        ) : complaint.resolutionNote ? (
          <p className="text-muted-foreground whitespace-pre-line">{complaint.resolutionNote}</p>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {canManage ? (
          <Select
            value={complaint.status}
            onValueChange={(value) =>
              updateStatus.mutate({
                id: complaint.id,
                data: { status: value as ComplaintStatus, resolutionNote: note || undefined },
              })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(statusLabels) as ComplaintStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant={statusVariants[complaint.status]}>{statusLabels[complaint.status]}</Badge>
        )}
      </TableCell>
      <TableCell className="min-w-56">
        {!canManage && complaint.status === "resolved" && (
          <div className="space-y-2">
            <p className="text-xs font-medium">Satisfied?</p>
            <Button
              type="button"
              size="sm"
              disabled={confirmResolved.isPending}
              onClick={() => confirmResolved.mutate({ id: complaint.id })}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Yes, close it
            </Button>
            <Textarea
              value={reopenNote}
              onChange={(e) => setReopenNote(e.target.value)}
              placeholder="Not satisfied? What's still wrong…"
              className="min-h-12 text-sm"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={reopen.isPending}
              onClick={() => reopen.mutate({ id: complaint.id, data: { note: reopenNote || undefined } })}
            >
              Reopen
            </Button>
          </div>
        )}

        {!canManage && complaint.status === "closed" && (
          <div className="flex items-center gap-1.5 text-primary text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Confirmed resolved
          </div>
        )}

        {(canManage || (complaint.status !== "resolved" && complaint.status !== "closed")) && (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function Complain() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<ComplaintCategory>("maintenance");
  const [description, setDescription] = useState("");

  const canManage = user?.role === "guard" || user?.role === "admin";

  const createComplaint = useCreateComplaint({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListComplaintsQueryKey() });
        toast({ title: "Complaint submitted", description: "The committee has been notified." });
        setDescription("");
      },
      onError: () => {
        toast({
          title: "Couldn't submit the complaint",
          description: "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const complaints = useListComplaints();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createComplaint.mutate({ data: { category, description } });
  };

  return (
    <div className="w-full">
      <div className="relative overflow-hidden bg-primary py-16 border-b">
        <img
          src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-10 container mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-2 text-primary-foreground">Complain</h1>
          <p className="text-primary-foreground/80">
            Raise a complaint about amenities, the lift, or anything else and track its status.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16 space-y-10">
        {!canManage && (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Raise a complaint</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as ComplaintCategory)}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(categoryLabels) as ComplaintCategory[]).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {categoryLabels[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">What's the issue?</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what's happening — where, since when, how often…"
                    className="min-h-32"
                    required
                  />
                </div>

                <Button type="submit" disabled={createComplaint.isPending} className="w-full">
                  {createComplaint.isPending ? "Submitting…" : "Submit complaint"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-lg font-serif font-medium mb-4">
            {canManage ? "All complaints" : "Your complaints"}
          </h2>
          {complaints.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : complaints.isError ? (
            <p className="text-destructive text-sm">Couldn't load complaints — try refreshing the page.</p>
          ) : complaints.data && complaints.data.length > 0 ? (
            <Card>
              <CardContent className="pt-6 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Resident</TableHead>
                      <TableHead>Flat</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reported</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.data.map((complaint, index) => (
                      <ComplaintRow
                        key={complaint.id}
                        serialNumber={index + 1}
                        complaint={complaint}
                        canManage={canManage}
                      />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground text-sm">No complaints yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
