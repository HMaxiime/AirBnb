// src/middlewares/rateLimiter.ts
import rateLimit from "express-rate-limit";
 
// General limiter for most of the API so simple abuse gets slowed down early.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again in 15 minutes.",
  },
});
 
// Stricter limiter for write-heavy endpoints like auth, uploads, and create/update flows.
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many write requests. Please slow down and try again later.",
  },
});
 