// booking.controller.ts: handles controllers functionality.
import prisma from "../config/prisma.js";
import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { createBookingSchema } from "../validators/bookings.validators.js";

// Shared include block so every response returns the listing's first photo.
const bookingInclude = {
  guest:   { select: { id: true, name: true, email: true } },
  listing: {
    select: {
      id:       true,
      title:    true,
      location: true,
      price:    true,
      photos:   { select: { url: true }, take: 1 },
    },
  },
} as const;

// Return bookings filtered by the caller's role:
//   GUEST  → only their own bookings
//   HOST   → bookings for all of their listings
//   ADMIN  → every booking in the system
export const getAllBookings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, role } = req as AuthRequest;

    let where: Record<string, unknown> = {};

    if (role === "GUEST" && userId) {
      where = { guestId: userId };
    } else if (role === "HOST" && userId) {
      const hostListings = await prisma.listing.findMany({
        where:  { hostId: userId },
        select: { id: true },
      });
      where = { listingId: { in: hostListings.map((l) => l.id) } };
    }
    // ADMIN: no filter

    const bookings = await prisma.booking.findMany({
      where,
      include:  bookingInclude,
      orderBy:  { createdAt: "desc" },
    });

    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};

// GET /bookings/:id — return a single booking, or 404
// Fetch one booking by id and return 404 if nothing matches.
export const getBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params["id"] as string;

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        guest: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true, location: true, price: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json(booking);
  } catch (error) {
    next(error);
  }
};

// Hosts use this flow to approve or reject a booking.
export const changeBookingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params["id"] as string;
  

    if (!id) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const rawStatus = req.body?.status as string | undefined;

    if (!rawStatus) {
      return res.status(400).json({ message: "Status is required" });
    }

    const normalizedStatus = rawStatus.toUpperCase();
    if (!["PENDING", "CONFIRMED", "CANCELLED"].includes(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const existingBooking = await prisma.booking.findUnique({ where: { id } });
    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: normalizedStatus as "PENDING" | "CONFIRMED" | "CANCELLED" },
      include: {
        guest: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true } },
      },
    });

    res
      .status(200)
      .json({ message: "Booking status updated successfully", updatedBooking });
  } catch (error) {
    next(error);
  }
};

// POST /bookings — create a new booking, or 400 if fields are missing
// Create a booking after validating dates, ids, and overlap rules.
export const createBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = createBookingSchema.parse(req.body);
    const guestIdFromToken = req.userId;

    if (!guestIdFromToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const parsedCheckIn = new Date(data.checkIn);
    const parsedCheckOut = new Date(data.checkOut);

    const booking = await prisma.$transaction(async (tx) => {
      // Check for conflicts inside the transaction
      const conflict = await tx.booking.findFirst({
        where: {
          listingId: data.listingId,
          status: "CONFIRMED",
          checkIn: { lt: parsedCheckOut },
          checkOut: { gt: parsedCheckIn },
        },
      });

      if (conflict) {
        throw new Error("Listing already booked for these dates");
        // throwing inside $transaction automatically rolls back everything
      }

      // Safe to create — no conflict found
      return tx.booking.create({
        data: {
          listingId:  data.listingId,
          guestId:    guestIdFromToken,
          checkIn:    parsedCheckIn,
          checkOut:   parsedCheckOut,
          totalPrice: data.totalPrice,
          status:     "CONFIRMED",
        },
        include: bookingInclude,
      });
    });

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

//DELETE booking
// Delete a booking by id.
export const deleteBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params["id"] as string;
    

    if (!id) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    await prisma.booking.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

//PUT update booking
// Update a booking using the fields provided in the request body.
export const updateBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params["id"] as string;

    if (!id) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const { checkIn, checkOut, totalPrice, listingId, status } = req.body;

    // Validate and convert listingId if provided
    if (listingId && isNaN(parseInt(listingId))) {
      return res.status(400).json({ message: "Invalid listing ID" });
    }

    const updateData: any = {};
    if (checkIn) updateData.checkIn = checkIn;
    if (checkOut) updateData.checkOut = checkOut;
    if (totalPrice) updateData.totalPrice = totalPrice;
    if (listingId) updateData.listingId = parseInt(listingId);
    if (status) updateData.status = status;

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        guest: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true } },
      },
    });
    res.status(200).json({ message: "Booking updated successfully", updatedBooking });
  } catch (error) {
    next(error);
  }
};
