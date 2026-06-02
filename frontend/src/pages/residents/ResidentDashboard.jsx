import ModernNavbar from "@/components/Navbar"
import Dashboard from "@/components/client/CertificateList"
export default function ResidentDashboard() {
  return (
    <>
      {/* Navbar */}
      <ModernNavbar />

      {/* Page Content */}
      <div className="bg-btn-primary min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-6 md:py-8 md:mt-16">
        <div className="w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
          <Dashboard />
        </div>
      </div>

    </>
  )
}
