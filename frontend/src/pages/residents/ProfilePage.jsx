import ProfilePage from "@/components/home/ProfileDashboard";
import ModernNavbar from "@/components/Navbar";
export default function ProfileDashboard() {
    return (
        <>
            <ModernNavbar />
                 <div className="bg-btn-primary flex min-h-[calc(100svh-8vh)] flex-col items-center md:mt-10">

                     <ProfilePage />
                     </div>
          
        </>
    )
}