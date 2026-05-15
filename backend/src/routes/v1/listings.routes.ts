// listings.routes.ts: handles routes functionality.
import { Router } from "express";
import {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  addPhotos,
  deletePhoto,
  listingstatus,
  patchListingStatus,
} from "../../controllers/listings.controller.js";
import { authenticate, requireHost, requireAdmin } from "../../middlewares/auth.middleware.js";
import { strictLimiter } from "../../middlewares/rateLimiter.js";
import upload from "../../config/multer.js";

const router = Router();

// Property listing management: hosts create/update/delete listings; guests browse.
// Read endpoints are public; write endpoints require host authentication.
/**
 * @swagger
 * /listings:
 *   get:
 *     summary: Retrieve all available listings (public)
 *     description: Get a paginated list of all active property listings. No authentication required.
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: A list of property listings

 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /listings/status:
 *   get:
 *     summary: Get listing availability status (public)
 *     description: Retrieve availability status for listings to show booking calendars.
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: Availability status for all listings
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /listings/{id}:
 *   get:
 *     summary: Retrieve a specific listing by ID (public)
 *     description: Get detailed information about a single property listing including amenities, photos, and reviews.
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The listing ID
 *     responses:
 *       200:
 *         description: The requested listing with full details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /listings:
 *   post:
 *     summary: Create a new property listing (host only)
 *     description: Create a new property listing. Requires host authentication and role.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ListingInput'
 *           example:
 *             title: Cozy Beach House
 *             description: Beautiful beachfront property with ocean views
 *             location: Miami, Florida
 *             price: 150
 *             guests: 4
 *             type: APARTMENT
 *             amenities: ["WiFi", "Pool", "Kitchen", "Gym"]
 *     responses:
 *       201:
 *         description: Listing created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       400:
 *         description: Bad request (invalid data or missing fields)
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 *       403:
 *         description: Forbidden - user must be a host
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /listings/{id}:
 *   put:
 *     summary: Update an existing property listing (host owner only)
 *     description: Update listing details. Only the host who created the listing can update it.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The listing ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ListingInput'
 *           example:
 *             price: 175
 *             description: Updated description
 *     responses:
 *       200:
 *         description: Listing updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       400:
 *         description: Bad request (invalid data)
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 *       403:
 *         description: Forbidden - user must be the listing owner
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /listings/{id}:
 *   delete:
 *     summary: Delete a property listing (host owner only)
 *     description: Remove a property listing and all associated bookings/photos. Only the host owner can delete.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The listing ID to delete
 *     responses:
 *       200:
 *         description: Listing deleted successfully
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 *       403:
 *         description: Forbidden - user must be the listing owner
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Internal server error
 */

// Public read routes do not need authentication.
// Write routes are protected by host auth and the strict limiter.

router.get("/",          getAllListings);   // public
router.get("/status",    listingstatus);    // public
router.get("/:id",       getListingById);  // public

// Create listing — accepts up to 10 images under the "photos" multipart field.
router.post(
  "/",
  authenticate, requireHost, strictLimiter,
  upload.array("photos", 10),
  createListing,
);

// Update listing fields and/or photos (append by default; replacePhotos=true to swap all).
router.put(
  "/:id",
  authenticate, requireHost, strictLimiter,
  upload.array("photos", 10),
  updateListing,
);

// Add photos to an existing listing without touching other fields.
router.post(
  "/:id/photos",
  authenticate, requireHost, strictLimiter,
  upload.array("photos", 10),
  addPhotos,
);

// Remove a single photo from a listing.
router.delete("/:id/photos/:photoId", authenticate, requireHost, deletePhoto);

// Delete the entire listing (also removes its Cloudinary assets).
router.delete("/:id", authenticate, requireHost, strictLimiter, deleteListing);

// Admin: approve or reject a listing.
router.patch("/:id/status", authenticate, requireAdmin, patchListingStatus);

export default router;