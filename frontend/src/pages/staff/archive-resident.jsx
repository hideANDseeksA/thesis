// src/pages/dashboard.jsx

import ArchivePage from "@/components/resident-managements/pages/ArchivePage"
import { BaseLayout } from "@/layouts/base-layout"
export default function ArchiveResidentPage() {
  return (
    <BaseLayout
      title="Archived Residents"
      description="View and manage archived resident information"
    >
       <ArchivePage />
    </BaseLayout>
  )
}