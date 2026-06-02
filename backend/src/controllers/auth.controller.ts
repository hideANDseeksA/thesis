import { Request, Response } from "express";
import prisma from "../prisma";
import bcrypt from "bcryptjs";
import axios from "axios";
import jwt from "jsonwebtoken";

import { signAccessToken, signRefreshToken } from "../utils/jwt.util";
import { hashEmail } from "../utils/hash.util";
import { decryptAll } from "../utils/crypto.util";
import { emailSchema } from "../validators/email.validator";
import { sendMail } from "../helper/mail.helper";

const VERIFY_SECRET = process.env.JWT_VERIFY_SECRET!;
const RESET_SECRET = process.env.JWT_RESET_SECRET!;
const FRONTEND_URL = process.env.FRONTEND_URL!;

// ✅ add it here — at module level, not inside any function
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  path: "/api",
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

const signVerifyToken = (payload: object) => {
  return jwt.sign(payload, VERIFY_SECRET, { expiresIn: "1d" });
};

const verifyVerifyToken = (token: string) => {
  return jwt.verify(token, VERIFY_SECRET) as { email: string };
};

const signResetToken = (payload: object) => {
  return jwt.sign(payload, RESET_SECRET, { expiresIn: "15m" });
};

const verifyResetToken = (token: string) => {
  return jwt.verify(token, RESET_SECRET) as { email: string };
};

const verifyEmailTemplate = (url: string) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2>Verify your account</h2>
    <p>Click the button below to verify your account.</p>
    <a href="${url}" style="display:inline-block;padding:10px 18px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;">
      Verify Account
    </a>
    <p style="margin-top:16px;">If you did not create this account, you can ignore this email.</p>
  </div>
`;

const resetPasswordTemplate = (url: string) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2>Reset your password</h2>
    <p>Click the button below to reset your password.</p>
    <a href="${url}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
      Reset Password
    </a>
    <p style="margin-top:16px;">This link will expire in 15 minutes.</p>
  </div>
`;


export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: "Token is required" });
      return;
    }

    const googleResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const payload = googleResponse.data;

    if (!payload?.email) {
      res.status(401).json({ error: "Invalid Google token" });
      return;
    }

    const email = String(payload.email).toLowerCase().trim();
    const hashedEmail = hashEmail(email);

const resident = await prisma.residents.findFirst({
  where: {
    h_email_address: hashedEmail,
  },
});

if (!resident) {
  res.status(403).json({
    success: false,
    error: "Email not registered. Please sign up first.",
  });
  console.log("Google login failed: email not registered -", email);
  return;
}

if (resident.remarks === "archive") {
  res.status(403).json({
    success: false,
    error: "This account has been archived. Please contact the barangay office.",
  });
  console.log("Google login failed: account archived -", email);
  return;
}

    let user = await prisma.user.findUnique({
      where: { resident_id: resident.id },
    });

    // Do NOT create account if user does not exist
    if (!user) {
      res.status(403).json({
        error: "Account not found. Please sign up first.",
      });
      console.log("Google login failed: account not found -", email);
      return;
    }

    // If account exists but not verified, verify it
    if (!user.verified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { verified: true },
      });
    }

    const firstName = decryptAll(resident.f_name);
    const lastName = decryptAll(resident.l_name);

    const jwtPayload = {
      id: user.id,
      role: user.role,
      resident_id: user.resident_id,
      data: {
        resident_name: `${firstName} ${lastName}`,
        resident_email: email,
        resident_sex: resident.sex,
      },
    };

    const accessToken = signAccessToken(jwtPayload);
    const refreshToken = signRefreshToken(jwtPayload);

    res.cookie("refresh_token", refreshToken, cookieOptions);

    res.status(200).json({ accessToken });
    console.log("Google login successful for email:", email);
  } catch (err: any) {
    console.error("Google login failed:", err.response?.data || err.message || err);
    res.status(500).json({ error: "Google login failed" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email_address, password } = req.body;

    if (!email_address || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const email = String(email_address).toLowerCase().trim();
    const hashedEmail = hashEmail(email);

const resident = await prisma.residents.findFirst({
  where: {
    h_email_address: hashedEmail,
  },
});

if (!resident) {
  res.status(403).json({
    success: false,
    error: "Email not registered. Please sign up first.",
  });
  console.log("Login failed: email not registered -", email);
  return;
}

if (resident.remarks === "archive") {
  res.status(403).json({
    success: false,
    error: "This account has been archived. Please contact the barangay office.",
  });
  console.log("Login failed: account archived -", email);
  return;
}
    if (!resident) {
      res.status(401).json({ error: "Invalid credentials" });
      console.log("Login failed: invalid credentials -", email);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { resident_id: resident.id },
    });

    if (!user || !user.password) {
      res.status(401).json({ error: "Invalid credentials" });
      console.log("Login failed: invalid credentials -", email);
      return;
    }

    if (!user.verified) {
      res.status(403).json({ error: "Account not verified. Please verify your email address." });
      console.log("Login failed: account not verified -", email);
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      console.log("Login failed: invalid credentials -", email);
      return;
    }

    const payload = {
      id: user.id,
      role: user.role,
      data: {
        resident_name: `${decryptAll(resident.f_name)} ${decryptAll(resident.l_name)}`,
        resident_email: email,
        resident_sex: resident.sex,
      },
      resident_id: user.resident_id,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.cookie("refresh_token", refreshToken, cookieOptions);

    res.json({ accessToken });
    console.log("Login successful for email:", email);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email_address, password } = req.body;

    console.log("1. signup started");

    const emailValidation = emailSchema.safeParse(email_address);
    if (!emailValidation.success) {
      res.status(400).json({
        error: emailValidation.error.issues[0].message,
      });
      return;
    }

    if (!email_address || !password) {
      res.status(400).json({
        error: "Email and password are required",
      });
      return;
    }

    if (String(password).length < 8) {
      res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
      return;
    }

    const email = String(email_address).toLowerCase().trim();
    const hashedEmail = hashEmail(email);

    console.log("2. checking resident", email);

    const resident = await prisma.residents.findUnique({
      where: { h_email_address: hashedEmail },
    });

    if (!resident) {
      res.status(404).json({
        error: "Email not found. Please contact the barangay to register your email.",
      });
      console.log("Signup failed: email not found -", email);
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { resident_id: resident.id },
    });

    if (existingUser) {
      res.status(409).json({
        error: "Account already exists. Please log in instead.",
      });
      console.log("Signup failed: account already exists -", email);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("3. creating user");

    const user = await prisma.user.create({
      data: {
        resident_id: resident.id,
        password: hashedPassword,
        verified: false,
      },
    });

    console.log("4. user created", user.id);

    const token = signVerifyToken({ email });

    console.log("5. token created");

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    console.log("6. verifyUrl =", verifyUrl);

    await sendMail({
      to: email,
      subject: "Verify your account",
      html: verifyEmailTemplate(verifyUrl),
    });

    console.log("7. email sent");

    res.status(201).json({
      message: "Signup successful. Please check your email to verify your account.",
      user: {
        id: user.id,
        resident_id: user.resident_id,
        verified: user.verified,
      },
    });


    console.log("Signup process completed for email:", email);
  } catch (err) {
    console.error("Signup failed:", err);
    res.status(500).json({
      error: "Signup failed",
    });
  }
};


