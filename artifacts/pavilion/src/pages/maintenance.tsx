import React, { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, CheckCircle2 } from "lucide-react";
import {
  useCreateMaintenanceRequest,
  useListMaintenanceRequests,
  useUpdateMaintenanceStatus,
  useConfirmMaintenanceResolved,
  useReopenMaintenanceRequest,
  useListVendors,
  getListMaintenanceRequestsQueryKey,
  getListVendorsQueryKey,
  type MaintenanceRequest,
  type MaintenanceRequestCategory,
  type MaintenanceRequestStatus,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const categoryLabels: Record<MaintenanceRequestCategory, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  appliance: "Appliance",
  structural: "Structural",
  other: "Other",
};

const statusLabels: Record<MaintenanceRequestStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

const statusVariants: Record<MaintenanceRequestStatus, "secondary" | "default" | "outline"> = {
  open: "secondary",
  in_progress: "default",
  resolved: "outline",
  closed: "secondary",
};

const MAX_PHOTOS = 6;

function RequestCard({ request, canManage }: { request: MaintenanceRequest; canManage: boolean }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListMaintenanceRequestsQueryKey() });

  const vendors = useListVendors({ query: { queryKey: getListVendorsQueryKey(), enabled: canManage } });
  const matchingVendors = (vendors.data ?? []).filter((v) => v.category === request.category);

  const updateStatus = useUpdateMaintenanceStatus({
    mutation: {
      onSuccess: () => {
        invalidate();
        setVendorDialogOpen(false);
        setSelectedVendorId("");
      },
      onError: () => {
        toast({
          title: "Couldn't update status",
          description: "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const confirmResolved = useConfirmMaintenanceResolved({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast({ title: "Closed", description: "Glad it's sorted out." });
      },
      onError: () => {
        toast({ title: "Couldn't close this request", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  const reopen = useReopenMaintenanceRequest({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast({ title: "Reopened", description: "The building staff will take another look." });
      },
      onError: () => {
        toast({ title: "Couldn't reopen this request", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  const handleStatusChange = (value: string) => {
    if (value === "in_progress") {
      setVendorDialogOpen(true);
      return;
    }
    updateStatus.mutate({ params: { id: request.id }, data: { status: value as MaintenanceRequestStatus } });
  };

  const assignVendorAndStartProgress = () => {
    if (!selectedVendorId) return;
    updateStatus.mutate({
      params: { id: request.id },
      data: { status: "in_progress", vendorId: Number(selectedVendorId) },
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{categoryLabels[request.category]}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {request.residentName} · Flat {request.residentFlatNumber} ·{" "}
              {new Date(request.createdAt).toLocaleString()}
            </p>
          </div>
          <Badge variant={statusVariants[request.status]}>{statusLabels[request.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{request.description}</p>

        {request.photoUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {request.photoUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <img
                  src={url}
                  alt="Attached"
                  className="h-20 w-20 rounded-lg object-cover border"
                />
              </a>
            ))}
          </div>
        )}

        {request.vendorName && (
          <p className="text-sm text-muted-foreground">
            Assigned to <span className="font-medium text-foreground">{request.vendorName}</span>
          </p>
        )}

        {canManage && (
          <>
            <Select value={request.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(statusLabels) as MaintenanceRequestStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign a {categoryLabels[request.category].toLowerCase()} vendor</DialogTitle>
                </DialogHeader>
                {matchingVendors.length > 0 ? (
                  <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {matchingVendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={String(vendor.id)}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No vendors are tagged for {categoryLabels[request.category].toLowerCase()} work yet. Add one in
                    Vendor Master first.
                  </p>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setVendorDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={!selectedVendorId || updateStatus.isPending}
                    onClick={assignVendorAndStartProgress}
                  >
                    Assign and start
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        {!canManage && request.status === "resolved" && (
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-medium">Are you satisfied with this resolution?</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={confirmResolved.isPending}
                onClick={() => confirmResolved.mutate({ params: { id: request.id } })}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Yes, close it
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={reopen.isPending}
                onClick={() => reopen.mutate({ params: { id: request.id } })}
              >
                Not satisfied, reopen
              </Button>
            </div>
          </div>
        )}

        {!canManage && request.status === "closed" && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-primary text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> You confirmed this is resolved.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Maintenance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<MaintenanceRequestCategory>("plumbing");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const canManage = user?.role === "guard" || user?.role === "admin";

  const createRequest = useCreateMaintenanceRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMaintenanceRequestsQueryKey() });
        toast({ title: "Maintenance request submitted", description: "The building staff have been notified." });
        setDescription("");
        setPhotos([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      onError: () => {
        toast({
          title: "Couldn't submit the request",
          description: "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const requests = useListMaintenanceRequests();

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setPhotos((prev) => [...prev, ...selected].slice(0, MAX_PHOTOS));
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRequest.mutate({ data: { category, description, photos } });
  };

  return (
    <div className="w-full">
      <div className="bg-primary/5 py-16 border-b">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-2">Maintenance</h1>
          <p className="text-muted-foreground">
            Report a repair or maintenance issue, with photos, to the building staff.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16 max-w-2xl space-y-10">
        {!canManage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report an issue</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as MaintenanceRequestCategory)}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(categoryLabels) as MaintenanceRequestCategory[]).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {categoryLabels[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">What's wrong?</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue — location, what's happening, since when…"
                    className="min-h-32"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photos">Photos (optional, up to {MAX_PHOTOS})</Label>
                  <input
                    ref={fileInputRef}
                    id="photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFilesSelected}
                    disabled={photos.length >= MAX_PHOTOS}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  {photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {photos.map((file, i) => (
                        <div key={i} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="h-20 w-20 rounded-lg object-cover border"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={createRequest.isPending} className="w-full">
                  {createRequest.isPending ? "Submitting…" : "Submit request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-lg font-serif font-medium mb-4">
            {canManage ? "All maintenance requests" : "Your requests"}
          </h2>
          {requests.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : requests.data && requests.data.length > 0 ? (
            <div className="space-y-4">
              {requests.data.map((request) => (
                <RequestCard key={request.id} request={request} canManage={canManage} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No maintenance requests yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
