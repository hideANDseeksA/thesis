// src/utils/crypto.util.ts
import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;
const SECRET = process.env.ENCRYPTION_SECRET as string;

if (!SECRET || SECRET.length < 32) {
  throw new Error("ENCRYPTION_SECRET must be at least 32 characters");
}

const key = crypto.createHash("sha256").update(SECRET).digest();

/* ================= ENCRYPT / DECRYPT ================= */

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
};

export const decrypt = (text: string): string => {
  const [ivHex, encryptedText] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

/* ================= HELPERS ================= */

const isIsoDateString = (value: string): boolean => {
  return !isNaN(Date.parse(value));
};

const normalizeDate = (value: any): string | any => {
  // Date instance
  if (value instanceof Date) {
    return value.toISOString();
  }

  // ISO date string
  if (typeof value === 'string' && isIsoDateString(value)) {
    return new Date(value).toISOString();
  }

  return value;
};
export const safeDecrypt = (value: any): any => {
  // Don't touch numbers, booleans, null, undefined, or Date objects
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined ||
    value instanceof Date
  ) {
    return value;
  }

  // Only strings should be decrypted
  if (typeof value !== 'string') return value;

  // If the string is not encrypted, just return it
  if (!value.includes(':')) return value;

  try {
    return decrypt(value); // Only decrypt, no date parsing
  } catch {
    return value;
  }
};

export const decryptAll = <T>(data: T): T => {
  // Array
  if (Array.isArray(data)) {
    return data.map(decryptAll) as T;
  }

  // Date object → leave untouched
  if (data instanceof Date) {
    return data as T;
  }

  // Object
  if (data !== null && typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      result[key] = decryptAll((data as any)[key]);
    }
    return result;
  }

  // Primitive → safeDecrypt
  return safeDecrypt(data);
};
