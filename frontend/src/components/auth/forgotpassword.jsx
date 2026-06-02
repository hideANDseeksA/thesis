import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldDescription } from "@/components/ui/field";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { showErrorAlert, showSuccessAlert } from "@/utils/swal";
import { forgotPassword } from "@/components/auth/authentication.api";

export function ForgotPasswordForm({ className, ...props }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      await showErrorAlert("Please enter your email address.", "Missing Email");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
      await showSuccessAlert(
        "A password reset link has been sent to your email.",
        "Email Sent"
      );
    } catch (error) {
      await showErrorAlert(
        error.response?.data?.error || "Failed to send reset link. Please try again.",
        "Error"
      );
    } finally {
      setLoading(false);
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
                <img src="/image/image.png" alt="Logo" className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold tracking-tight text-foreground">
                SmartBarangay
              </span>
            </div>

            {!submitted ? (
              /* ── FORM STATE ── */
              <div className="flex flex-col justify-center flex-1 gap-0">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-1">
                  Forgot your password?
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  No worries. Enter your email address and we'll send you a link
                  to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="h-11 rounded-lg"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-background btn-primary font-semibold h-11 rounded-lg"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>

                <p className="text-sm text-muted-foreground mt-6">
                  Remember your password?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="font-semibold text-foreground underline-offset-2 hover:underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    Back to login
                  </button>
                </p>
              </div>
            ) : (
              /* ── SUCCESS STATE ── */
              <div className="flex flex-col justify-center flex-1 gap-0">
                {/* Check icon */}
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-6">
                  <svg
                    className="w-7 h-7 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-2.5">
                  Check your inbox
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  We've sent a password reset link to{" "}
                  <span className="font-semibold text-foreground">{email}</span>.
                  If it doesn't appear within a few minutes, check your spam folder.
                </p>

                <Button
                  type="button"
                  className="w-full text-background btn-primary font-semibold h-11 rounded-lg mb-4"
                  onClick={() => navigate("/login")}
                >
                  Back to Login
                </Button>

                <p className="text-sm text-muted-foreground">
                  Wrong email?{" "}
                  <button
                    type="button"
                    onClick={() => { setSubmitted(false); setEmail(""); }}
                    className="font-semibold text-foreground underline-offset-2 hover:underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    Try again
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* RIGHT PANEL — dark side image */}
       {/* RIGHT PANEL — steps */}
<div className="relative hidden md:flex flex-col justify-center bg-muted/40 px-8 py-10 gap-0 border-l border-border">
  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-6">
    How it works
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
      <p className="text-sm font-semibold text-foreground mb-0.5">Enter your email</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Provide the address linked to your account.
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
      <p className="text-sm font-semibold text-foreground mb-0.5">Check your inbox</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        We'll send a secure reset link to your email.
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
      <p className="text-sm font-semibold text-foreground mb-0.5">Reset your password</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Click the link and choose a new password.
      </p>
    </div>
  </div>

  {/* Expiry note */}
  <div className="mt-8 rounded-lg border border-border bg-background p-3">
    <p className="text-xs text-muted-foreground leading-relaxed">
      🔒 The reset link expires in{" "}
      <span className="font-semibold text-foreground">15 minutes</span> for
      your security.
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
