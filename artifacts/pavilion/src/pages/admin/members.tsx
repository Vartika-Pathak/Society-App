import React, { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPatch, apiDelete, ApiFetchError } from "@/lib/api-fetch";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

type Role = "resident" | "guard" | "admin";

interface Member {
  id: number;
  name: string;
  email: string;
  flatNumber: string;
  role: Role;
  createdAt: string;
}

const emptyForm = { name: "", email: "", password: "", flatNumber: "" };

// Guards and admins aren't "members" here — a member is the one account per flat that
// represents that resident. Guard accounts are created from the Admin page and will get
// their own management screen under Maintenance later; this list only ever shows residents.
export default function Members() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadMembers = useCallback(async () => {
    try {
      const data = await apiGet<Member[]>("/api/admin/users");
      setMembers(data.filter((member) => member.role === "resident"));
    } catch (error) {
      toast({
        title: "Couldn't load members",
        description: error instanceof ApiFetchError ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (member: Member) => {
    setEditingId(member.id);
    setForm({ name: member.name, email: member.email, password: "", flatNumber: member.flatNumber });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await apiPatch(`/api/admin/users/${editingId}`, {
          name: form.name,
          flatNumber: form.flatNumber,
          role: "resident",
        });
        toast({ title: "Member updated" });
      } else {
        await apiPost("/api/admin/users", {
          name: form.name,
          email: form.email,
          password: form.password,
          flatNumber: form.flatNumber,
          role: "resident",
        });
        toast({ title: "Member created" });
      }
      resetForm();
      void loadMembers();
    } catch (error) {
      toast({
        title: editingId ? "Couldn't update member" : "Couldn't create member",
        description: error instanceof ApiFetchError ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await apiDelete(`/api/admin/users/${id}`);
      toast({ title: "Member deleted" });
      void loadMembers();
    } catch (error) {
      toast({
        title: "Couldn't delete member",
        description: error instanceof ApiFetchError ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Members Management</h1>
          <p className="text-muted-foreground text-sm">
            One account per flat — the resident who signs in, not family members. Guard accounts are managed
            separately from the Admin page.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> {editingId ? "Edit Member" : "Create New Member"}
            </CardTitle>
            {!editingId && <CardDescription>New accounts can log in immediately with the password set here.</CardDescription>}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="member-name">Name</Label>
                <Input
                  id="member-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-email">Email</Label>
                <Input
                  id="member-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  disabled={!!editingId}
                  required
                />
              </div>
              {!editingId && (
                <div className="space-y-2">
                  <Label htmlFor="member-password">Password</Label>
                  <Input
                    id="member-password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="member-flat">Flat Number</Label>
                <Input
                  id="member-flat"
                  placeholder="e.g. A-100"
                  value={form.flatNumber}
                  onChange={(e) => setForm((f) => ({ ...f, flatNumber: e.target.value }))}
                  required
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving…" : editingId ? "Update Member" : "Create Member"}
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
            <CardDescription>{members?.length ?? 0} member{members?.length === 1 ? "" : "s"}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : members && members.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Flat</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.flatNumber}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEdit(member)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={deletingId === member.id}
                          onClick={() => handleDelete(member.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No members yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
