import ModernNavbar from "@/components/Navbar"

import Footer from "@/components/Footer"
import { ResetPasswordForm } from "@/components/auth/reset"



export default function ResetPasswordPage() {
  return (
    <>
      {/* Navbar */}
      <ModernNavbar />

      {/* Page Content */}
      <div className="bg-btn-primary flex min-h-[calc(100svh-8vh)] flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-4xl">
          <ResetPasswordForm />
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </>
  )
}
