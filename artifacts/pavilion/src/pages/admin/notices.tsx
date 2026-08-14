import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Pin } from "lucide-react";
import {
  useListNotices,
  useCreateNotice,
  useUpdateNotice,
  useDeleteNotice,
  getListNoticesQueryKey,
  type Notice,
  type NoticeCategory,
  type NoticePriority,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/format-date";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const emptyForm = {
  title: "",
  content: "",
  category: "general" as NoticeCategory,
  priority: "normal" as NoticePriority,
  pinned: false,
  expiresAt: "",
};

const priorityVariants: Record<NoticePriority, "default" | "secondary" | "outline"> = {
  high: "default",
  normal: "secondary",
  low: "outline",
};

export default function Notices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const notices = useListNotices({ query: { queryKey: getListNoticesQueryKey() } });

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onMutated = (message: string) => {
    queryClient.invalidateQueries({ queryKey: getListNoticesQueryKey() });
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

  const create = useCreateNotice({
    mutation: { onSuccess: () => onMutated("Notice created"), onError: onError("Couldn't create notice") },
  });
  const update = useUpdateNotice({
    mutation: { onSuccess: () => onMutated("Notice updated"), onError: onError("Couldn't update notice") },
  });
  const remove = useDeleteNotice({
    mutation: { onSuccess: () => onMutated("Notice deleted"), onError: onError("Couldn't delete notice") },
  });

  const startEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setForm({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      pinned: notice.pinned,
      expiresAt: notice.expiresAt ?? "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, expiresAt: form.expiresAt || undefined };
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
          <h1 className="text-2xl font-serif font-medium mb-1">Society Notices</h1>
          <p className="text-muted-foreground text-sm">Short operational notices — separate from the News feed.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{editingId ? "Edit Notice" : "Create Notice"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="notice-title">Title</Label>
                  <Input
                    id="notice-title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as NoticeCategory }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as NoticePriority }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notice-expires">Expires On</Label>
                  <Input
                    id="notice-expires"
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notice-content">Content</Label>
                <Textarea
                  id="notice-content"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.pinned} onCheckedChange={(checked) => setForm((f) => ({ ...f, pinned: checked }))} />
                <Label>Pin to top</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving…" : editingId ? "Update Notice" : "Create Notice"}
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
            {notices.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : notices.isError ? (
              <p className="text-destructive text-sm">Couldn't load notices — try refreshing the page.</p>
            ) : notices.data && notices.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notices.data.map((notice) => (
                    <TableRow key={notice.id}>
                      <TableCell className="font-medium flex items-center gap-1.5">
                        {notice.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                        {notice.title}
                      </TableCell>
                      <TableCell className="capitalize">{notice.category}</TableCell>
                      <TableCell>
                        <Badge variant={priorityVariants[notice.priority]} className="capitalize">
                          {notice.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{notice.expiresAt ? formatDate(notice.expiresAt) : "—"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEdit(notice)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate({ id: notice.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No notices yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
