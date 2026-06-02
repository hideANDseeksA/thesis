// src/pages/dashboard.jsx

import { BaseLayout } from "@/layouts/base-layout"
import Home from '../components/home/Admin.Home';
export default function DashboardPage() {
  return (
    <BaseLayout
      title="Dashboard"
      description="Overview of your system"
    >
       <Home />
    </BaseLayout>
  )
}