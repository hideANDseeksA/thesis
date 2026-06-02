import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from "react"

import { getAccessToken } from "@/lib/tokenService"
import { decodeToken } from "@/lib/jwt"

import MantineRoute from '../MantineRoute';
import ProtectedRoute from './ProtectedRoute';


import ResidentListPage from '@/pages/staff/residentlist';
import BdacListPage from '@/pages/staff/bdaclist';
import ArchiveResidentPage from '@/pages/staff/archive-resident';

import Certificatelist from '@/pages/staff/certificate-list';
import CertificateAppointments from '@/pages/staff/certificate-appointment';
import CertificateOnlineTransactions from '@/pages/staff/certificate-online';
import CertificateHistoryPage from '@/pages/staff/certificate-history';


import AdminComplaintPage from '@/pages/staff/complaint-page';
import BlotterListPage from '@/pages/staff/blotter-list';
import BlotterFormPage from '@/pages/staff/blotter-form';



import LoginPage from '@/pages/auth/Login';
import SignupPage from '@/pages/auth/Signup';
import VerifyEmailPage from '@/pages/auth/verify-page';
import ForgotPassword from '@/pages/auth/forgot-password';
import ResetPasswordPage from '@/pages/auth/reset';
import SendVerificationPage from '@/pages/auth/sendverification';


import HealthRecordsPage from '@/pages/healthworker/health-record';
import HealthRecordsFormPage from '@/pages/healthworker/health-records-form';
import PregnantRecordsPage from '@/pages/healthworker/pregnant-record';
import PrenatalFormPage from '@/pages/healthworker/pregnancy-form';
import PrintPrenatalPage from '@/pages/healthworker/pregnant-print';

import AdminDocumentPage from '@/pages/staff/document-page';
import SettingsPage from '@/pages/settings';
import AdminMessagePage from '@/pages/message-page';

import BaseLayout from '@/pages/dashboard';


import DocumentsPage from '@/pages/residents/DocumentResident';
import PDFViewerPage from '@/components/documents/view';
import ProfileDashboard from '@/pages/residents/ProfilePage';
import DashboardResident from '@/pages/residents/ResidentDashboard';
import NotificationsPage from '@/pages/residents/NotificationPage';
import TransactionHistory from '@/pages/residents/transactionresident';



import TermsAndCondtionPage from '@/pages/TermsAndCondtion';
import ContributorPage from '@/pages/Contributor';
import LandingPage from '@/pages/LandingPage';


import NotFoundPage from '@/errors/not-found/page';
import UnauthorizedPage from '@/errors/unauthorized/page';


function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = getAccessToken()
    if (!token) return
    const decoded = decodeToken(token)
    if (decoded) setUser(decoded)
  }, [])
  return (

    <Routes>



      <Route path='/' element={<LandingPage />} />

      <Route path="*" element={<NotFoundPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />
      <Route path='terms-conditions' element={<TermsAndCondtionPage />} />
      <Route path='contributors' element={<ContributorPage />} />


      <Route path='verify-email' element={<VerifyEmailPage />} />
      <Route path='forgot-password' element={<ForgotPassword />} />
      <Route path='reset-password' element={<ResetPasswordPage />} />
      <Route path='send-verification' element={<SendVerificationPage />} />






      <Route element={<ProtectedRoute allowedRoles={["healthworker", "staff"]} />}>

        <Route path='/dashboard' element={<MantineRoute><BaseLayout /></MantineRoute>} />
        <Route path='/resident-list/' element={<MantineRoute><ResidentListPage /></MantineRoute>} />

      </Route>

      <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>




        <Route path='/bdac-list/' element={<MantineRoute><BdacListPage /></MantineRoute>} />
        <Route path='/archive-resident/' element={<MantineRoute><ArchiveResidentPage /></MantineRoute>} />




        <Route path='/certificates/list' element={<MantineRoute><Certificatelist /></MantineRoute>} />
        <Route path='/certificates/appointment' element={<MantineRoute><CertificateAppointments /></MantineRoute>} />
        <Route path='/certificates/online-request' element={<MantineRoute><CertificateOnlineTransactions /></MantineRoute>} />
        <Route path='/certificates/history' element={<MantineRoute><CertificateHistoryPage /></MantineRoute>} />



        <Route path='/complaints' element={<MantineRoute><AdminComplaintPage /></MantineRoute>} />
        <Route path='/blotter/blotter-list' element={<MantineRoute><BlotterListPage /></MantineRoute>} />
        <Route path='/blotter/blotter-form/:id' element={<MantineRoute><BlotterFormPage /></MantineRoute>} />
        <Route path='/blotter/blotter-form' element={<MantineRoute><BlotterFormPage /></MantineRoute>} />


        <Route path='/documents' element={<MantineRoute><AdminDocumentPage /></MantineRoute>} />
        <Route path='/settings' element={<MantineRoute><SettingsPage /></MantineRoute>} />
        <Route path='/messages' element={<MantineRoute><AdminMessagePage /></MantineRoute>} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["healthworker"]} />}>
        <Route path='/resident-list/' element={<MantineRoute><ResidentListPage /></MantineRoute>} />
        <Route path='/health-records/' element={<MantineRoute><HealthRecordsPage /></MantineRoute>} />
        <Route path='/health-records-form/:id' element={<MantineRoute><HealthRecordsFormPage /></MantineRoute>} />
        <Route path='/pregnant-records/' element={<MantineRoute><PregnantRecordsPage /></MantineRoute>} />
        <Route path='/pregnancy-form/:id' element={<MantineRoute><PrenatalFormPage /></MantineRoute>} />
        <Route path="/print/prenatal/:id" element={<PrintPrenatalPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["resident","healthworker", "staff"]} />}>
        <Route path="resident/certificates" element={<DashboardResident />} />
        <Route path="resident/documents" element={<DocumentsPage />} />
        <Route path="resident/documents/view" element={<PDFViewerPage />} />
        <Route path="resident/dashboard" element={<ProfileDashboard />} />
        <Route path='resident/notifications' element={<NotificationsPage />} />
        <Route path='resident/transactions' element={<TransactionHistory />} />
      </Route>

    </Routes>


  );
}

export default App;
