 import PatientFormPage from '@/components/health/HealthForm'; 
 import { BaseLayout } from "@/layouts/base-layout"
 
 export default function HealthRecordsFormPage() {
   return (
     <BaseLayout
       title="Health Records Form"
       description="Create and Update Health Records"
     >
        <PatientFormPage />
     </BaseLayout>
   )
 }