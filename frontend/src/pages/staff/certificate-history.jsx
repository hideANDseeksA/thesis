import Table from '@/components/certificates/HistoryTable';
import { BaseLayout } from "@/layouts/base-layout"
const CertificateHistoryPage = () => {
  return (
    <BaseLayout 
    title="Certificate History"
    description="View and manage the history of issued certificates and transactions">
      <h3>Certificate History Dashboard</h3>
      <Table />
    </BaseLayout>
  );
};

export default CertificateHistoryPage;
