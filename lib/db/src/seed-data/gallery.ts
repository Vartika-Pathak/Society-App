import type { InsertGalleryPhoto } from "../schema/gallery";

// A starter set of community photos so the gallery isn't empty on a fresh
// deploy — covers amenities, celebrations, and everyday community life.
export const communityGalleryPhotos: InsertGalleryPhoto[] = [
  {
    imageUrl: "https://images.unsplash.com/photo-1519874179391-30027f5c5e5c?auto=format&fit=crop&w=1200&q=80",
    title: "Rooftop Pool",
    description: "Residents cooling off at the rooftop pool on a summer afternoon.",
    uploadedBy: "Amenities Committee",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=80",
    title: "Fitness Center",
    description: "The newly refurbished gym, open 24/7 for residents.",
    uploadedBy: "Amenities Committee",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
    title: "Diwali Mela",
    description: "Diyas and rangoli lit up the central courtyard for last year's Diwali Mela.",
    uploadedBy: "Events Committee",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1610123172763-e832ea993c22?auto=format&fit=crop&w=1200&q=80",
    title: "Garba Night",
    description: "Traditional garba and dandiya during Navratri celebrations.",
    uploadedBy: "Cultural Committee",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1560448204-61dc36dc98c8?auto=format&fit=crop&w=1200&q=80",
    title: "Clubhouse Lounge",
    description: "The clubhouse lounge — a favorite spot for weekend get-togethers.",
    uploadedBy: "Amenities Committee",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80",
    title: "Kids' Play Area",
    description: "The playground stays busy every evening with the building's kids.",
    uploadedBy: "Amenities Committee",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1464047736614-af63643285bf?auto=format&fit=crop&w=1200&q=80",
    title: "Society Sports Day",
    description: "Friendly cricket and relay races on Society Sports Day.",
    uploadedBy: "Sports Committee",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=1200&q=80",
    title: "Green Gardens",
    description: "The landscaped garden and walking path around the building.",
    uploadedBy: "Amenities Committee",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1543269664-56d93c1b41a6?auto=format&fit=crop&w=1200&q=80",
    title: "New Year's Eve Party",
    description: "Ringing in the New Year together on the clubhouse terrace.",
    uploadedBy: "Events Committee",
  },
];
