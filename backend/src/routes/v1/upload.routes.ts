// upload.routes.ts: handles routes functionality.
import { Router } from "express";
import upload from "../../config/multer.js";
import { uploadAvatar, deleteAvatar, uploadListingImage, deleteListingImage } from "../../controllers/upload.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { strictLimiter } from "../../middlewares/rateLimiter.js";

const router = Router();

// File upload endpoints for avatars and listing images.
// All endpoints require authentication, rate limiting, and multipart/form-data with 'image' field.
/**
 * @swagger
 * /upload/users/{id}/avatar:
 *   post:
 *     summary: Upload or replace user avatar image
 *     description: Upload a profile picture for a user. Accepts JPEG, PNG, WEBP, or GIF (max 5MB).
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID to upload avatar for
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WEBP, GIF max 5MB)
 *             required: [image]
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 avatar:
 *                   type: string
 *       400:
 *         description: Bad request (no file or invalid format)
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 *       404:
 *         description: User not found
 *       413:
 *         description: Payload too large (file exceeds 5MB)
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /upload/users/{id}/avatar:
 *   delete:
 *     summary: Delete user avatar image
 *     description: Remove the user's profile picture from Cloudinary and database.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID whose avatar to delete
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /upload/listings/{id}/image:
 *   post:
 *     summary: Upload listing property image
 *     description: Upload a photo for a property listing. Accepts JPEG, PNG, WEBP, or GIF (max 5MB).
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The listing ID to upload image for
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WEBP, GIF max 5MB)
 *             required: [image]
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 imageUrl:
 *                   type: string
 *       400:
 *         description: Bad request (no file or invalid format)
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 *       404:
 *         description: Listing not found
 *       413:
 *         description: Payload too large (file exceeds 5MB)
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /upload/listings/{id}/image:
 *   delete:
 *     summary: Delete listing property image
 *     description: Remove a photo from a property listing and Cloudinary.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The listing photo ID to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 *       404:
 *         description: Image not found
 *       500:
 *         description: Internal server error
 */

// Upload endpoints authenticate first, then rate limit, then process the file body.
// The field name "image" must match what the client sends in the multipart form.
// post: handles post.
router.post("/users/:id/avatar", authenticate, strictLimiter, upload.single("image"), uploadAvatar);
// delete: handles delete.
router.delete("/users/:id/avatar", authenticate, strictLimiter, deleteAvatar);
// post: handles post.
router.post("/listings/:id/image", authenticate, strictLimiter, upload.single("image"), uploadListingImage);
// delete: handles delete.
router.delete("/listings/:id/image", authenticate, strictLimiter, deleteListingImage);

export default router;