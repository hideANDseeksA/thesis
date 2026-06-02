import nodemailer from "nodemailer";
import dotenv from "dotenv";

// ✅ Auto-load .env only if not already loaded
if (!process.env.SMTP_EMAIL) {
  dotenv.config();
}

type SendMailParams = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

// ✅ Read env safely
const {
  SMTP_EMAIL,
  SMTP_PASS,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SERVICE,
} = process.env;

// ✅ Validate required fields
if (!SMTP_EMAIL || !SMTP_PASS) {
  throw new Error("❌ SMTP_EMAIL or SMTP_PASS is missing in .env");
}

// ✅ Detect config (Gmail vs Custom SMTP)
const transporter = nodemailer.createTransport(
  SMTP_HOST
    ? {
        // 👉 Custom SMTP (domain email)
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: SMTP_EMAIL,
          pass: SMTP_PASS,
        },
      }
    : {
        // 👉 Default to Gmail
        service: SMTP_SERVICE || "gmail",
        auth: {
          user: SMTP_EMAIL,
          pass: SMTP_PASS,
        },
      }
);

// ✅ Optional: verify connection on start
export const verifyMailConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ SMTP server is ready");
  } catch (error) {
    console.error("❌ SMTP connection failed:", error);
  }
};

export const sendMail = async ({
  to,
  subject,
  text,
  html,
}: SendMailParams): Promise<void> => {
  try {
    await transporter.sendMail({
      from: `"Smart Barangay" <${SMTP_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    throw new Error("Email sending failed");
  }
};