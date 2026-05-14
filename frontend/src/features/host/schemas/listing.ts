import { z } from "zod";

export const listingSchema = z.object({
  title:         z.string().min(1, "Title is required"),
  description:   z.string().min(1, "Description is required"),
  location:      z.string().min(1, "Location is required"),
  price:         z.coerce.number().min(1, "Price must be at least $1"),
  guests:        z.coerce.number().min(1, "At least 1 guest").default(1),
  category:      z.enum(["house", "apartment", "villa"]),
  superhost:     z.boolean().default(false),
  available:     z.boolean().default(true),
  availableFrom: z.string().optional(),
});

export type ListingFormData = z.infer<typeof listingSchema>;
