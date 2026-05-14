import { z } from "zod";

// User creation requires identity fields plus a password; updates can reuse the same fields optionally.
export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["HOST", "GUEST", "ADMIN"]).default("GUEST"),
});

export const updateUserSchema = createUserSchema.partial();

// Auth validators
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
}).refine(
  (data) => data.currentPassword !== data.newPassword,
  { message: "New password must be different from current password", path: ["newPassword"] }
);