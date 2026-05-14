// booking.routes.ts: handles routes functionality.
import express, { type RequestHandler } from "express";
import {
  createBooking,
  deleteBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  changeBookingStatus,
} from "../../controllers/booking.controller.js";
import { authenticate, requireGuest, requireHost } from "../../middlewares/auth.middleware.js";
import { strictLimiter } from "../../middlewares/rateLimiter.js";

const router = express.Router();

// OpenAPI docs for the booking endpoints below.
// These blocks describe what each route does and which responses clients should expect.
/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Retrieve a list of all bookings for the authenticated guest
 *     description: Retrieve a list of all bookings for the authenticated guest. Requires authentication.
 *     tags: [Bookings]
 *     security:
 *      - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of bookings for the authenticated guest
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Retrieve a single booking by ID for the authenticated guest
 *     description: Retrieve a single booking by its ID for the authenticated guest. Requires authentication.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The booking ID
 *     responses:
 *       200:
 *         description: The requested booking
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking for the authenticated guest
 *     description: Create a new booking for the authenticated guest. Requires authentication.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingInput'
 *           example:
 *             listingId: 1
 *             checkIn: '2026-06-01T00:00:00Z'
 *             checkOut: '2026-06-05T00:00:00Z'
 *             totalPrice: 500
 *     responses:
 *       201:
 *         description: The created booking
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

// Guests can only see their own booking list.
// Middleware order: authenticate first, then role check, then controller.
// get: handles get.
router.get("/", authenticate as RequestHandler, getAllBookings);

// Guests can fetch one booking by id, with the same auth/role protection.
// get: handles get.
router.get("/:id", authenticate as RequestHandler, requireGuest as RequestHandler, getBookingById);

// Guests create bookings here, and the strict limiter slows repeated write attempts.
// post: handles post.
router.post("/", authenticate as RequestHandler, requireGuest as RequestHandler, strictLimiter, createBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   put:
 *     summary: Update an existing booking (change dates, guest count, etc.)
 *     description: Update booking details such as check-in/check-out dates. Requires guest role.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The booking ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingInput'
 *           example:
 *             checkIn: '2026-06-01T00:00:00Z'
 *             checkOut: '2026-06-05T00:00:00Z'
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request (invalid dates or format)
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 *       403:
 *         description: Forbidden - user must be a guest
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Cancel/delete a booking
 *     description: Cancel and delete a booking. Requires guest role.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The booking ID to cancel
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 *       403:
 *         description: Forbidden - user must be a guest
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /bookings/approve/{id}:
 *   put:
 *     summary: Approve or reject a booking (host action)
 *     description: Host approves or rejects a pending booking. Requires host role.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The booking ID to approve/reject
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CANCELLED]
 *             required: [status]
 *           example:
 *             status: CONFIRMED
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request (invalid status)
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 *       403:
 *         description: Forbidden - user must be a host
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Internal server error
 */

// /approve/:id must be registered before /:id so Express does not swallow it as a dynamic segment.
// put: handles put.
router.put("/approve/:id", authenticate as RequestHandler, requireHost as RequestHandler, strictLimiter, changeBookingStatus);

// This endpoint updates booking details such as dates or other editable fields.
// put: handles put.
router.put("/:id", authenticate as RequestHandler, requireGuest as RequestHandler, strictLimiter, updateBooking);

// This endpoint removes a booking; it is still limited and protected for guests.
// delete: handles delete.
router.delete("/:id", authenticate as RequestHandler, requireGuest as RequestHandler, strictLimiter, deleteBooking);

export default router;