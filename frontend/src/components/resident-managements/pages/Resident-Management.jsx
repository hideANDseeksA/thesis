import Table from '@/components/resident-managements/ResidentTable'; // adjust the path based on your folder structure
import { FolderSearch } from 'lucide-react';


const Dashboard = () => {
  return (
    <div >  {/* ✅ min-w-0 prevents overflow blowout */}

      <Table />
    </div>
  );
};

export default Dashboard;
