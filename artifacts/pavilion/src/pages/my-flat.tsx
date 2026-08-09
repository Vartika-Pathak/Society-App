import React, { useState } from "react";
import {
  useGetMyFlat,
  useRequestFlatChange,
  getGetMyFlatQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Home, MessageSquare } from "lucide-react";

const flatTypeLabels: Record<string, string> = {
  "1bhk": "1 BHK",
  "2bhk": "2 BHK",
  "3bhk": "3 BHK",
  "4bhk": "4 BHK",
};

export default function MyFlat() {
  const { toast } = useToast();
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [message, setMessage] = useState("");

  const myFlat = useGetMyFlat({ query: { queryKey: getGetMyFlatQueryKey() } });

  const requestChange = useRequestFlatChange({
    mutation: {
      onSuccess: () => {
        toast({ title: "Request sent", description: "The admin will review it." });
        setIsRequestOpen(false);
        setMessage("");
      },
      onError: (error) => {
        toast({
          title: "Couldn't send the request",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myFlat.data || !message.trim()) return;
    requestChange.mutate({ id: myFlat.data.id, data: { message: message.trim() } });
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium mb-1">My Flat</h1>
        <p className="text-muted-foreground text-sm">Your flat's details, as recorded by the admin.</p>
      </div>

      {myFlat.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : myFlat.data ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {myFlat.data.flatNumber}, {myFlat.data.buildingName}
                </CardTitle>
                <CardDescription>{flatTypeLabels[myFlat.data.flatType] ?? myFlat.data.flatType}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={myFlat.data.occupied ? "default" : "secondary"} className="mt-1">
                  {myFlat.data.occupied ? "Occupied" : "Vacant"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Ownership</p>
                <p className="font-medium capitalize mt-1">{myFlat.data.ownershipType}</p>
              </div>
            </div>

            <Button type="button" variant="outline" onClick={() => setIsRequestOpen(true)}>
              <MessageSquare className="h-4 w-4 mr-2" /> Request a correction
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <Home className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">No flat assigned yet</p>
            <p className="text-muted-foreground text-sm">
              The admin hasn't linked your account to a flat yet. Contact the committee if this seems wrong.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a correction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <Textarea
              placeholder="What's wrong, and what should it be instead?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRequestOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={requestChange.isPending || !message.trim()}>
                {requestChange.isPending ? "Sending…" : "Send request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
