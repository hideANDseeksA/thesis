import Table from '@/components/health/HealthRecords'; // adjust the path based on your folder structure
import { BaseLayout } from "@/layouts/base-layout"


const HealthRecordsPage = () => {
  return (
    <BaseLayout
    title="Resident Health Records"
    description="View and manage resident health records and information"
    >
 

      <Table />
    </BaseLayout>
  );
};

export default HealthRecordsPage;
