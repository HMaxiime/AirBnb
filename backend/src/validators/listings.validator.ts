import { z } from "zod";

// Listing schemas keep the create payload strict and let updates reuse the same fields as optional.
export const createListingSchema = z.object({
  title:       z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location:    z.string().min(1, "Location is required"),
  price:       z.number().positive("Price must be a positive number"),
  guests:      z.number().int().min(1, "At least 1 guest is required"),
  type:        z.enum(["APARTMENT", "HOUSE", "ROOM", "OTHER"]),
  amenities:   z.array(z.string()).default([]),
});

export const updateListingSchema = createListingSchema.partial();
// .partial() makes all fields optional — perfect for PUT/PATCH