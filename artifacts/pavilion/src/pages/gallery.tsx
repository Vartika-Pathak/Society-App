import React from "react";
import { useListGalleryPhotos } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon } from "lucide-react";

export default function Gallery() {
  const { data: photos, isLoading } = useListGalleryPhotos();

  return (
    <div className="w-full pb-24">
      {/* Header */}
      <div className="relative overflow-hidden bg-primary py-12 border-b">
        <img
          src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-10 container mx-auto px-4 md:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4 text-primary-foreground">Life at Pavilion</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Moments, events, and everyday life in our community.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-12">
        {isLoading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton 
                key={i} 
                className={`w-full rounded-2xl break-inside-avoid ${i % 2 === 0 ? 'h-64' : 'h-96'}`} 
              />
            ))}
          </div>
        ) : photos && photos.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {photos.map((photo) => (
              <div 
                key={photo.id} 
                className="relative group break-inside-avoid overflow-hidden rounded-2xl bg-muted border"
              >
                <img 
                  src={photo.imageUrl} 
                  alt={photo.title || "Gallery photo"} 
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Overlay that appears on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  {photo.title && (
                    <h3 className="text-white font-medium text-lg mb-1">{photo.title}</h3>
                  )}
                  {photo.description && (
                    <p className="text-white/80 text-sm line-clamp-2">{photo.description}</p>
                  )}
                  {photo.uploadedBy && (
                    <p className="text-white/60 text-xs mt-2 font-medium">Shared by {photo.uploadedBy}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-muted/30 rounded-3xl border border-dashed max-w-2xl mx-auto">
            <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-serif font-medium mb-2">No photos yet</h3>
            <p className="text-muted-foreground">Our community album is waiting to be filled.</p>
          </div>
        )}
      </div>
    </div>
  );
}
