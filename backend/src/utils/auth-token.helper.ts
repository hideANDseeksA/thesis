import jwt from "jsonwebtoken";

type VerifyEmailPayload = {
  userId: string;
  purpose: "verify_email";
};

type ResetPasswordPayload = {
  userId: string;
  purpose: "reset_password";
};

const VERIFY_SECRET = process.env.EMAIL_VERIFY_SECRET!;
const RESET_SECRET = process.env.RESET_PASSWORD_SECRET!;

export const signVerifyEmailToken = (payload: VerifyEmailPayload) => {
  return jwt.sign(payload, VERIFY_SECRET, { expiresIn: "30m" });
};

export const verifyVerifyEmailToken = (token: string) => {
  return jwt.verify(token, VERIFY_SECRET) as VerifyEmailPayload;
};

export const signResetPasswordToken = (payload: ResetPasswordPayload) => {
  return jwt.sign(payload, RESET_SECRET, { expiresIn: "15m" });
};

export const verifyResetPasswordToken = (token: string) => {
  return jwt.verify(token, RESET_SECRET) as ResetPasswordPayload & {
    iat: number;
    exp: number;
  };
};