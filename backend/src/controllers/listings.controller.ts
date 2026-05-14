import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { createListingSchema, updateListingSchema } from "../validators/listings.validator.js";

// Multipart form sends every field as a string — coerce before Zod validation.
function coerceBody(body: Record<string, unknown>) {
  return {
    ...body,
    price:     body["price"]  !== undefined ? Number(body["price"])  : undefined,
    guests:    body["guests"] !== undefined ? Number(body["guests"]) : undefined,
    amenities: parseAmenities(body["amenities"]),
  };
}

// Amenities can arrive in three different shapes depending on the client:
//   1. Already an array  → ["WiFi", "Pool"]          (repeated form fields)
//   2. JSON string       → '["WiFi","Pool"]'          (single field, JSON-encoded)
//   3. Comma-separated   → "WiFi,Pool,Kitchen"        (plain string)
//   4. Single value      → "WiFi"                     (only one amenity)
function parseAmenities(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);

  if (typeof value === "string") {
    const trimmed = value.trim();
    // JSON array string
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {
        // fall through to comma-split
      }
    }
    // Comma-separated or single value
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }

  return [];
}

// Upload every file in req.files to Cloudinary under the given folder.
async function uploadFiles(
  files: Express.Multer.File[],
  folder: string,
): Promise<{ url: string; publicId: string }[]> {
  return Promise.all(
    files.map((file) => uploadToCloudinary(file.buffer, folder)),
  );
}

// ─── GET /listings ─────────────────────────────────────────────────────────────
export async function getAllListings(req: Request, res: Response, next: NextFunction) {
  try {
    const page   = parseInt(req.query["page"]   as string) || 1;
    const limit  = parseInt(req.query["limit"]  as string) || 20;
    const skip   = (page - 1) * limit;
    const hostId = req.query["hostId"] as string | undefined;

    const where = hostId ? { hostId } : {};

    const now = new Date();
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        include: {
          host:   { select: { id: true, name: true, email: true } },
          photos: { select: { id: true, url: true, publicId: true } },
          // Fetch only active confirmed bookings so the adapter can compute availability.
          booking: {
            where:  { status: "CONFIRMED", checkOut: { gte: now } },
            select: { id: true },
            take:   1,
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      data: listings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /listings/:id ─────────────────────────────────────────────────────────
export async function getListingById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    if (!id) return res.status(400).json({ error: "Invalid listing ID" });

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        host:    { select: { id: true, name: true, email: true } },
        photos:  { select: { id: true, url: true, publicId: true } },
        review:  { select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { id: true, name: true } } } },
        booking: {
          where:  { status: "CONFIRMED", checkOut: { gte: new Date() } },
          select: { id: true, checkIn: true, checkOut: true },
        },
      },
    });

    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(listing);
  } catch (error) {
    next(error);
  }
}

