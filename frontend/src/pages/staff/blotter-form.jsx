import Image from '@/components/blotter/BlotterForm';
import { BaseLayout } from "@/layouts/base-layout"

export default function BlotterFormPage() {
  return (
    <BaseLayout
      title="Blotter Form"
      description="Create and Update Blotter Records"
    >
       <Image />
    </BaseLayout>
  )
}