import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import {
  useListVendors,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
  getListVendorsQueryKey,
  type Vendor,
  type VendorCategory,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NO_CATEGORY = "none" as const;

const categoryLabels: Record<Exclude<VendorCategory, null>, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  appliance: "Appliance",
  structural: "Structural",
  other: "Other",
};

const emptyForm = {
  name: "",
  contactPersonName: "",
  contactNumber: "",
  address: "",
  gstNumber: "",
  openingBalanceRupees: "",
  category: NO_CATEGORY as Exclude<VendorCategory, null> | typeof NO_CATEGORY,
};

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function VendorMaster() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const vendors = useListVendors({ query: { queryKey: getListVendorsQueryKey() } });

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onMutated = (message: string) => {
    queryClient.invalidateQueries({ queryKey: getListVendorsQueryKey() });
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

  const create = useCreateVendor({
    mutation: { onSuccess: () => onMutated("Vendor added"), onError: onError("Couldn't add vendor") },
  });
  const update = useUpdateVendor({
    mutation: { onSuccess: () => onMutated("Vendor updated"), onError: onError("Couldn't update vendor") },
  });
  const remove = useDeleteVendor({
    mutation: { onSuccess: () => onMutated("Vendor deleted"), onError: onError("Couldn't delete vendor") },
  });

  const startEdit = (vendor: Vendor) => {
    setEditingId(vendor.id);
    setForm({
      name: vendor.name,
      contactPersonName: vendor.contactPersonName,
      contactNumber: vendor.contactNumber,
      address: vendor.address ?? "",
      gstNumber: vendor.gstNumber ?? "",
      openingBalanceRupees: (vendor.openingBalancePaise / 100).toString(),
      category: vendor.category ?? NO_CATEGORY,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      contactPersonName: form.contactPersonName,
      contactNumber: form.contactNumber,
      address: form.address || undefined,
      gstNumber: form.gstNumber || undefined,
      category: form.category === NO_CATEGORY ? undefined : form.category,
      openingBalancePaise: form.openingBalanceRupees
        ? Math.round(Number(form.openingBalanceRupees) * 100)
        : 0,
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
          <h1 className="text-2xl font-serif font-medium mb-1">Vendor Master</h1>
          <p className="text-muted-foreground text-sm">Manage vendors for maintenance expenses and bill payments.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{editingId ? "Edit Vendor" : "Add New Vendor"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor-name">Vendor Name</Label>
                  <Input
                    id="vendor-name"
                    placeholder="Enter vendor name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-contact-person">Contact Person Name</Label>
                  <Input
                    id="vendor-contact-person"
                    placeholder="Enter contact person name"
                    value={form.contactPersonName}
                    onChange={(e) => setForm((f) => ({ ...f, contactPersonName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-contact-no">Contact No.</Label>
                  <Input
                    id="vendor-contact-no"
                    placeholder="Enter contact number"
                    value={form.contactNumber}
                    onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-address">Address</Label>
                  <Input
                    id="vendor-address"
                    placeholder="Enter vendor address"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-gst">GST No.</Label>
                  <Input
                    id="vendor-gst"
                    placeholder="Enter GST number"
                    value={form.gstNumber}
                    onChange={(e) => setForm((f) => ({ ...f, gstNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-opening-balance">Opening Balance (₹)</Label>
                  <Input
                    id="vendor-opening-balance"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Enter opening balance"
                    value={form.openingBalanceRupees}
                    onChange={(e) => setForm((f) => ({ ...f, openingBalanceRupees: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-category">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, category: v as Exclude<VendorCategory, null> | typeof NO_CATEGORY }))
                    }
                  >
                    <SelectTrigger id="vendor-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                      {(Object.keys(categoryLabels) as Exclude<VendorCategory, null>[]).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {categoryLabels[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Restricts which vendors can be assigned to a maintenance request of this category.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving…" : editingId ? "Update Vendor" : "Add Vendor"}
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
          <CardContent className="pt-6 overflow-x-auto">
            {vendors.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : vendors.data && vendors.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Contact No.</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>GST No.</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Opening Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.data.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>{vendor.contactPersonName}</TableCell>
                      <TableCell>{vendor.contactNumber}</TableCell>
                      <TableCell>{vendor.address || "—"}</TableCell>
                      <TableCell>{vendor.gstNumber || "—"}</TableCell>
                      <TableCell>{vendor.category ? categoryLabels[vendor.category] : "—"}</TableCell>
                      <TableCell>{formatRupees(vendor.openingBalancePaise)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEdit(vendor)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate({ id: vendor.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No vendors yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
