import Table from '@/components/pregnancy/PregnancyMonitoring'; // adjust the path based on your folder structure
import { BaseLayout } from "@/layouts/base-layout"


const PregnantRecordsPage = () => {
  return (
    <BaseLayout
    title="Pregnancy Monitoring Records"
    description="View and manage pregnancy monitoring records and information"
    >
      <Table />
    </BaseLayout>
  );
};

export default PregnantRecordsPage;
