import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import {
  useListSpecialContributions,
  useCreateSpecialContribution,
  useDeleteSpecialContribution,
  getListSpecialContributionsQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/format-date";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const emptyForm = { title: "", description: "", amountRupees: "", dueDate: "" };

export default function SpecialContributions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);

  const contributions = useListSpecialContributions({ query: { queryKey: getListSpecialContributionsQueryKey() } });

  const onMutated = (message: string) => {
    queryClient.invalidateQueries({ queryKey: getListSpecialContributionsQueryKey() });
    toast({ title: message });
    setForm(emptyForm);
  };

  const onError = (title: string) => (error: unknown) => {
    toast({
      title,
      description: error instanceof Error ? error.message : "Please try again.",
      variant: "destructive",
    });
  };

  const create = useCreateSpecialContribution({
    mutation: { onSuccess: () => onMutated("Special contribution created"), onError: onError("Couldn't create contribution") },
  });
  const remove = useDeleteSpecialContribution({
    mutation: { onSuccess: () => onMutated("Special contribution deleted"), onError: onError("Couldn't delete contribution") },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      data: {
        title: form.title,
        description: form.description || undefined,
        amountPaise: Math.round(Number(form.amountRupees) * 100),
        dueDate: form.dueDate,
      },
    });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Special Contributions</h1>
          <p className="text-muted-foreground text-sm">Announce one-off charges to every flat — festival funds, repair levies, etc.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create New Special Contribution</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contribution-title">Title</Label>
                <Input
                  id="contribution-title"
                  placeholder="e.g. Diwali Fund"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contribution-amount">Amount per Flat (₹)</Label>
                <Input
                  id="contribution-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.amountRupees}
                  onChange={(e) => setForm((f) => ({ ...f, amountRupees: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contribution-due-date">Due Date</Label>
                <Input
                  id="contribution-due-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contribution-description">Description</Label>
                <Input
                  id="contribution-description"
                  placeholder="Optional notes"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? "Creating…" : "Create Contribution"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {contributions.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : contributions.isError ? (
              <p className="text-destructive text-sm">Couldn't load contributions — try refreshing the page.</p>
            ) : contributions.data && contributions.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.data.map((contribution) => (
                    <TableRow key={contribution.id}>
                      <TableCell className="font-medium">{contribution.title}</TableCell>
                      <TableCell>{contribution.description || "—"}</TableCell>
                      <TableCell>₹{(contribution.amountPaise / 100).toFixed(2)}</TableCell>
                      <TableCell>{formatDate(contribution.dueDate)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate({ id: contribution.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No special contributions yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
