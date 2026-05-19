import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

// Central error handler: translate validation and database errors into user-friendly HTTP responses.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Zod validation errors — return all field errors at once
  if (err instanceof ZodError) {
    return res.status(400).json({ errors: err.issues });
  }

  // Prisma known errors map common database problems to status codes.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(`Prisma error ${err.code}:`, err.message, err.meta);
    switch (err.code) {
      case "P2002":
        return res
          .status(409)
          .json({ error: `${err.meta?.target} already exists` });
      case "P2025":
        return res.status(404).json({ error: "Record not found" });
      case "P2003":
        return res.status(400).json({ error: "Related record does not exist" });
      default:
        return res.status(500).json({ error: `Database error (${err.code}): ${err.message}` });
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error("Prisma validation error:", err.message);
    return res.status(400).json({ error: err.message });
  }

  console.error(err);
  res.status(500).json({ error: (err as any)?.message ?? "Something went wrong" });
}
