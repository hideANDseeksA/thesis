import { SignupForm } from "@/components/auth/signupform"
import ModernNavbar from "@/components/Navbar"
export default function SignupPage() {
  return (
    <>
      <ModernNavbar />
    <div className="bg-btn-primary flex min-h-[calc(100svh-8vh)] flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-4xl">
          <SignupForm />
        </div>
      </div>
      </>
  )
}
