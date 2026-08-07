import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import {
  useListMaintenanceDiscounts,
  useCreateMaintenanceDiscount,
  useUpdateMaintenanceDiscount,
  useDeleteMaintenanceDiscount,
  getListMaintenanceDiscountsQueryKey,
  type MaintenanceDiscount,
  type MaintenanceDiscountDiscountType,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const emptyForm = {
  name: "",
  discountType: "percent" as MaintenanceDiscountDiscountType,
  value: "",
  description: "",
  active: true,
};

export default function MaintenanceDiscounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const discounts = useListMaintenanceDiscounts({ query: { queryKey: getListMaintenanceDiscountsQueryKey() } });

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onMutated = (message: string) => {
    queryClient.invalidateQueries({ queryKey: getListMaintenanceDiscountsQueryKey() });
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

  const create = useCreateMaintenanceDiscount({
    mutation: { onSuccess: () => onMutated("Discount added"), onError: onError("Couldn't add discount") },
  });
  const update = useUpdateMaintenanceDiscount({
    mutation: { onSuccess: () => onMutated("Discount updated"), onError: onError("Couldn't update discount") },
  });
  const remove = useDeleteMaintenanceDiscount({
    mutation: { onSuccess: () => onMutated("Discount deleted"), onError: onError("Couldn't delete discount") },
  });

  const startEdit = (discount: MaintenanceDiscount) => {
    setEditingId(discount.id);
    setForm({
      name: discount.name,
      discountType: discount.discountType,
      value: String(discount.value),
      description: discount.description ?? "",
      active: discount.active,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      discountType: form.discountType,
      value: form.discountType === "fixed" ? Math.round(Number(form.value) * 100) : Number(form.value),
      description: form.description || undefined,
      active: form.active,
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
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Maintenance Discount</h1>
          <p className="text-muted-foreground text-sm">Manage discount rules that can be applied to maintenance dues.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{editingId ? "Edit Discount" : "Add New Discount"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount-name">Discount Name</Label>
                  <Input
                    id="discount-name"
                    placeholder="e.g. Senior citizen discount"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["percent", "fixed"] as MaintenanceDiscountDiscountType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, discountType: type }))}
                        className={`rounded-lg border p-2 text-sm font-medium capitalize transition-colors ${
                          form.discountType === type ? "border-primary bg-primary/5 text-primary" : "hover:border-primary/50"
                        }`}
                      >
                        {type === "percent" ? "Percentage" : "Fixed Amount (₹)"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount-value">
                    {form.discountType === "percent" ? "Discount Percentage (%)" : "Discount Amount (₹)"}
                  </Label>
                  <Input
                    id="discount-value"
                    type="number"
                    min={0}
                    max={form.discountType === "percent" ? 100 : undefined}
                    step={form.discountType === "percent" ? 1 : 0.01}
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount-description">Description</Label>
                  <Input
                    id="discount-description"
                    placeholder="Optional notes"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.active} onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))} />
                <Label>Active</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving…" : editingId ? "Update Discount" : "Add Discount"}
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
          <CardContent className="pt-6">
            {discounts.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : discounts.data && discounts.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.data.map((discount) => (
                    <TableRow key={discount.id}>
                      <TableCell className="font-medium">{discount.name}</TableCell>
                      <TableCell className="capitalize">{discount.discountType}</TableCell>
                      <TableCell>
                        {discount.discountType === "percent" ? `${discount.value}%` : `₹${(discount.value / 100).toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={discount.active ? "default" : "secondary"}>
                          {discount.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEdit(discount)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate({ id: discount.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No discounts yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
