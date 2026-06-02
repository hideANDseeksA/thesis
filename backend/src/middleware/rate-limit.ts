// middleware/rate-limit.ts

import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { createHash, randomBytes } from "crypto";

/**
 * Generates a stable device fingerprint from request headers.
 * Falls back to a random ID set in a cookie if headers are too generic.
 */
const getDeviceFingerprint = (req: Request, res: Response): string => {
  // 1. Try to build a fingerprint from stable browser/device headers
  const components = [
    req.headers["user-agent"] || "",
    req.headers["accept-language"] || "",
    req.headers["accept-encoding"] || "",
    req.headers["accept"] || "",
    req.headers["sec-ch-ua"] || "",             // browser brand
    req.headers["sec-ch-ua-platform"] || "",    // OS
    req.headers["sec-ch-ua-mobile"] || "",      // mobile flag
  ].join("|");

  const headerFingerprint = createHash("sha256")
    .update(components)
    .digest("hex")
    .slice(0, 32);

  // 2. Read or assign a persistent device cookie
  let deviceId = req.cookies?.["__device_id"];

  if (!deviceId) {
    deviceId = randomBytes(16).toString("hex");

    res.cookie("__device_id", deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
    });
  }

  // 3. Combine both — cookie alone is clearable, headers alone are spoofable
  return createHash("sha256")
    .update(`${deviceId}:${headerFingerprint}`)
    .digest("hex");
};

/**
 * Reusable rate limiter factory — keyed per device, not per IP
 */
export const createRateLimiter = (
  windowMinutes: number,
  maxRequests: number
) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,

    standardHeaders: true,
    legacyHeaders: false,

    // express-rate-limit passes res as second arg to keyGenerator
    keyGenerator: (req: Request, res: Response) =>
      getDeviceFingerprint(req, res),

    handler: (_req, res) => {
      res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
    },

    skip: (req) => {
      // Whitelist health checks or internal services
      return req.path === "/health";
    },
  });
};