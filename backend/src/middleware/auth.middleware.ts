// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma";
import { decryptAll } from "../utils/crypto.util";
import { signAccessToken } from "../utils/jwt.util";

type Role = "admin" | "staff" | "resident" | "healthworker";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as AuthRequest["user"];
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

interface RefreshPayload {
  sub?: string;
  id?: string;   // legacy shim — remove after 7 days
  iat: number;
  exp: number;
}

export const refreshAccessToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token missing" });
  }

  let payload: RefreshPayload;

  try {
    payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as RefreshPayload;
  } catch (err) {
    res.clearCookie("refresh_token");
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }

  // ✅ Shim: handles old full-payload tokens and new sub-only tokens
  const userId = payload.sub ?? payload.id;

  if (!userId) {
    res.clearCookie("refresh_token");
    return res.status(401).json({ error: "Malformed token payload" });
  }

  try {
    // ✅ Always reload from DB — catches deleted users, role changes, unverified
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        verified: true,
        resident_id: true,
        resident: {
          select: {
            f_name: true,
            l_name: true,
            email_address: true,
            sex: true,
          },
        },
      },
    });

    if (!user) {
      res.clearCookie("refresh_token");
      return res.status(401).json({ error: "User no longer exists" });
    }

    if (!user.verified) {
      res.clearCookie("refresh_token");
      return res.status(403).json({ error: "Account is not verified" });
    }

    // ✅ Rebuild the full payload from live DB data
const freshPayload = {
  id: user.id,
  role: user.role,
  resident_id: user.resident_id,
  data: {
    resident_name: `${decryptAll(user.resident.f_name)} ${decryptAll(user.resident.l_name)}`,
    resident_email: decryptAll(user.resident.email_address), // if encrypted
    resident_sex: user.resident.sex,
  },
};
    const newAccessToken = signAccessToken(freshPayload);

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("Token refresh error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};  