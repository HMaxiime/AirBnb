import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import jwt from "jsonwebtoken";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import crypto from "crypto";
import { sendEmail } from "../config/email.js";
import { welcomeEmail, passwordResetEmail } from "../templates/emails.js";
import { createUserSchema, loginSchema, changePasswordSchema } from "../validators/users.validators.js";
import { success } from "zod";

// Registration flow: validate input, hash the password, create the user, and send a welcome email.
export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = createUserSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Email or username already in use" });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        username: data.username,
        password: hashedPassword,
        role: data.role,
        ...(data.phone && { phone: data.phone }),
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);

    sendEmail(data.email, "Welcome to Airbnb!", welcomeEmail(data.name)).catch(() => {});
  } catch (error) {
    next(error);
  }
}

// Login flow: verify credentials and issue a signed JWT for protected routes.
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(data.password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.banned) {
      return res.status(403).json({ error: "Your account has been banned. Please contact support." });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    const { password: _, ...userWithoutPassword } = user;

    res
      .status(200)
      .json({ message: "Login successful", token, user: userWithoutPassword });
  } catch (error) {
    next(error);
  }
}

// Return the authenticated user's profile using the userId attached by the auth middleware.
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

// Change-password flow: confirm the current password, then store a new hash.
export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = changePasswordSchema.parse(req.body);

    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
}

// Forgot-password flow: create a temporary reset token without revealing whether the email exists.
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Always return the same response — don't reveal if the email is registered
    const successResponse = {
      message: "If that email is registered, a reset link has been sent",
    };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json(successResponse);

    // Generate a raw random token — this goes in the email link
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Hash before storing — if DB is compromised, raw tokens are not exposed
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000 * 24 * 7), // 1 week
      },
    });

    const resetLink = `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/reset-password/${rawToken}`;
    sendEmail(user.email, "Reset your password", passwordResetEmail(user.name, resetLink)).catch(() => {});

    res.json(successResponse);
  } catch (error) {
    next(error);
  }
}

// Reset-password flow: verify the token, replace the password, and clear the reset state.
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    if (typeof token !== "string") {
      return res.status(400).json({ error: "Invalid reset token" });
    }

    // Hash the raw token from the URL to compare against the stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() }, // token must not be expired
      },
    });

    // Same error for both invalid token and expired token — don't reveal which
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null, // clear token after use — one-time use only
        resetTokenExpiry: null,
      },
    });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
}
