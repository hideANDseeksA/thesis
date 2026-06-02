// src/pages/dashboard.jsx

import { BaseLayout } from "@/layouts/base-layout"
import Table from '@/components/documents/DocumentTable'; // adjust the path based on your folder structure

export default function AdminDocumentPage() {
  return (
    <BaseLayout
      title="Documents Management"
      description="View and manage your documents"
    >
       <Table />
    </BaseLayout>
  )
}