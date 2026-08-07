import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import {
  useListFlats,
  useCreateFlat,
  useUpdateFlat,
  useDeleteFlat,
  useListBuildings,
  getListFlatsQueryKey,
  getListBuildingsQueryKey,
  type Flat,
  type FlatFlatType,
  type FlatOwnershipType,
} from "@workspace/api-client-react";
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

const flatTypeLabels: Record<FlatFlatType, string> = {
  "1bhk": "1 BHK",
  "2bhk": "2 BHK",
  "3bhk": "3 BHK",
  "4bhk": "4 BHK",
};

interface FlatForm {
  buildingId: string;
  flatNumber: string;
  flatType: FlatFlatType;
  occupied: boolean;
  ownershipType: FlatOwnershipType;
}

const emptyForm: FlatForm = {
  buildingId: "",
  flatNumber: "",
  flatType: "1bhk",
  occupied: false,
  ownershipType: "owner",
};

export default function FlatMaster() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FlatForm>(emptyForm);

  const flats = useListFlats({ query: { queryKey: getListFlatsQueryKey() } });
  const buildings = useListBuildings({ query: { queryKey: getListBuildingsQueryKey() } });

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

  const startEdit = (flat: Flat) => {
    setEditingId(flat.id);
    setForm({
      buildingId: String(flat.buildingId),
      flatNumber: flat.flatNumber,
      flatType: flat.flatType,
      occupied: flat.occupied,
      ownershipType: flat.ownershipType,
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
    };
    if (editingId) {
      update.mutate({ id: editingId, data });
    } else {
      create.mutate({ data });
    }
  };

  const isSaving = create.isPending || update.isPending;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Flat Master</h1>
          <p className="text-muted-foreground text-sm">Manage all flats in your society.</p>
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
            ) : flats.data && flats.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Building</TableHead>
                    <TableHead>Flat Number</TableHead>
                    <TableHead>Flat Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ownership</TableHead>
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
      </div>
    </AdminLayout>
  );
}
