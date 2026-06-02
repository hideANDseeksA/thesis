import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState } from "react";
import { setItem } from "@/utils/localStorageHelper";
import { useAuth } from "../../auth/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import { handleLoginSuccess } from "@/utils/authHelper";
import { login, googleLogin } from "@/components/auth/authentication.api";
import { toastError } from "@/utils/toast";
import { Eye, EyeOff } from "lucide-react";

export function LoginForm({ className, ...props }) {

  const navigate = useNavigate();
  const { setAccessToken, setResident_Data, setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(email, password);
      const accessToken = response.accessToken;
      if (!accessToken) {
        throw new Error("Invalid login response");
      }

      handleLoginSuccess({
        accessToken,
        setAccessToken,
        setUser,
        setResident_Data,
        setItem,
        navigate,
      });
    } catch (error) {
      const statusCode = error.response?.status;

      toastError(
        error.response?.data?.error, "Login failed. Please try again."
      );


    } finally {
      setLoading(false);
    }
  };

  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);

        const response = await googleLogin(tokenResponse.access_token);

        const { accessToken } = response;

        if (!accessToken) throw new Error("Invalid login response");

        handleLoginSuccess({
          accessToken,
          setAccessToken,
          setUser,
          setResident_Data,
          setItem,
          navigate,
        });

      } catch (error) {
        toastError(
          error.response?.data?.error, "Login failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      alert("Google login failed");
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>

              {/* Heading */}
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your account
                </p>
              </div>

              {/* Email field */}
              <Field>
                <FieldLabel htmlFor="email" className="font-semibold text-foreground">
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  type="text"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              {/* Password field */}
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password" className="font-semibold text-foreground">
                    Password
                  </FieldLabel>
                  <a
                    href="forgot-password"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </Field>

              {/* Submit */}
              <Field>
                <Button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>

              {/* Google */}
              <Field className="grid gap-4">
                <button
                  type="button"
                  onClick={() => googleLoginHandler()}
                  className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                  Sign in with Google
                </button>
              </Field>

         <FieldDescription className="text-center">
  Don&apos;t have an account?{" "}
  <Link to="/signup" className="font-bold">
    Create an account
  </Link>
</FieldDescription>

            </FieldGroup>
          </form>

          {/* Side image */}
     <div className="relative hidden md:block overflow-hidden">
  {/* Background Image */}
  <img
    src="https://joeam.com/wp-content/uploads/2016/05/barangay_hall_of_san_miguel_lubao_pampanga-zamboanga-dot-com.jpg?w=800&h=600&fit=crop"
    alt="Barangay Community"
    className="absolute inset-0 h-full w-full object-cover"
  />

  {/* Dark Gradient Overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-emerald-900/30"></div>

  {/* Content */}
  <div className="absolute bottom-0 left-0 z-10 p-10 text-white">

    <h1 className="text-2xl font-bold leading-tight">
      Your community, <br />
      at your fingertips
    </h1>

    <p className="mt-4 text-sm text-gray-200 max-w-md leading-relaxed">
      Access services, documents, and announcements from your
      barangay — all in one place.
    </p>
  </div>
</div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="terms-conditions">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
