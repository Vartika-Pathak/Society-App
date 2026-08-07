import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import {
  useListSocietyRules,
  useCreateSocietyRule,
  useUpdateSocietyRule,
  useDeleteSocietyRule,
  getListSocietyRulesQueryKey,
  type SocietyRule,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const emptyForm = { title: "", description: "", active: true };

export default function SocietyRules() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const rules = useListSocietyRules({ query: { queryKey: getListSocietyRulesQueryKey() } });

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onMutated = (message: string) => {
    queryClient.invalidateQueries({ queryKey: getListSocietyRulesQueryKey() });
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

  const create = useCreateSocietyRule({
    mutation: { onSuccess: () => onMutated("Rule added"), onError: onError("Couldn't add rule") },
  });
  const update = useUpdateSocietyRule({
    mutation: { onSuccess: () => onMutated("Rule updated"), onError: onError("Couldn't update rule") },
  });
  const remove = useDeleteSocietyRule({
    mutation: { onSuccess: () => onMutated("Rule deleted"), onError: onError("Couldn't delete rule") },
  });

  const startEdit = (rule: SocietyRule) => {
    setEditingId(rule.id);
    setForm({ title: rule.title, description: rule.description, active: rule.active });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      update.mutate({ id: editingId, data: form });
    } else {
      create.mutate({ data: form });
    }
  };

  const isSaving = create.isPending || update.isPending;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Society Rules</h1>
          <p className="text-muted-foreground text-sm">Rules & regulations residents are expected to follow.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{editingId ? "Edit Rule" : "Add Rule"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rule-title">Title</Label>
                <Input
                  id="rule-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rule-description">Description</Label>
                <Textarea
                  id="rule-description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.active} onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))} />
                <Label>Active</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving…" : editingId ? "Update Rule" : "Add Rule"}
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
            {rules.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : rules.data && rules.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.data.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.title}</TableCell>
                      <TableCell className="max-w-sm truncate">{rule.description}</TableCell>
                      <TableCell>
                        <Badge variant={rule.active ? "default" : "secondary"}>{rule.active ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEdit(rule)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate({ id: rule.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No rules yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
