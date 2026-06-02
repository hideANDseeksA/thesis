import Table from '../../components/blotter/BlotterTable'; // adjust the path based on your folder structure
import { BaseLayout } from "@/layouts/base-layout"
const BlotterListPage = () => {
  return (
    <BaseLayout
    title="Blotter List"
    description="View and manage blotter records and complaints"
    >   
      <Table />
    </BaseLayout>
  );
};

export default BlotterListPage;

