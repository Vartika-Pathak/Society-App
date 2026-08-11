import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSocietyInfo,
  useUpdateSocietyInfo,
  getGetSocietyInfoQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SocietyMaster() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const society = useGetSocietyInfo({ query: { queryKey: getGetSocietyInfoQueryKey() } });

  const [form, setForm] = useState({ name: "", address: "", contactNumber: "", email: "" });

  useEffect(() => {
    if (society.data) {
      setForm({
        name: society.data.name,
        address: society.data.address,
        contactNumber: society.data.contactNumber,
        email: society.data.email,
      });
    }
  }, [society.data]);

  const update = useUpdateSocietyInfo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSocietyInfoQueryKey() });
        toast({ title: "Society information updated" });
      },
      onError: (error) => {
        toast({
          title: "Couldn't update society information",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-medium mb-1">Society Master</h1>
          <p className="text-muted-foreground text-sm">Update your society's information.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Update Society Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                update.mutate({ data: form });
              }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="space-y-2">
                <Label htmlFor="society-name">Society Name</Label>
                <Input
                  id="society-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="society-address">Address</Label>
                <Input
                  id="society-address"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="society-contact">Contact Number</Label>
                <Input
                  id="society-contact"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={form.contactNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactNumber: e.target.value.replace(/\D/g, "").slice(0, 10) }))
                  }
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  title="10-digit mobile number starting with 6-9"
                  maxLength={10}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="society-email">Email</Label>
                <Input
                  id="society-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={update.isPending || society.isLoading}>
                  {update.isPending ? "Updating…" : "Update Society"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
