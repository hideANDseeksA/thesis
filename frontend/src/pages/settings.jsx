// src/pages/dashboard.jsx

import AdminSettings from '@/components/admin/setting-tabs';
import { BaseLayout } from "@/layouts/base-layout"
export default function SettingsPage() {
  return (
    <BaseLayout
      title="Settings"
      description="Manage your account settings"
    >
         <AdminSettings />
    </BaseLayout>
  )
}