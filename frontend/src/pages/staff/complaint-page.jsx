import Table from '@/components/admin/ComplaintTable'; // adjust the path based on your folder structure
import { BaseLayout } from "@/layouts/base-layout"

export default function AdminComplaintPage() {
  return (
    <BaseLayout
      title="Complaint Management"
      description="View and manage complaints of residents"
    >
        <Table />
    </BaseLayout>
  )
}