// ─── POST /listings ────────────────────────────────────────────────────────────
// Accepts multipart/form-data. Up to 10 images under the "photos" field.
export async function createListing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const data = createListingSchema.parse(coerceBody(req.body));

    const host = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!host) return res.status(404).json({ error: "User not found" });

    // Create the listing first so we have an ID for the Cloudinary folder.
    const listing = await prisma.listing.create({
      data: {
        title:       data.title,
        description: data.description,
        location:    data.location,
        price:       data.price,
        guests:      data.guests,
        type:        data.type,
        amenities:   data.amenities,
        hostId:      req.userId,
      },
    });

    // Upload any attached photos and persist the records.
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length > 0) {
      const uploaded = await uploadFiles(files, `listings/${listing.id}`);
      await prisma.listingPhoto.createMany({
        data: uploaded.map(({ url, publicId }) => ({
          url,
          publicId,
          listingId: listing.id,
        })),
      });
    }

    // Return the full listing with photos included.
    const result = await prisma.listing.findUnique({
      where: { id: listing.id },
      include: {
        host:   { select: { id: true, name: true, email: true } },
        photos: { select: { id: true, url: true, publicId: true } },
      },
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

// ─── PUT /listings/:id ─────────────────────────────────────────────────────────
// Accepts multipart/form-data.
// Pass replacePhotos=true to delete existing photos and replace them entirely.
// Omit it (or set false) to append new photos to the existing set.
export async function updateListing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    if (!id) return res.status(400).json({ error: "Invalid listing ID" });

    const data = updateListingSchema.parse(coerceBody(req.body));

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { photos: true },
    });
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.hostId !== req.userId) {
      return res.status(403).json({ error: "Forbidden: you can only update your own listings" });
    }

    // Strip undefined values so Prisma only updates supplied fields.
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    await prisma.listing.update({ where: { id }, data: updateData });

    const files = (req.files as Express.Multer.File[]) ?? [];
    const replacePhotos = req.body["replacePhotos"] === "true" || req.body["replacePhotos"] === true;

    if (files.length > 0 || replacePhotos) {
      // Delete existing Cloudinary assets and DB records when replacing.
      if (replacePhotos && listing.photos.length > 0) {
        await Promise.all(
          listing.photos
            .filter((p) => p.publicId)
            .map((p) => deleteFromCloudinary(p.publicId!)),
        );
        await prisma.listingPhoto.deleteMany({ where: { listingId: id } });
      }

      // Upload and persist the new photos.
      if (files.length > 0) {
        const uploaded = await uploadFiles(files, `listings/${id}`);
        await prisma.listingPhoto.createMany({
          data: uploaded.map(({ url, publicId }) => ({ url, publicId, listingId: id })),
        });
      }
    }

    const result = await prisma.listing.findUnique({
      where: { id },
      include: {
        host:   { select: { id: true, name: true, email: true } },
        photos: { select: { id: true, url: true, publicId: true } },
      },
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

// ─── DELETE /listings/:id ──────────────────────────────────────────────────────
export async function deleteListing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    if (!id) return res.status(400).json({ error: "Invalid listing ID" });

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { photos: true },
    });
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.hostId !== req.userId) {
      return res.status(403).json({ error: "Forbidden: you can only delete your own listings" });
    }

    // Remove Cloudinary assets before deleting the DB record.
    if (listing.photos.length > 0) {
      await Promise.all(
        listing.photos
          .filter((p) => p.publicId)
          .map((p) => deleteFromCloudinary(p.publicId!)),
      );
    }

    await prisma.listing.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// ─── POST /listings/:id/photos ─────────────────────────────────────────────────
// Add photos to an existing listing without touching the other fields.
export async function addPhotos(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    if (!id) return res.status(400).json({ error: "Invalid listing ID" });

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.hostId !== req.userId) {
      return res.status(403).json({ error: "Forbidden: you can only update your own listings" });
    }

    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) {
      return res.status(400).json({ error: "No photos provided" });
    }

    const uploaded = await uploadFiles(files, `listings/${id}`);
    const photos = await prisma.$transaction(
      uploaded.map(({ url, publicId }) =>
        prisma.listingPhoto.create({ data: { url, publicId, listingId: id } }),
      ),
    );

    res.status(201).json(photos);
  } catch (error) {
    next(error);
  }
}

// ─── DELETE /listings/:id/photos/:photoId ──────────────────────────────────────
// Remove a single photo from a listing.
export async function deletePhoto(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id, photoId } = req.params as { id: string; photoId: string };

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.hostId !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const photo = await prisma.listingPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.listingId !== id) {
      return res.status(404).json({ error: "Photo not found" });
    }

    if (photo.publicId) await deleteFromCloudinary(photo.publicId);
    await prisma.listingPhoto.delete({ where: { id: photoId } });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// ─── GET /listings/:id/status ──────────────────────────────────────────────────
export async function listingstatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    if (!id) return res.status(400).json({ error: "Invalid listing ID" });

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { host: { select: { id: true, name: true } } },
    });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    res.json({ id, status: "active", listing });
  } catch (error) {
    next(error);
  }
}
