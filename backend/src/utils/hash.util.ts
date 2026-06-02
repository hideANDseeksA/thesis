import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 12;

/**
 * Hash password using bcrypt (non-deterministic)
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare plain password with hashed password
 */
export const compareHash = async (
  plain: string,
  hashed: string
): Promise<boolean> => {
  return bcrypt.compare(plain, hashed);
};

/**
 * Hash email (deterministic) using SHA256
 * This is safe for storing searchable email hashes
 */
export const hashEmail = (email: string): string => {
  return crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
};



export const hashlastName = (lastName: string): string => {
  return crypto.createHash("sha256").update(lastName.toLowerCase().trim()).digest("hex");
}



export const hashString = (input: string): string => {
  const normalized = input
    .toLowerCase()
    .replace(/\s+/g, "") // remove ALL whitespace
    .trim();

  return crypto.createHash("sha256").update(normalized).digest("hex");
};