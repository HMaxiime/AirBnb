import { z } from "zod";

const bookingBaseSchema = z.object({
  listingId: z.string().uuid("Listing ID must be a valid UUID"),
  guestId: z.string().uuid("Guest ID must be a valid UUID").optional(),
  totalPrice: z.number().positive("Total price must be positive"),
  checkIn: z.string().datetime("Invalid checkIn date"),
  checkOut: z.string().datetime("Invalid checkOut date"),
});

// Booking creation rules: ids must be valid integers, dates must be valid ISO strings, and check-in must be before check-out.
export const createBookingSchema = bookingBaseSchema
  .refine(
    (data) => new Date(data.checkIn) < new Date(data.checkOut),
    { message: "checkIn must be before checkOut", path: ["checkIn"] },
  )
  .refine(
    (data) => new Date(data.checkIn) > new Date(),
    { message: "checkIn must be in the future", path: ["checkIn"] },
  );

export const updateBookingSchema = bookingBaseSchema.partial();