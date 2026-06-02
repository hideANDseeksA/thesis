import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { useGoogleLogin } from "@react-oauth/google"

import { signup, googleSignup } from "@/components/auth/authentication.api"
import { showErrorAlert } from "@/utils/swal"
import { useAuth } from "@/auth/AuthContext"
import { setItem } from "@/utils/localStorageHelper"
import { toastSuccess } from "@/utils/toast"
import { handleLoginSuccess } from "@/utils/authHelper"

const steps = [
  {
    number: 1,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    title: "Get Profiled",
    description: "Visit your barangay office and complete your resident profile registration form.",
  },
  {
    number: 2,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
    title: "Register at the Barangay",
    description: "Present a valid ID and have your email address registered by a barangay officer.",
  },
  {
    number: 3,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" />
      </svg>
    ),
    title: "Create Your Account",
    description: "Use your registered email to sign up here and set a secure password.",
  },
  {
    number: 4,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.981V19.5Z" />
      </svg>
    ),
    title: "Verify Your Email",
    description: "Check your inbox for a verification link and confirm your email address.",
  },
  {
    number: 5,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: "Access the Portal",
    description: "You're all set! Log in and enjoy full access to barangay services online.",
  },
]

function RegistrationSteps() {
  return (
 <div className="relative hidden md:flex flex-col justify-between h-full p-8 text-foreground overflow-hidden">
  <div className="relative z-10">
    {/* Header */}
    <div className="mb-8">
      <span className="inline-block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">
        How to get started
      </span>
    </div>

    {/* Steps */}
    <ol className="relative flex flex-col gap-0">
      {steps.map((step, index) => (
        <li key={step.number} className="flex gap-4 group">
          {/* Connector column */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted border border-border text-foreground shrink-0 group-hover:bg-accent transition-colors duration-200">
              {step.icon}
            </div>
            {index < steps.length - 1 && (
              <div className="w-px flex-1 my-1 bg-border" style={{ minHeight: "1.5rem" }} />
            )}
          </div>

          {/* Content */}
          <div className={`pb-5 ${index === steps.length - 1 ? "pb-0" : ""}`}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                Step {step.number}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground leading-snug">{step.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  </div>
</div>
  )
}

export function SignupForm({ className, ...props }) {
  const navigate = useNavigate()
  const { setAccessToken, setResident_Data, setUser } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const validatePasswords = (pass, confirm) => {
    if (!confirm) {
      setError("")
      return
    }
    setError(pass !== confirm ? "Passwords do not match" : "")
  }

  const handlePasswordChange = (e) => {
    const value = e.target.value
    setPassword(value)
    validatePasswords(value, confirmPassword)
  }

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value
    setConfirmPassword(value)
    validatePasswords(password, value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      setLoading(true)
      setError("")
      await signup(email, password, confirmPassword)

      toastSuccess("Account Created", "Account created successfully! Please check your email to verify your account.")
      navigate("/login")
    } catch (error) {
      await showErrorAlert(
        error.response?.data?.error || "Signup failed. Please try again.",
        "Signup Error"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setGoogleLoading(true)
        setError("")
        const response = await googleSignup(tokenResponse.access_token)
        const { accessToken } = response

        if (!accessToken) {
          throw new Error("Invalid Google signup response")
        }

        handleLoginSuccess({
          accessToken,
          setAccessToken,
          setUser,
          setResident_Data,
          setItem,
          navigate,
        })
      } catch (error) {
        await showErrorAlert(
          error.response?.data?.error || "Google signup failed. Please try again.",
          "Google Signup Error"
        )
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: async () => {
      await showErrorAlert(
        "Google signup was cancelled or failed.",
        "Google Signup Error"
      )
    },
  })

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Left: Signup Form */}
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Enter your email below to create your account
                </p>
              </div>

              {error && (
                <div className="text-sm text-red-500 text-center">{error}</div>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <FieldDescription>
                  We&apos;ll use this to contact you. We will not share your
                  email with anyone else.
                </FieldDescription>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirm-password">
                    Confirm Password
                  </FieldLabel>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    required
                  />
                </Field>
              </div>

              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>

              <Field>
                <Button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    !email ||
                    !password ||
                    !confirmPassword ||
                    password !== confirmPassword ||
                    loading
                  }
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>

              <Field className="grid gap-4">
             <Button
  variant="outline"
  type="button"
  onClick={() => handleGoogleSignup()}
  disabled={googleLoading}
  className="w-full flex items-center justify-center gap-2 border border-gray-300 font-medium transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
  <span>{googleLoading ? "Signing up..." : "Sign up with Google"}</span>
</Button>
              </Field>

              <FieldDescription className="text-center">
                Already have an account? <Link to="/login">Sign in</Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          {/* Right: Registration Steps */}
          <RegistrationSteps />
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
} 