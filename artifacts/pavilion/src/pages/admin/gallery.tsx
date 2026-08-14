import React, { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import {
  useListGalleryPhotos,
  useAddGalleryPhoto,
  useDeleteGalleryPhoto,
  getListGalleryPhotosQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/format-date";

export default function AdminGallery() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const photos = useListGalleryPhotos({ query: { queryKey: getListGalleryPhotosQueryKey() } });

  const add = useAddGalleryPhoto({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGalleryPhotosQueryKey() });
        toast({ title: "Photo added to the gallery" });
        setPhoto(null);
        setTitle("");
        setDescription("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      onError: (error) => {
        toast({
          title: "Couldn't add the photo",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const remove = useDeleteGalleryPhoto({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGalleryPhotosQueryKey() });
        toast({ title: "Photo removed" });
      },
      onError: () => {
        toast({ title: "Couldn't remove the photo", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) return;
    add.mutate({ data: { photo, title: title || undefined, description: description || undefined } });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-1">Gallery</h1>
          <p className="text-muted-foreground text-sm">Photos added here appear on the public Gallery page.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add a Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gallery-photo">Photo</Label>
                <input
                  ref={fileInputRef}
                  id="gallery-photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  required
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                />
                {photo && (
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={photo.name}
                    className="h-32 w-32 rounded-lg object-cover border mt-2"
                  />
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gallery-title">Title</Label>
                  <Input
                    id="gallery-title"
                    placeholder="Optional"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gallery-description">Description</Label>
                  <Input
                    id="gallery-description"
                    placeholder="Optional"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" disabled={!photo || add.isPending}>
                {add.isPending ? "Adding…" : "Add Photo"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {photos.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : photos.isError ? (
              <p className="text-destructive text-sm">Couldn't load gallery photos — try refreshing the page.</p>
            ) : photos.data && photos.data.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.data.map((item) => (
                  <div key={item.id} className="relative group rounded-lg overflow-hidden border bg-muted">
                    <img src={item.imageUrl} alt={item.title ?? "Gallery photo"} className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                      {item.title && <p className="text-white text-xs font-medium truncate">{item.title}</p>}
                      <p className="text-white/70 text-[10px]">{formatDateTime(item.uploadedAt)}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="mt-1 h-6 text-xs"
                        disabled={remove.isPending}
                        onClick={() => remove.mutate({ id: item.id })}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No photos yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
