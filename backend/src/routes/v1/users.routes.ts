// users.routes.ts: handles routes functionality.
import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { strictLimiter } from "../../middlewares/rateLimiter.js";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../../controllers/users.controller.js";

const router = Router();

// Comprehensive user management endpoints: retrieve, create, update, and delete users.
// All endpoints require authentication and are rate-limited to prevent abuse.
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve a list of all users (admin only)
 *     description: Retrieve a list of all users. Requires authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users with their profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Retrieve a specific user by ID
 *     description: Retrieve a user's profile by their ID. Requires authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: The requested user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user account. Requires authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *           example:
 *             name: John Doe
 *             email: john@example.com
 *             password: SecurePass123
 *             role: guest
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request (missing fields, invalid email format, or email already in use)
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 *       409:
 *         description: Conflict - email already registered
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user's profile
 *     description: Update an existing user's information. Requires authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *           example:
 *             name: John Updated
 *             role: host
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Bad request (invalid data format)
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 *       404:
 *         description: User not found
 *       409:
 *         description: Conflict - email already in use
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user account
 *     description: Delete a user and all associated data. Requires authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized - missing or invalid authentication token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

// get: handles get.
router.get("/", authenticate, strictLimiter, getAllUsers);
// get: handles get.
router.get("/:id", authenticate, strictLimiter, getUserById);
// post: handles post.
router.post("/", authenticate, strictLimiter, createUser);
// put: handles put.
router.put("/:id", authenticate, strictLimiter, updateUser);
// delete: handles delete.
router.delete("/:id", authenticate, strictLimiter, deleteUser);

export default router;