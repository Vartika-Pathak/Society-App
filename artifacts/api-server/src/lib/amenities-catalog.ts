export interface AmenityDefinition {
  id: string;
  name: string;
  description: string;
  requiresPayment: boolean;
  priceCents: number;
}

export const AMENITIES_CATALOG: AmenityDefinition[] = [
  {
    id: "clubhouse",
    name: "Clubhouse",
    description: "Shared lounge and event space.",
    requiresPayment: false,
    priceCents: 0,
  },
  {
    id: "swimming_pool",
    name: "Swimming Pool",
    description: "Residents' pool.",
    requiresPayment: false,
    priceCents: 0,
  },
  {
    id: "tennis_court",
    name: "Tennis Court",
    description: "Outdoor court, 2-hour sessions.",
    requiresPayment: true,
    priceCents: 1000,
  },
  {
    id: "party_hall",
    name: "Party Hall",
    description: "Private hall for events, catering allowed.",
    requiresPayment: true,
    priceCents: 5000,
  },
];

export function getAmenity(id: string): AmenityDefinition | undefined {
  return AMENITIES_CATALOG.find((a) => a.id === id);
}
