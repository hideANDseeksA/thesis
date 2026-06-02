import Table from '../../components/certificates/CertificatesTable'; // adjust the path based on your folder structure
import { BaseLayout } from "@/layouts/base-layout"
const CertificateListPage = () => {
  return (

    <BaseLayout
    title="Certificate List"
    description="View and manage certificates issued to residents in the barangay"
   helpText="Use placeholders such as [[full_name]],[[birthdate]], [[age]], [[sex]], [[purok]] and [[civil_status]] where you want the resident’s information to appear automatically in the document. The placeholder name should match the field name exactly. The template will be saved as a .docx file."
    >
      <Table />
    </BaseLayout>
  );
};

export default CertificateListPage;

