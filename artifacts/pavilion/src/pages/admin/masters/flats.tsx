import React, { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Check, RefreshCw } from "lucide-react";
import {
  useListFlats,
  useCreateFlat,
  useUpdateFlat,
  useDeleteFlat,
  useListBuildings,
  useListFlatChangeRequests,
  useUpdateFlatChangeRequestStatus,
  useSyncFlatResidents,
  getListFlatsQueryKey,
  getListBuildingsQueryKey,
  getListFlatChangeRequestsQueryKey,
  type Flat,
  type FlatFlatType,
  type FlatOwnershipType,
  type SyncFlatResidentsResult,
} from "@workspace/api-client-react";
import { apiGet, ApiFetchError } from "@/lib/api-fetch";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const flatTypeLabels: Record<FlatFlatType, string> = {
  "1bhk": "1 BHK",
  "2bhk": "2 BHK",
  "3bhk": "3 BHK",
  "4bhk": "4 BHK",
};

// /api/admin/users isn't in the shared OpenAPI contract (see admin/members.tsx, which fetches it
// the same way) — no generated hook, so this is fetched by hand and filtered to residents.
interface ResidentAccount {
  id: number;
  name: string;
  email: string;
  role: "resident" | "guard" | "admin";
}

const UNASSIGNED = "unassigned";

interface FlatForm {
  buildingId: string;
  flatNumber: string;
  flatType: FlatFlatType;
  occupied: boolean;
  ownershipType: FlatOwnershipType;
  residentId: string;
}

const emptyForm: FlatForm = {
  buildingId: "",
  flatNumber: "",
  flatType: "1bhk",
  occupied: false,
  ownershipType: "owner",
  residentId: UNASSIGNED,
};