export const googleSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: "Google token is required" });
      return;
    }

    const googleResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const payload = googleResponse.data;

    if (!payload?.email) {
      res.status(401).json({ error: "Invalid Google token" });
      return;
    }

    const email = String(payload.email).toLowerCase().trim();
    const hashedEmail = hashEmail(email);

    const resident = await prisma.residents.findUnique({
      where: { h_email_address: hashedEmail },
    });

    if (!resident) {
      res.status(404).json({
        error: "Email not found. Please contact the barangay to register your email.",
      });

      console.log("Google signup failed: email not found -", email);
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { resident_id: resident.id },
    });

    if (existingUser) {
      res.status(409).json({
        error: "Account already exists. Please login with Google instead.",
      });
      console.log("Google signup failed: account already exists -", email);
      return;
    }

    const user = await prisma.user.create({
      data: {
        resident_id: resident.id,
        verified: true,
      },
    });

    const firstName = decryptAll(resident.f_name);
    const lastName = decryptAll(resident.l_name);

    const jwtPayload = {
      id: user.id,
      role: user.role,
      resident_id: user.resident_id,
      data: {
        resident_name: `${firstName} ${lastName}`,
        resident_email: email,
        resident_sex: resident.sex,
      },
    };

    const accessToken = signAccessToken(jwtPayload);
    const refreshToken = signRefreshToken(jwtPayload);

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIES === "true",
      sameSite: "none",
      path: "/api",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "Google signup successful",
      accessToken,
      user: {
        id: user.id,
        resident_id: user.resident_id,
        verified: user.verified,
      },
    });
    console.log("Google signup completed for email:", email);
  } catch (err: any) {
    console.error("Google signup failed:", err.response?.data || err.message || err);
    res.status(500).json({ error: "Google signup failed" });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: "Verification token is required" });
      return;
    }

    const decoded = verifyVerifyToken(String(token));
    const email = decoded.email.toLowerCase().trim();
    const hashedEmail = hashEmail(email);

    const resident = await prisma.residents.findUnique({
      where: { h_email_address: hashedEmail },
    });

    if (!resident) {
      res.status(404).json({ error: "Resident not found" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { resident_id: resident.id },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.verified) {
      res.status(200).json({
        message: "Account is already verified",
        email,
      });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { verified: true },
    });

    res.status(200).json({
      message: "Account verified successfully",
      email,
    });
    console.log("Email verification completed for email:", email);
  } catch (err) {
    console.error("Email verification failed:", err);
    res.status(400).json({ error: "Invalid or expired verification token" });
  }
};

// export const resendVerificationEmail = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { email_address } = req.body;

//     const emailValidation = emailSchema.safeParse(email_address);
//     if (!emailValidation.success) {
//       res.status(400).json({
//         error: emailValidation.error.issues[0].message,
//       });
//       return;
//     }

