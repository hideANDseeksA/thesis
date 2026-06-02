import jwt, { Secret, SignOptions } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET as Secret

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined")
}

const JWT_EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || "1d"

export const signToken = (
  payload: object,
  options?: SignOptions
): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    ...options,
  })
}

export const verifyToken = <T = any>(token: string): T => {
  return jwt.verify(token, JWT_SECRET) as T
}


export interface JwtPayload {
  id: string;
  role: "resident" | "staff" | "admin" | "healthworker";
}

export const signAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: "15m",
  });

// utils/jwt.util.ts — change only the refresh token signer
export const signRefreshToken = (payload: { id: string }) => {
  return jwt.sign(
    { sub: payload.id },  // ← identity only
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "7d" }
  );
};