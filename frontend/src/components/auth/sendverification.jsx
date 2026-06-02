import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { showErrorAlert } from "@/utils/swal";
import { sendVerificationEmail } from "@/components/auth/authentication.api";

const RESEND_COOLDOWN = 60;
const STORAGE_KEY = "verify_email_resend_timestamp";

export function SendVerificationForm({ className, ...props }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const email = location.state?.email ?? user?.email ?? "";

  const [sending, setSending] = useState(true);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);   // ← track initial failure
  const [countdown, setCountdown] = useState(0);

  const startCooldown = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setCountdown(RESEND_COOLDOWN);
  };

  // Restore countdown on refresh (only matters if previous send succeeded)
  useEffect(() => {
    const savedTimestamp = localStorage.getItem(STORAGE_KEY);
    if (savedTimestamp) {
      const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000);
      const remaining = RESEND_COOLDOWN - elapsed;
      if (remaining > 0) setCountdown(remaining);
    }
  }, []);

  // Countdown tick
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

  // Send once on mount
  useEffect(() => {
    const sendOnMount = async () => {
      try {
        await sendVerificationEmail(email);
        setSent(true);
        setFailed(false);
        startCooldown();
      } catch (error) {
        setFailed(true); // ← show resend immediately, no cooldown
        await showErrorAlert(
          error.response?.data?.error || "Failed to send verification email.",
          "Error"
        );
      } finally {
        setSending(false);
      }
    };

    if (email) sendOnMount();
    else setSending(false);
  }, []);

  const handleResend = async () => {
    setSending(true);
    setFailed(false);
    try {
      await sendVerificationEmail(email);
      setSent(true);
      startCooldown();
    } catch (error) {
      setFailed(true); // ← stay available to retry again
      await showErrorAlert(
        error.response?.data?.error || "Failed to resend email. Please try again.",
        "Resend Error"
      );
    } finally {
      setSending(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login", {
      state: { message: "A verification link has been sent to your email." },
    });
  };

  // Resend is available if: not currently sending AND (failed OR countdown expired)
  const canResend = !sending && (failed || countdown <= 0);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">

          {/* LEFT PANEL */}
          <div className="flex flex-col p-8 md:p-10">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-14">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold shrink-0">
                <image src="/image/image.png" alt="Logo" className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold tracking-tight text-foreground">
                SmartBarangay
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center flex-1 gap-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-2.5">
                Check your email
              </h1>

              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                {sending ? (
                  "Sending verification link..."
                ) : failed ? (
                  <>
                    We couldn't send a verification link to{" "}
                    {email && <span className="font-semibold text-foreground">{email}</span>}
                    . Please try resending.
                  </>
                ) : (
                  <>
                    A verification link has been sent to{" "}
                    {email && <span className="font-semibold text-foreground">{email}</span>}
                    . Click the link in your inbox to activate your account.
                  </>
                )}
              </p>

              {/* Back to Login */}
              <Button
                type="button"
                className="w-full text-background btn-primary font-semibold h-11 rounded-lg mb-4"
                onClick={handleBackToLogin}
                disabled={sending}
              >
                Back to Login
              </Button>

              {/* Resend */}
              <p className="text-sm text-muted-foreground">
                Didn't get the email?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend}
                  className={cn(
                    "font-semibold text-foreground underline-offset-2 hover:underline bg-transparent border-none p-0 cursor-pointer",
                    !canResend && "text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {sending
                    ? "Sending..."
                    : countdown > 0 && !failed
                    ? `Resend (${countdown}s)`
                    : "Resend"}
                </button>
              </p>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="relative hidden md:block bg-[#0f0f0f] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop"
              alt="Dashboard preview"
              className="absolute inset-0 h-full w-full object-cover opacity-60"
            />
            <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
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