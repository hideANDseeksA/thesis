 import Prenatal from '@/components/forms/maternal-form'; 
 import { BaseLayout } from "@/layouts/base-layout"
 
 export default function PrenatalFormPage() {
   return (
     <BaseLayout
       title="Prenatal Records Form"
       description="Create and Update Prenatal Records"
     >
        <Prenatal />
     </BaseLayout>
   )
 }