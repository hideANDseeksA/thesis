// src/pages/dashboard.jsx

import { BaseLayout } from "@/layouts/base-layout"
import MessagePage from '@/components/admin/Message'
export default function AdminMessagePage() {
  return (
    <BaseLayout
      title="Messages"
      description="View and manage your messages"
    >
       <MessagePage />
    </BaseLayout>
  )
}