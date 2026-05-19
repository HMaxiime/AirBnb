import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { createListingSchema, updateListingSchema } from "../validators/listings.validator.js";
import { sendEmail } from "../config/email.js";
import { listingSubmittedEmail, listingApprovedEmail, listingRejectedEmail } from "../templates/emails.js";

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
    const page        = parseInt(req.query["page"]  as string) || 1;
    const limit       = parseInt(req.query["limit"] as string) || 20;
    const skip        = (page - 1) * limit;
    const hostId      = req.query["hostId"] as string | undefined;
    const statusParam = (req.query["status"] as string | undefined)?.toUpperCase();

    // Hosts fetching their own listings see all statuses.
    // Admin passing ?status=PENDING gets the moderation queue.
    // Everyone else (public browse) sees only APPROVED listings.
    let where: Record<string, unknown>;
    if (hostId) {
      where = { hostId };
    } else if (statusParam && ["PENDING", "APPROVED", "REJECTED"].includes(statusParam)) {
      where = { status: statusParam };
    } else {
      where = { status: "APPROVED" };
    }

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
        status:      "PENDING",
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

    // Notify host that the listing is under review.
    if (result) {
      sendEmail(
        result.host.email,
        "Your listing is under review",
        listingSubmittedEmail(result.host.name, result.title),
      ).catch(() => {});
    }

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

// ─── PATCH /listings/:id/status — admin only ──────────────────────────────────
export async function patchListingStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id     = req.params["id"] as string;
    const status = (req.body["status"] as string | undefined)?.toUpperCase();
    const reason = (req.body["reason"] as string | undefined)?.trim() ?? "";

    if (!["APPROVED", "REJECTED", "PENDING"].includes(status ?? "")) {
      return res.status(400).json({ error: "status must be APPROVED, REJECTED, or PENDING" });
    }

    if (status === "REJECTED" && !reason) {
      return res.status(400).json({ error: "A reason is required when rejecting a listing" });
    }

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const updated = await prisma.listing.update({
      where: { id },
      data:  { status: status as "APPROVED" | "REJECTED" | "PENDING" },
      include: {
        host:   { select: { id: true, name: true, email: true } },
        photos: { select: { id: true, url: true, publicId: true } },
      },
    });

    // Notify host of approval or rejection with the admin's reason.
    if (status === "APPROVED") {
      sendEmail(
        updated.host.email,
        "Your listing has been approved!",
        listingApprovedEmail(updated.host.name, updated.title, reason),
      ).catch(() => {});
    } else if (status === "REJECTED") {
      sendEmail(
        updated.host.email,
        "Your listing was not approved",
        listingRejectedEmail(updated.host.name, updated.title, reason),
      ).catch(() => {});
    }

    res.json(updated);
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

// ─── GET /listings/moderation-history — admin only ────────────────────────────
// Returns approved and rejected listing counts grouped by month for the last 24 months.
export async function getModerationHistory(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.$queryRaw<{ month: string; status: string; count: bigint }[]>`
      SELECT
        TO_CHAR("updatedAt", 'YYYY-MM') AS month,
        status,
        COUNT(*)::int                  AS count
      FROM "Listing"
      WHERE status IN ('APPROVED', 'REJECTED')
      GROUP BY month, status
      ORDER BY month DESC
      LIMIT 48
    `;

    // Pivot into { month, approved, rejected } rows
    const map = new Map<string, { month: string; approved: number; rejected: number }>();
    for (const r of rows) {
      if (!map.has(r.month)) map.set(r.month, { month: r.month, approved: 0, rejected: 0 });
      const slot = map.get(r.month)!;
      if (r.status === "APPROVED") slot.approved = Number(r.count);
      if (r.status === "REJECTED") slot.rejected = Number(r.count);
    }

    const history = Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
    res.json(history);
  } catch (error) {
    next(error);
  }
}

