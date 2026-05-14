import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not defined");
}

const JWT_SECRET_VALUE: string = JWT_SECRET;

// Extend Request to carry userId and role after authentication
export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
}

// ─── authenticate ─────────────────────────────────────────────────────────────
// Verifies the JWT token from the Authorization header.
// Attaches userId and role to the request for downstream handlers.
// Returns 401 if token is missing, invalid, or expired.

// Read and verify the bearer token, then attach the decoded claims to the request.
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers["authorization"];

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_VALUE) as {
      userId: string;
      role: string;
    };
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ─── requireHost ──────────────────────────────────────────────────────────────
// Must run after authenticate.
// Returns 403 if the user's role is not HOST.

// Guard host-only endpoints after authentication has already succeeded.
export function requireHost(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (req.role !== "HOST") {
    return res
      .status(403)
      .json({ error: "Only hosts can perform this action" });
  }
  next();
}

// ─── requireGuest ─────────────────────────────────────────────────────────────
// Must run after authenticate.
// Returns 403 if the user's role is not GUEST.

// Guard guest-only endpoints after authentication has already succeeded.
export function requireGuest(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (req.role !== "GUEST") {
    return res
      .status(403)
      .json({ error: "Only guests can perform this action" });
  }
  next();
}