export default function FlatResident() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FlatForm>(emptyForm);
  const [residents, setResidents] = useState<ResidentAccount[] | null>(null);
  const [syncResult, setSyncResult] = useState<SyncFlatResidentsResult | null>(null);

  const flats = useListFlats({ query: { queryKey: getListFlatsQueryKey() } });
  const buildings = useListBuildings({ query: { queryKey: getListBuildingsQueryKey() } });
  const changeRequests = useListFlatChangeRequests({ query: { queryKey: getListFlatChangeRequestsQueryKey() } });

  const loadResidents = useCallback(async () => {
    try {
      const data = await apiGet<ResidentAccount[]>("/api/admin/users");
      setResidents(data.filter((account) => account.role === "resident"));
    } catch (error) {
      toast({
        title: "Couldn't load residents",
        description: error instanceof ApiFetchError ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    void loadResidents();
  }, [loadResidents]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onMutated = (message: string) => {
    queryClient.invalidateQueries({ queryKey: getListFlatsQueryKey() });
    toast({ title: message });
    resetForm();
  };

  const onError = (title: string) => (error: unknown) => {
    toast({
      title,
      description: error instanceof Error ? error.message : "Please try again.",
      variant: "destructive",
    });
  };

  const create = useCreateFlat({
    mutation: { onSuccess: () => onMutated("Flat added"), onError: onError("Couldn't add flat") },
  });
  const update = useUpdateFlat({
    mutation: { onSuccess: () => onMutated("Flat updated"), onError: onError("Couldn't update flat") },
  });
  const remove = useDeleteFlat({
    mutation: { onSuccess: () => onMutated("Flat deleted"), onError: onError("Couldn't delete flat") },
  });
  const markReviewed = useUpdateFlatChangeRequestStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFlatChangeRequestsQueryKey() });
        toast({ title: "Marked as reviewed" });
      },
      onError: onError("Couldn't update the change request"),
    },
  });
  const syncResidents = useSyncFlatResidents({
    mutation: {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getListFlatsQueryKey() });
        setSyncResult(result);
      },
      onError: onError("Couldn't sync residents"),
    },
  });

  const startEdit = (flat: Flat) => {
    setEditingId(flat.id);
    setForm({
      buildingId: String(flat.buildingId),
      flatNumber: flat.flatNumber,
      flatType: flat.flatType,
      occupied: flat.occupied,
      ownershipType: flat.ownershipType,
      residentId: flat.residentId ? String(flat.residentId) : UNASSIGNED,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.buildingId) return;
    const data = {
      buildingId: Number(form.buildingId),
      flatNumber: form.flatNumber,
      flatType: form.flatType,
      occupied: form.occupied,
      ownershipType: form.ownershipType,
      residentId: form.residentId === UNASSIGNED ? null : Number(form.residentId),
    };
    if (editingId) {
      update.mutate({ id: editingId, data });
    } else {
      create.mutate({ data });
    }
  };

  const isSaving = create.isPending || update.isPending;
  const flatLabel = (flatId: number) => {
    const flat = flats.data?.find((f) => f.id === flatId);
    return flat ? `${flat.flatNumber} (${flat.buildingName})` : `#${flatId}`;
  };
  const pendingChangeRequests = changeRequests.data?.filter((r) => r.status === "pending") ?? [];

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl space-y-8">
<<<<<<< Updated upstream
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-medium mb-1">Flat Resident</h1>
            <p className="text-muted-foreground text-sm">Manage flats and which resident lives in each one.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={syncResidents.isPending}
            onClick={() => syncResidents.mutate()}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            {syncResidents.isPending ? "Syncing…" : "Sync residents by flat number"}
          </Button>
=======
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Flat Resident</h1>
          <p className="text-muted-foreground text-sm">Manage all flats in your society.</p>
>>>>>>> Stashed changes
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{editingId ? "Edit Flat" : "New Flat"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Building</Label>
                  <Select value={form.buildingId} onValueChange={(v) => setForm((f) => ({ ...f, buildingId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a building" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.data?.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flat-number">Flat Number</Label>
                  <Input
                    id="flat-number"
                    placeholder="e.g. 101"
                    value={form.flatNumber}
                    onChange={(e) => setForm((f) => ({ ...f, flatNumber: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Resident</Label>
                <Select value={form.residentId} onValueChange={(v) => setForm((f) => ({ ...f, residentId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="No resident assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>No resident assigned</SelectItem>
                    {residents?.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name} ({r.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Flat Type</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(Object.keys(flatTypeLabels) as FlatFlatType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, flatType: type }))}
                      className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                        form.flatType === type
                          ? "border-primary bg-primary/5 text-primary"
                          : "hover:border-primary/50"
                      }`}
                    >
                      {flatTypeLabels[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.occupied}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, occupied: checked }))}
                />
                <Label>Occupied</Label>
              </div>

              <div className="space-y-2">
                <Label>Ownership Type</Label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  {(["owner", "rented"] as FlatOwnershipType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, ownershipType: type }))}
                      className={`rounded-lg border p-3 text-sm font-medium capitalize transition-colors ${
                        form.ownershipType === type
                          ? "border-primary bg-primary/5 text-primary"
                          : "hover:border-primary/50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving || !form.buildingId}>
                  {isSaving ? "Saving…" : editingId ? "Update Flat" : "Save Flat"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{flats.data?.length ?? 0} flat{flats.data?.length === 1 ? "" : "s"}</CardDescription>
          </CardHeader>
          <CardContent>
            {flats.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : flats.isError ? (
              <p className="text-destructive text-sm">Couldn't load flats — try refreshing the page.</p>
            ) : flats.data && flats.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Building</TableHead>
                    <TableHead>Flat Number</TableHead>
                    <TableHead>Flat Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ownership</TableHead>
                    <TableHead>Resident</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flats.data.map((flat) => (
                    <TableRow key={flat.id}>
                      <TableCell>{flat.buildingName}</TableCell>
                      <TableCell className="font-medium">{flat.flatNumber}</TableCell>
                      <TableCell>{flatTypeLabels[flat.flatType]}</TableCell>
                      <TableCell>
                        <Badge variant={flat.occupied ? "default" : "secondary"}>
                          {flat.occupied ? "Occupied" : "Vacant"}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{flat.ownershipType}</TableCell>
                      <TableCell>
                        {flat.residentName ?? <span className="text-muted-foreground">Unassigned</span>}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEdit(flat)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate({ id: flat.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No flats yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resident Change Requests</CardTitle>
            <CardDescription>
              {pendingChangeRequests.length > 0
                ? `${pendingChangeRequests.length} pending request${pendingChangeRequests.length === 1 ? "" : "s"}`
                : "Nothing pending"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {changeRequests.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : changeRequests.isError ? (
              <p className="text-destructive text-sm">Couldn't load change requests — try refreshing the page.</p>
            ) : changeRequests.data && changeRequests.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flat</TableHead>
                    <TableHead>Resident</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {changeRequests.data.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{flatLabel(request.flatId)}</TableCell>
                      <TableCell>{request.residentName}</TableCell>
                      <TableCell className="max-w-xs">{request.message}</TableCell>
                      <TableCell>
                        <Badge variant={request.status === "pending" ? "default" : "secondary"}>
                          {request.status === "pending" ? "Pending" : "Reviewed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === "pending" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={markReviewed.isPending}
                            onClick={() => markReviewed.mutate({ id: request.id, data: { status: "reviewed" } })}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Mark reviewed
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No change requests yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={syncResult !== null} onOpenChange={(open) => !open && setSyncResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync results</DialogTitle>
          </DialogHeader>
          {syncResult && (
            <div className="space-y-4">
              <p className="text-sm">
                {syncResult.matchedCount === 0 && syncResult.createdCount === 0
                  ? "Nothing to do — everything that could be auto-matched already has been."
                  : [
                      syncResult.matchedCount > 0
                        ? `Linked ${syncResult.matchedCount} resident${syncResult.matchedCount === 1 ? "" : "s"} to an existing flat.`
                        : null,
                      syncResult.createdCount > 0
                        ? `Created ${syncResult.createdCount} new flat${syncResult.createdCount === 1 ? "" : "s"} (placeholder type/ownership — review below).`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" ")}
              </p>
              {syncResult.issues.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Details ({syncResult.issues.length}):</p>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    {syncResult.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
