import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { verifyEmail, resendVerificationEmail } from "@/components/auth/authentication.api";
import { showErrorAlert, showSuccessAlert } from "@/utils/swal";

const RESEND_COOLDOWN = 60;
const STORAGE_KEY = "verify_email_resend_timestamp";

export function VerifyEmailForm({ className, ...props }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const savedTimestamp = localStorage.getItem(STORAGE_KEY);
    if (savedTimestamp) {
      const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000);
      const remaining = RESEND_COOLDOWN - elapsed;
      if (remaining > 0) setCountdown(remaining);
    }
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    setLoading(true);
    try {
      await verifyEmail(token);
      await showSuccessAlert("Your email has been verified!", "Verified");
      navigate("/login");
    } catch (error) {
      await showErrorAlert(
        error.response?.data?.error || "Verification failed. Please try again.",
        "Verification Error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail(token);
      await showSuccessAlert("A new verification email has been sent.", "Email Sent");
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      setCountdown(RESEND_COOLDOWN);
    } catch (error) {
      await showErrorAlert(
        error.response?.data?.error || "Failed to resend email. Please try again.",
        "Resend Error"
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">

          {/* LEFT PANEL */}
          <div className="flex flex-col p-8 md:p-10">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-14">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold shrink-0">
                <image src="image/image.png" alt="Logo" className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold tracking-tight text-foreground">
                SmartBarangay
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center flex-1 gap-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-2.5">
                Verify your email
              </h1>

              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                An activation link has been sent to your email address
                {user?.email && (
                  <>
                    :{" "}
                    <span className="font-semibold text-foreground">
                      {user.email}
                    </span>
                  </>
                )}
                . Please check your inbox and click on the link to complete the
                activation process.
              </p>

              {/* Verify Button */}
              <Button
                type="button"
                className="w-full text-background btn-primary font-semibold h-11 rounded-lg mb-4"
                onClick={handleVerify}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Now"}
              </Button>

              {/* Resend row */}
              <p className="text-sm text-muted-foreground">
                Didn't get the email?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || countdown > 0}
                  className={cn(
                    "font-semibold text-foreground underline-offset-2 hover:underline bg-transparent border-none p-0 cursor-pointer",
                    (resending || countdown > 0) && "text-muted-foreground cursor-not-allowed no-underline"
                  )}
                >
                  {resending
                    ? "Sending..."
                    : countdown > 0
                    ? `Resend (${countdown}s)`
                    : "Resend"}
                </button>
              </p>
            </div>
          </div>

          {/* RIGHT PANEL — dark dashboard screenshot */}
          {/* RIGHT PANEL — steps */}
<div className="relative hidden md:flex flex-col justify-center bg-muted/40 px-8 py-10 gap-0 border-l border-border">
  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-6">
    What to expect
  </p>

  {/* Step 1 */}
  <div className="flex gap-3 items-start">
    <div className="flex flex-col items-center shrink-0">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800">
        1
      </div>
      <div className="w-px flex-1 bg-border mt-1 min-h-[36px]" />
    </div>
    <div className="pt-0.5 pb-2">
      <p className="text-sm font-semibold text-foreground mb-0.5">Check your inbox</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Look for an email from SmartBarangay with a verification link.
      </p>
    </div>
  </div>

  {/* Step 2 */}
  <div className="flex gap-3 items-start">
    <div className="flex flex-col items-center shrink-0">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800">
        2
      </div>
      <div className="w-px flex-1 bg-border mt-1 min-h-[36px]" />
    </div>
    <div className="pt-0.5 pb-2">
      <p className="text-sm font-semibold text-foreground mb-0.5">Click the link</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Open the email and click the activation link to confirm your address.
      </p>
    </div>
  </div>

  {/* Step 3 */}
  <div className="flex gap-3 items-start">
    <div className="flex flex-col items-center shrink-0">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800">
        3
      </div>
    </div>
    <div className="pt-0.5">
      <p className="text-sm font-semibold text-foreground mb-0.5">You're all set</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Once verified, you'll be redirected to login and can access your account.
      </p>
    </div>
  </div>

  {/* Spam note */}
  <div className="mt-8 rounded-lg border border-border bg-background p-3">
    <p className="text-xs text-muted-foreground leading-relaxed">
      📬 Can't find the email? Check your{" "}
      <span className="font-semibold text-foreground">spam or junk</span> folder
      — it may have been filtered.
    </p>
  </div>
</div>

        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <a href="terms-conditions" className="underline underline-offset-2 hover:text-foreground">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </a>
        .
      </FieldDescription>
    </div>
  );
}