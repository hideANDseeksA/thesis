import Table from '../../components/certificates/Transaction'; // adjust the path based on your folder structure
import { BaseLayout } from "@/layouts/base-layout"
const CertificateOnlineTransactions = () => {
  return (
    <BaseLayout
    title="Certificate Online Transactions"
    description="View and manage certificate transactions and appointments"
    >
      <Table />
    </BaseLayout> 
  );
};

export default CertificateOnlineTransactions;

