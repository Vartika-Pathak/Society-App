import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useListEvents, useCreateEvent, useDeleteEvent, getListEventsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format-date";

const emptyForm = { title: "", description: "", date: "", location: "", organizer: "" };

export default function AdminEvents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);

  const events = useListEvents({ query: { queryKey: getListEventsQueryKey() } });

  const onMutated = (message: string) => {
    queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
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

  const create = useCreateEvent({
    mutation: { onSuccess: () => onMutated("Event created"), onError: onError("Couldn't create event") },
  });
  const remove = useDeleteEvent({
    mutation: { onSuccess: () => onMutated("Event deleted"), onError: onError("Couldn't delete event") },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      data: {
        title: form.title,
        description: form.description || undefined,
        date: new Date(form.date).toISOString(),
        location: form.location,
        organizer: form.organizer || undefined,
      },
    });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Events</h1>
          <p className="text-muted-foreground text-sm">Manage the Social Calendar residents see under Events.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-title">Title</Label>
                <Input
                  id="event-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-date">Date &amp; Time</Label>
                <Input
                  id="event-date"
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-location">Location</Label>
                <Input
                  id="event-location"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-organizer">Organizer</Label>
                <Input
                  id="event-organizer"
                  placeholder="Optional"
                  value={form.organizer}
                  onChange={(e) => setForm((f) => ({ ...f, organizer: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="event-description">Description</Label>
                <Input
                  id="event-description"
                  placeholder="Optional"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? "Creating…" : "Create Event"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            {events.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : events.isError ? (
              <p className="text-destructive text-sm">Couldn't load events — try refreshing the page.</p>
            ) : events.data && events.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Organizer</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.data.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{formatDateTime(event.date)}</TableCell>
                      <TableCell>{event.location}</TableCell>
                      <TableCell>{event.organizer || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate({ id: event.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No events yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
