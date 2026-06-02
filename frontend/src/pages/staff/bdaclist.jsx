// src/pages/dashboard.jsx

import { BaseLayout } from "@/layouts/base-layout"
import BdacPage from "@/components/resident-managements/pages/BdacPage"
export default function BdacListPage() {
  return (
    <BaseLayout
      title="BDAC Records"
      description="Manage Barangay Anti-Drug Abuse Council information and details"
    >
       <BdacPage />
    </BaseLayout>
  )
}