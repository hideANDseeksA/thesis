import ModernNavbar from "@/components/Navbar";
import NotificationPage from "@/components/NotificationPage";

export default function ResidentDashboard() {
  return (
    <>
      <ModernNavbar />

<main className="bg-btn-primary md:mt-15">
  <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6">
    <div className="min-h-[calc(100svh-56px)] sm:min-h-[calc(100svh-64px)] lg:h-[calc(100svh-8vh)] overflow-visible lg:overflow-hidden rounded-xl border border-border bg-background">
      <NotificationPage />
    </div>
  </div>
</main>
    </>
  );
}