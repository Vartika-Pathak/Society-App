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

function ComplaintCard({ complaint, canManage }: { complaint: Complaint; canManage: boolean }) {
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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{categoryLabels[complaint.category]}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {complaint.residentName} · Flat {complaint.residentFlatNumber} ·{" "}
              {new Date(complaint.createdAt).toLocaleString()}
            </p>
          </div>
          <Badge variant={statusVariants[complaint.status]}>{statusLabels[complaint.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{complaint.description}</p>

        {complaint.resolutionNote && !canManage && (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium mb-1">Note from the committee</p>
            <p className="text-muted-foreground whitespace-pre-line">{complaint.resolutionNote}</p>
          </div>
        )}

        {!canManage && complaint.status === "resolved" && (
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-medium">Are you satisfied with this resolution?</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={confirmResolved.isPending}
                onClick={() => confirmResolved.mutate({ id: complaint.id })}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Yes, close it
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`reopen-note-${complaint.id}`} className="text-xs text-muted-foreground">
                Not satisfied? Tell us what's still wrong, then reopen it
              </Label>
              <Textarea
                id={`reopen-note-${complaint.id}`}
                value={reopenNote}
                onChange={(e) => setReopenNote(e.target.value)}
                placeholder="e.g. Still leaking after the fix"
                className="min-h-16"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={reopen.isPending}
                onClick={() => reopen.mutate({ id: complaint.id, data: { note: reopenNote || undefined } })}
              >
                Not satisfied, reopen
              </Button>
            </div>
          </div>
        )}

        {!canManage && complaint.status === "closed" && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-primary text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> You confirmed this is resolved.
          </div>
        )}

        {canManage && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor={`note-${complaint.id}`} className="text-xs text-muted-foreground">
                Note for the resident (optional)
              </Label>
              <Textarea
                id={`note-${complaint.id}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Plumber scheduled for Tuesday"
                className="min-h-16"
              />
            </div>
            <Select
              value={complaint.status}
              onValueChange={(value) =>
                updateStatus.mutate({
                  id: complaint.id,
                  data: { status: value as ComplaintStatus, resolutionNote: note || undefined },
                })
              }
            >
              <SelectTrigger className="w-48">
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
          </div>
        )}
      </CardContent>
    </Card>
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
      <div className="bg-primary/5 py-16 border-b">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-2">Complain</h1>
          <p className="text-muted-foreground">
            Raise a complaint about amenities, the lift, or anything else and track its status.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16 max-w-2xl space-y-10">
        {!canManage && (
          <Card>
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
          ) : complaints.data && complaints.data.length > 0 ? (
            <div className="space-y-4">
              {complaints.data.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} canManage={canManage} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No complaints yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
