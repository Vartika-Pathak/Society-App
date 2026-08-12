import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import {
  useListExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory,
  getListExpenseCategoriesQueryKey,
  type ExpenseCategory,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const emptyForm = { name: "", gstSlabPercent: "" };

export default function ExpenseMaster() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const categories = useListExpenseCategories({ query: { queryKey: getListExpenseCategoriesQueryKey() } });

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onMutated = (message: string) => {
    queryClient.invalidateQueries({ queryKey: getListExpenseCategoriesQueryKey() });
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

  const create = useCreateExpenseCategory({
    mutation: { onSuccess: () => onMutated("Expense category added"), onError: onError("Couldn't add expense category") },
  });
  const update = useUpdateExpenseCategory({
    mutation: { onSuccess: () => onMutated("Expense category updated"), onError: onError("Couldn't update expense category") },
  });
  const remove = useDeleteExpenseCategory({
    mutation: { onSuccess: () => onMutated("Expense category deleted"), onError: onError("Couldn't delete expense category") },
  });

  const startEdit = (category: ExpenseCategory) => {
    setEditingId(category.id);
    setForm({ name: category.name, gstSlabPercent: String(category.gstSlabPercent) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: form.name, gstSlabPercent: Number(form.gstSlabPercent) };
    if (editingId) {
      update.mutate({ id: editingId, data });
    } else {
      create.mutate({ data });
    }
  };

  const isSaving = create.isPending || update.isPending;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Expense Master</h1>
          <p className="text-muted-foreground text-sm">Manage expense categories and their GST slabs.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{editingId ? "Edit Expense" : "Add New Expense"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="expense-name">Expense Name</Label>
                <Input
                  id="expense-name"
                  placeholder="Enter expense name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-gst">GST Slab (%)</Label>
                <Input
                  id="expense-gst"
                  type="number"
                  min={0}
                  max={100}
                  value={form.gstSlabPercent}
                  onChange={(e) => setForm((f) => ({ ...f, gstSlabPercent: e.target.value }))}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving…" : editingId ? "Update Expense" : "Add Expense"}
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
            {categories.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : categories.isError ? (
              <p className="text-destructive text-sm">Couldn't load expense categories — try refreshing the page.</p>
            ) : categories.data && categories.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expense Name</TableHead>
                    <TableHead>GST Slab</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.data.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.gstSlabPercent}%</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEdit(category)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate({ id: category.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No expense categories yet.</p>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              Showing {categories.data?.length ?? 0} expense{categories.data?.length === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
