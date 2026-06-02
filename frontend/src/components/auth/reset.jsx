import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldDescription } from "@/components/ui/field";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { showErrorAlert, showSuccessAlert } from "@/utils/swal";
import { resetPassword } from "@/components/auth/authentication.api";
import { Eye, EyeOff } from "lucide-react";

export function ResetPasswordForm({ className, ...props }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    if (!password || !confirmPassword) {
      showErrorAlert("Please fill in all fields.", "Missing Fields");
      return false;
    }
    if (password.length < 8) {
      showErrorAlert("Password must be at least 8 characters.", "Weak Password");
      return false;
    }
    if (password !== confirmPassword) {
      showErrorAlert("Passwords do not match.", "Mismatch");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await resetPassword( token, password );
      setSubmitted(true);
      await showSuccessAlert(
        "Your password has been reset successfully.",
        "Password Reset"
      );
    } catch (error) {
      await showErrorAlert(
        error.response?.data?.error || "Failed to reset password. Please try again.",
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
                  Reset your password
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  Choose a strong new password. It must be at least 8 characters
                  and match the confirmation below.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                  {/* New Password */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="h-11 rounded-lg pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Password strength indicator */}
                    {password.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-colors",
                              password.length >= 8 && i < 2 ? "bg-yellow-400" : "",
                              password.length >= 10 && i < 3 ? "bg-orange-400" : "",
                              password.length >= 12 &&
                              /[A-Z]/.test(password) &&
                              /[0-9]/.test(password) &&
                              /[^A-Za-z0-9]/.test(password)
                                ? "bg-green-500"
                                : "",
                              i === 0 && password.length >= 1 ? "bg-red-400" : "bg-muted"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        className={cn(
                          "h-11 rounded-lg pr-10",
                          confirmPassword.length > 0 &&
                            confirmPassword !== password &&
                            "border-red-400 focus-visible:ring-red-400"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Inline mismatch hint */}
                    {confirmPassword.length > 0 && confirmPassword !== password && (
                      <p className="text-xs text-red-500 mt-0.5">
                        Passwords do not match.
                      </p>
                    )}

                    {/* Match confirmation */}
                    {confirmPassword.length > 0 && confirmPassword === password && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Passwords match ✓
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-background btn-primary font-semibold h-11 rounded-lg mt-1"
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
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
                  Password reset!
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  Your password has been reset successfully. You can now log in
                  with your new password.
                </p>

                <Button
                  type="button"
                  className="w-full text-background btn-primary font-semibold h-11 rounded-lg"
                  onClick={() => navigate("/login")}
                >
                  Go to Login
                </Button>
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="relative hidden md:block bg-[#0f0f0f] overflow-hidden">
            <img
              src="[images.unsplash.com](https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop)"
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
