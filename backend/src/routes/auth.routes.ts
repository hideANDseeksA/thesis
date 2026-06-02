import express from "express";
import { login,googleLogin,signup,verifyEmail,resendVerificationEmail,forgotPassword,resetPassword,googleSignup,sendVerificationEmail  } from "../controllers/auth.controller";
import { refreshAccessToken } from "../middleware/auth.middleware";
import { verifyApiKey } from "../middleware/apiKey.middleware";
import { createRateLimiter } from "../middleware/rate-limit";

const router = express.Router();

const authRateLimiter = createRateLimiter(15, 10); // 15 minutes, max 10 requests

router.use(verifyApiKey);

router.post("/login", authRateLimiter, login);

router.post("/google-login", authRateLimiter, googleLogin);

router.post("/signup", authRateLimiter, signup);

router.post("/google-signup", authRateLimiter, googleSignup);

router.post("/verify-email", authRateLimiter, verifyEmail);

router.post("/forgot-password", authRateLimiter, forgotPassword);

router.post("/reset-password", authRateLimiter, resetPassword);

router.post("/send-verification", authRateLimiter, sendVerificationEmail);


router.post("/resend-verification-email", authRateLimiter, resendVerificationEmail);

router.post("/refresh", refreshAccessToken);

router.post("/logout", (req, res) => {
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: true, // true in production
    sameSite: "none", // must match cookie sameSite
    path: "/api", // must match cookie path
  });
  res.status(200).json({ message: "Logged out successfully" }   );
});

export default router;
