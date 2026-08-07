import React, { useCallback, useEffect, useState } from "react";
import { BadgeCheck, X, ShieldPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { apiGet, apiPatch, apiPost, ApiFetchError } from "@/lib/api-fetch";
import { AdminLayout } from "@/components/admin-layout";

interface VerificationRequest {
  id: number;
  flatNumber: string;
  name: string;
  documentsVerified: boolean;
  paymentReceived: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedAt: string | null;
}

interface GuardAccount {
  id: number;
  name: string;
  email: string;
  role: string;
}

const statusVariants: Record<VerificationRequest["status"], "secondary" | "default" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "outline",
};

function CreateGuardCard() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^[A-Za-z0-9._%+-]+@pavilion\.com$/.test(email)) {
      toast({
        title: "Invalid email",
        description: "Guard accounts must use a @pavilion.com email address.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const guard = await apiPost<GuardAccount>("/api/admin/guards", { name, email, password });
      toast({
        title: "Guard account created",
        description: `Share these credentials with ${guard.name} directly — they'll log in from the regular login page.`,
      });
      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      toast({
        title: "Couldn't create guard account",
        description: error instanceof ApiFetchError ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldPlus className="h-5 w-5" /> Create guard account
        </CardTitle>
        <CardDescription>
          Guards don't sign up themselves — create their login here and hand the credentials to them directly. They'll
          then sign in from the regular login page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3 sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="guard-name">Name</Label>
            <Input
              id="guard-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sam Guard"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guard-email">Email</Label>
            <Input
              id="guard-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sam@pavilion.com"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guard-password">Password</Label>
            <Input
              id="guard-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create guard account"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      const data = await apiGet<VerificationRequest[]>("/api/admin/verification-requests");
      setRequests(data);
    } catch (error) {
      toast({
        title: "Couldn't load verification requests",
        description: error instanceof ApiFetchError ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const updateRequest = async (
    id: number,
    body: Partial<{ documentsVerified: boolean; paymentReceived: boolean; action: "approve" | "reject" }>
  ) => {
    setUpdatingId(id);
    try {
      const updated = await apiPatch<VerificationRequest>(`/api/admin/verification-requests/${id}`, body);
      setRequests((prev) => (prev ? prev.map((r) => (r.id === id ? updated : r)) : prev));
    } catch (error) {
      toast({
        title: "Couldn't update the request",
        description: error instanceof ApiFetchError ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const pending = requests?.filter((r) => r.status === "pending") ?? [];
  const reviewed = requests?.filter((r) => r.status !== "pending") ?? [];

  return (
    <AdminLayout>
    <div className="w-full">
      <div className="bg-primary/5 py-16 border-b">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-2">Resident verification</h1>
          <p className="text-muted-foreground">
            Review first-time residents' requests before they can sign up. Confirm documents and payment some other
            way, then tick both off here before approving.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16 space-y-10">
        <CreateGuardCard />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending requests</CardTitle>
            <CardDescription>
              {pending.length === 0 ? "Nothing waiting on review." : `${pending.length} waiting on review.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : pending.length === 0 ? (
              <p className="text-muted-foreground text-sm">All caught up.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flat</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((request) => {
                    const canApprove = request.documentsVerified && request.paymentReceived;
                    const isUpdating = updatingId === request.id;
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.flatNumber}</TableCell>
                        <TableCell>{request.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={request.documentsVerified}
                            disabled={isUpdating}
                            onCheckedChange={(checked) =>
                              updateRequest(request.id, { documentsVerified: checked === true })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={request.paymentReceived}
                            disabled={isUpdating}
                            onCheckedChange={(checked) =>
                              updateRequest(request.id, { paymentReceived: checked === true })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={!canApprove || isUpdating}
                            onClick={() => updateRequest(request.id, { action: "approve" })}
                          >
                            <BadgeCheck className="h-4 w-4 mr-1 text-blue-400" /> Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isUpdating}
                            onClick={() => updateRequest(request.id, { action: "reject" })}
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {reviewed.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reviewed</CardTitle>
              <CardDescription>Already decided — kept here for reference.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flat</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewed.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.flatNumber}</TableCell>
                      <TableCell>{request.name}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[request.status]} className="capitalize">
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </AdminLayout>
  );
}
