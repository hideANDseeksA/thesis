// src/pages/dashboard.jsx

import { BaseLayout } from "@/layouts/base-layout"
import ResidentManagement from '@/components/resident-managements/pages/Resident-Management';
export default function ResidentListPage() {
  return (
    <BaseLayout
      title="Resident List"
      description="Manage resident information and details"
    >
       <ResidentManagement />
    </BaseLayout>
  )
}