//     const email = String(email_address).toLowerCase().trim();
//     const hashedEmail = hashEmail(email);

//     const resident = await prisma.residents.findUnique({
//       where: { h_email_address: hashedEmail },
//     });

//     if (!resident) {
//       res.status(404).json({
//         error: "Email not found. Please contact the barangay to register your email.",
//       });
//       return;
//     }

//     const user = await prisma.user.findUnique({
//       where: { resident_id: resident.id },
//     });

//     if (!user) {
//       res.status(404).json({
//         error: "No account found for this email. Please sign up first.",
//       });
//       return;
//     }

//     if (user.verified) {
//       res.status(400).json({
//         error: "Account is already verified.",
//       });
//       return;
//     }

//     const token = signVerifyToken({ email });
//     const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

//     await sendMail({
//       to: email,
//       subject: "Verify your account",
//       html: verifyEmailTemplate(verifyUrl),
//     });

//     res.status(200).json({
//       message: "Verification email sent successfully.",
//     });
//   } catch (error) {
//     console.error("Resend verification failed:", error);
//     res.status(500).json({
//       error: "Failed to resend verification email",
//     });
//   }
// };
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email_address } = req.body;

    if (!email_address) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const email = String(email_address).toLowerCase().trim();
    const hashedEmail = hashEmail(email);

    const resident = await prisma.residents.findUnique({
      where: { h_email_address: hashedEmail },
    });

    // ❗ Explicit error if email does not exist
    if (!resident) {
      res.status(404).json({
        error: "Email not found. Please make sure you typed the correct email.",
      });
      console.log("Forgot password failed: email not found -", email);
      return;
    }

    const user = await prisma.user.findFirst({
      where: { resident_id: resident.id },
    });

    if (!user) {
      res.status(404).json({
        error: "Account not found for this email.",
      });
      console.log("Forgot password failed: account not found -", email);
      return;
    }

    const token = signResetToken({
      userId: user.id,
      email,
    });

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;

    await sendMail({
      to: email,
      subject: "Reset your password",
      html: resetPasswordTemplate(resetUrl),
    });

    console.log("Forgot password email sent for email:", email);

    res.status(200).json({
      message: "Password reset link has been sent to your email.",
    });
    console.log("Forgot password process completed for email:", email);

  } catch (error) {
    console.error("Forgot password failed:", error);
    res.status(500).json({ error: "Failed to send reset link" });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ error: "Token and password are required" });
      return;
    }

    if (String(password).length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const decoded = verifyResetToken(String(token));

    if (!decoded?.email) {
      res.status(400).json({ error: "Invalid or expired token" });
      return;
    }

    const email = decoded.email.toLowerCase().trim();
    const hashedEmail = hashEmail(email);

    const resident = await prisma.residents.findUnique({
      where: { h_email_address: hashedEmail },
    });

    if (!resident) {
      res.status(404).json({ error: "Resident not found" });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { resident_id: resident.id },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    res.status(200).json({
      message: "Password reset successful",
    });
    console.log("Password reset completed for email:", email);
  } catch (error) {
    console.error("Reset password failed:", error);
    res.status(400).json({
      error: "Invalid or expired token",
    });
  }
};

export const resendVerificationEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: "Token is required" });
      return;
    }

    // ✅ decode token → get email
    const decoded = verifyVerifyToken(String(token));
    const email = decoded.email.toLowerCase().trim();

    const hashedEmail = hashEmail(email);

    const resident = await prisma.residents.findUnique({
      where: { h_email_address: hashedEmail },
    });

    if (!resident) {
      res.status(404).json({ error: "Resident not found" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { resident_id: resident.id },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.verified) {
      res.status(400).json({
        error: "Account is already verified",
      });
      return;
    }

    // ✅ generate NEW token (fresh expiry)
    const newToken = signVerifyToken({ email });

    const verifyUrl = `${FRONTEND_URL}/verify-email?token=${newToken}`;

    await sendMail({
      to: email,
      subject: "Verify your account",
      html: verifyEmailTemplate(verifyUrl),
    });

    res.status(200).json({
      message: "Verification email resent successfully",
    });
    console.log("Verification email resent for email:", email);
  } catch (error) {
    console.error("Resend verification failed:", error);

    res.status(400).json({
      error: "Invalid or expired token",
    });
  }
};

export const sendVerificationEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const hashedEmail = hashEmail(cleanEmail);

    const resident = await prisma.residents.findUnique({
      where: { h_email_address: hashedEmail },
    });

    if (!resident) {
      res.status(404).json({ error: "Resident not found" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { resident_id: resident.id },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.verified) {
      res.status(400).json({
        error: "Account is already verified",
      });
      return;
    }

    // ✅ Generate verification token
    const token = signVerifyToken({ email: cleanEmail });

    const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

    await sendMail({
      to: cleanEmail,
      subject: "Verify your account",
      html: verifyEmailTemplate(verifyUrl),
    });

    res.status(200).json({
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Send verification failed:", error);

    res.status(500).json({
      error: "Failed to send verification email",
    });
  }
};