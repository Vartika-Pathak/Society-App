import type { InsertGalleryPhoto } from "../schema/gallery";

// A starter set of community photos so the gallery isn't empty on a fresh deploy. Deliberately
// short right now — this sandbox can't browse/verify image content, so every entry here is one
// the user picked and confirmed themselves (or, for Fitness Center, one that happened to render
// correctly and match). The many other guessed photo IDs that turned out broken or mismatched
// were removed rather than left showing wrong content; add real ones back in as they're sourced.
export const communityGalleryPhotos: InsertGalleryPhoto[] = [
  {
    imageUrl: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=80",
    title: "Fitness Center",
    description: "The newly refurbished gym, open 24/7 for residents.",
    uploadedBy: "Amenities Committee",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1577083753695-e010191bacb5?q=80&w=1170&auto=format&fit=crop",
    title: "Diwali Mela",
    description: "Diyas and rangoli lit up the central courtyard for last year's Diwali Mela.",
    uploadedBy: "Events Committee",
  },
];
