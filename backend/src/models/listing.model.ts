export interface Listing {
  id: number;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  guests: number;
  type: "apartment" | "house" | "villa" | "cabin";
  amenities: string[];
  rating?: number;
  host: string;
}

export const listings: Listing[] = [
  {
    id: 1,
    title: "Cozy Cabin near Volcanoes Park",
    description:
      "A warm wooden cabin with mountain views, perfect for a quiet weekend getaway.",
    location: "Musanze, Rwanda",
    pricePerNight: 85,
    guests: 4,
    type: "cabin",
    amenities: ["WiFi", "Fireplace", "Kitchen", "Free Parking"],
    rating: 4.7,
    host: "Alice Mukamana",
  },
  {
    id: 2,
    title: "Modern Apartment in Kigali",
    description:
      "A stylish apartment in the heart of Kigali, close to restaurants and shops.",
    location: "Kigali, Rwanda",
    pricePerNight: 120,
    guests: 2,
    type: "apartment",
    amenities: ["WiFi", "Air Conditioning", "Kitchen", "Free Parking"],
    rating: 4.5,
    host: "Charlie Kagabo",
  },
  {
    id: 3,
    title: "Beachfront Villa in Ndejje",
    description:
      "A luxurious villa with direct access to the beach, perfect for a romantic getaway.",
    location: "Ndejje, Rwanda",
    pricePerNight: 200,
    guests: 6,
    type: "villa",
    amenities: ["WiFi", "Pool", "Beach Access", "Kitchen"],
    host: "Jacky Mutoni",
  },
];
