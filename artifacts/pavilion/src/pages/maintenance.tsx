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
import { formatDate } from "@/lib/format-date";
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
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

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

function RequestRow({
  serialNumber,
  request,
  canManage,
}: {
  serialNumber: number;
  request: MaintenanceRequest;
  canManage: boolean;
}) {
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
    <TableRow>
      <TableCell className="text-muted-foreground">{serialNumber}</TableCell>
      <TableCell className="font-medium whitespace-nowrap">{request.residentName}</TableCell>
      <TableCell className="whitespace-nowrap">{request.residentFlatNumber}</TableCell>
      <TableCell className="whitespace-nowrap">{categoryLabels[request.category]}</TableCell>
      <TableCell className="min-w-48 max-w-80">{request.description}</TableCell>
      <TableCell>
        {request.photoUrls.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {request.photoUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt="Attached" className="h-10 w-10 rounded object-cover border" />
              </a>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {formatDate(request.createdAt)}
      </TableCell>
      <TableCell className="whitespace-nowrap">{request.vendorName ?? <span className="text-muted-foreground">—</span>}</TableCell>
      <TableCell>
        {canManage ? (
          <>
            <Select value={request.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
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
        ) : (
          <Badge variant={statusVariants[request.status]}>{statusLabels[request.status]}</Badge>
        )}
      </TableCell>
      <TableCell className="min-w-48">
        {!canManage && request.status === "resolved" && (
          <div className="space-y-2">
            <p className="text-xs font-medium">Satisfied with this resolution?</p>
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
                Reopen
              </Button>
            </div>
          </div>
        )}

        {!canManage && request.status === "closed" && (
          <div className="flex items-center gap-1.5 text-primary text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Confirmed resolved
          </div>
        )}

        {(canManage || (request.status !== "resolved" && request.status !== "closed")) && (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
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
      <div className="relative overflow-hidden bg-primary py-16 border-b">
        <img
          src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-10 container mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-2 text-primary-foreground">Maintenance</h1>
          <p className="text-primary-foreground/80">
            Report a repair or maintenance issue, with photos, to the building staff.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16 space-y-10">
        {!canManage && (
          <Card className="max-w-2xl">
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
          ) : requests.isError ? (
            <p className="text-destructive text-sm">Couldn't load requests — try refreshing the page.</p>
          ) : requests.data && requests.data.length > 0 ? (
            <Card>
              <CardContent className="pt-6 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Resident</TableHead>
                      <TableHead>Flat</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Photos</TableHead>
                      <TableHead>Reported</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.data.map((request, index) => (
                      <RequestRow key={request.id} serialNumber={index + 1} request={request} canManage={canManage} />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground text-sm">No maintenance requests yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
