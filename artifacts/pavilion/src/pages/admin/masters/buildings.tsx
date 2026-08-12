import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import {
  useListBuildings,
  useCreateBuilding,
  useUpdateBuilding,
  useDeleteBuilding,
  getListBuildingsQueryKey,
  type Building,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const emptyForm = { name: "", totalFlats: "" };

export default function BuildingMaster() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const buildings = useListBuildings({ query: { queryKey: getListBuildingsQueryKey() } });

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onMutated = (message: string) => {
    queryClient.invalidateQueries({ queryKey: getListBuildingsQueryKey() });
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

  const create = useCreateBuilding({
    mutation: {
      onSuccess: () => onMutated("Building added"),
      onError: onError("Couldn't add building"),
    },
  });
  const update = useUpdateBuilding({
    mutation: {
      onSuccess: () => onMutated("Building updated"),
      onError: onError("Couldn't update building"),
    },
  });
  const remove = useDeleteBuilding({
    mutation: {
      onSuccess: () => onMutated("Building deleted"),
      onError: onError("Couldn't delete building"),
    },
  });

  const startEdit = (building: Building) => {
    setEditingId(building.id);
    setForm({ name: building.name, totalFlats: String(building.totalFlats) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: form.name, totalFlats: Number(form.totalFlats) };
    if (editingId) {
      update.mutate({ id: editingId, data });
    } else {
      create.mutate({ data });
    }
  };

  const isSaving = create.isPending || update.isPending;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Building Master</h1>
          <p className="text-muted-foreground text-sm">Manage all buildings in your society.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{editingId ? "Edit Building" : "Add New Building"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="building-name">Building Name</Label>
                <Input
                  id="building-name"
                  placeholder="e.g. A Wing"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="building-flats">Total Flats</Label>
                <Input
                  id="building-flats"
                  type="number"
                  min={1}
                  value={form.totalFlats}
                  onChange={(e) => setForm((f) => ({ ...f, totalFlats: e.target.value }))}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving…" : editingId ? "Update Building" : "Save Building"}
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
            <CardDescription>
              {buildings.data?.length ?? 0} building{buildings.data?.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {buildings.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : buildings.isError ? (
              <p className="text-destructive text-sm">Couldn't load buildings — try refreshing the page.</p>
            ) : buildings.data && buildings.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Building Name</TableHead>
                    <TableHead>Total Flats</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buildings.data.map((building) => (
                    <TableRow key={building.id}>
                      <TableCell className="text-muted-foreground">{building.id}</TableCell>
                      <TableCell className="font-medium">{building.name}</TableCell>
                      <TableCell>{building.totalFlats} flats</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEdit(building)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate({ id: building.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No buildings yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
