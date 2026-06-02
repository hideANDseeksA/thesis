import ModernNavbar from "@/components/Navbar"
import { LoginForm } from "@/components/auth/loginform"
import Footer from "@/components/Footer"

export default function LoginPage() {
  return (
    <>
      {/* Navbar */}
      <ModernNavbar />

      {/* Page Content */}
      <div className="bg-btn-primary flex min-h-[calc(100svh-8vh)] flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-4xl">
          <LoginForm />
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </>
  )
}
