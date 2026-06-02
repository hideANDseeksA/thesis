import Table from '../../components/certificates/AppointmentTable'; // adjust the path based on your folder structure
import { BaseLayout } from "@/layouts/base-layout"
const CertificateAppointments = () => {
  return (
    <BaseLayout
    title="Certificate Appointments"
    description="View and manage certificate appointments"
    >   
      <Table />

    </BaseLayout> 
    );
};

export default CertificateAppointments;

