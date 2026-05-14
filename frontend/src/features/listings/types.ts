export interface Listing {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  superhost: boolean;
  available: boolean;
  availableFrom: string;
  img: string;
  category: "house" | "apartment" | "villa";
  photos?: string[];
}
