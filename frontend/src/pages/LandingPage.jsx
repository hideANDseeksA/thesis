import ModernNavbar from "@/components/Navbar"
import SmartBarangayLanding from "@/components/LandingPage"
import Footer from "@/components/Footer"

export default function LandingPage() {
  return (
    <>
      {/* Navbar */}
      <ModernNavbar />

      {/* Page Content */}
      <main className="bg-btn-primary flex flex-col min-h-[calc(100svh-8vh)]">
       
        <SmartBarangayLanding />
      </main>


      {/* Footer */}
      <Footer />
    </>
  )
}