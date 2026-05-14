import type { Request, Response ,NextFunction } from "express";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import {createUserSchema, updateUserSchema } from "../validators/users.validators.js";  

// Helper to parse and validate integer ID from request params
function parseUserId(idParam: string): string | null {
  const id = idParam ;
  return !id ? null : id;
}

// List users with simple pagination so large tables stay readable.
export async function getAllUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query["page"] as string) || 1;
    const limit = parseInt(req.query["limit"] as string) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({ skip, take: limit, select: { id: true, name: true, email: true, username: true, role: true, createdAt: true } }),
      prisma.user.count(),
    ]);

    res.json({
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /users/:id — return a single user, or 404
// Fetch one user by id and return a friendly 404 when the record is missing.
export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;

    if (id === null) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, username: true, role: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

// POST /users — create a new user, or 400 if fields are missing
// Create a new user by validating input, hashing the password, and hiding the hash in the response.
export async function createUser(req: Request, res: Response, next: NextFunction) {
  
  try {
    const data = createUserSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        username: data.username,
        password: hashedPassword,
        role: data.role,
        ...(data.phone && { phone: data.phone }),
      },
      select: { id: true, name: true, email: true, username: true, role: true, createdAt: true },
    });
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
}

// PUT /users/:id — update an existing user, or 404 if not found
// Update a user after parsing the id and removing undefined fields from the payload.
export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;

    if (id === null) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const parsedData = updateUserSchema.parse(req.body);
    const data: Prisma.UserUpdateInput = Object.fromEntries(
      Object.entries(parsedData).filter(([, value]) => value !== undefined)
    ) as Prisma.UserUpdateInput;

    // Ensure we don't pass empty update data
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, username: true, role: true, updatedAt: true },
    });
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
}

// DELETE /users/:id — remove a user, or 404 if not found
// Delete a user only after confirming the record exists.
export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;

    if (id === null) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.user.delete({ where: { id } });
    res.status(204).send(); // 204 No Content
  } catch (error) {
    next(error);
  }
}
