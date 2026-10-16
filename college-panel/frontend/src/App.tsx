import React from 'react';
import { CollegeProvider, useCollege } from './context/CollegeContext';
import { RouterProvider, useRouter } from './router/Router';
import { CollegeLayout } from './components/layout/CollegeLayout';
import { EmailPreviewModal } from './components/common/EmailPreviewModal';

// Auth Pages
import { LoginPage } from './pages/LoginPage';
import { ActivateAccountPage } from './pages/ActivateAccountPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// College Portal Page components
import { CollegeDashboardPage } from './pages/college/CollegeDashboardPage';
import { CollegeStudentsPage } from './pages/college/CollegeStudentsPage';
import { CollegeStudentImportPage } from './pages/college/CollegeStudentImportPage';
import { CollegeStudentDetailPage } from './pages/college/CollegeStudentDetailPage';
import { CollegeGiveAccessPage } from './pages/college/CollegeGiveAccessPage';
import { CollegeProvisioningPage } from './pages/college/CollegeProvisioningPage';
import { CollegeServicesPage } from './pages/college/CollegeServicesPage';
import { CollegeEntitlementsPage } from './pages/college/CollegeEntitlementsPage';
import { CollegeStaffPage } from './pages/college/CollegeStaffPage';
import { CollegeAgreementPage } from './pages/college/CollegeAgreementPage';
import { CollegeProfilePage } from './pages/college/CollegeProfilePage';
import { CollegeSupportPage } from './pages/college/CollegeSupportPage';
import {
  CollegeRequestsPage,
  CollegeBillingPage,
  CollegeNotificationsPage,
  CollegeReportsPage,
  CollegeAnnouncementsPage,
  CollegeTasksPage,
  CollegeActivityPage,
  CollegeSettingsPage,
} from './pages/college/CollegeOtherPages';

const CollegeSubRoutes: React.FC = () => {
  const { path } = useRouter();

  // Match /college/students/import
  if (path === '/college/students/import' || path === '/college/bulk-import' || path === '/college/import') {
    return <CollegeStudentImportPage />;
  }

  // Match /college/students/:id (excluding import)
  if (path.startsWith('/college/students/') && path.split('/')[3] && path.split('/')[3] !== 'import') {
    return <CollegeStudentDetailPage />;
  }

  switch (path) {
    case '/college':
    case '/college/dashboard':
    case '/':
      return <CollegeDashboardPage />;
    case '/college/students':
      return <CollegeStudentsPage />;
    case '/college/give-access':
      return <CollegeGiveAccessPage />;
    case '/college/provisioning':
    case '/college/jobs':
      return <CollegeProvisioningPage />;
    case '/college/services':
    case '/college/quota':
      return <CollegeServicesPage />;
    case '/college/entitlements':
      return <CollegeEntitlementsPage />;
    case '/college/staff':
      return <CollegeStaffPage />;
    case '/college/agreement':
    case '/college/agreements':
      return <CollegeAgreementPage />;
    case '/college/requests':
      return <CollegeRequestsPage />;
    case '/college/billing':
      return <CollegeBillingPage />;
    case '/college/notifications':
      return <CollegeNotificationsPage />;
    case '/college/reports':
      return <CollegeReportsPage />;
    case '/college/announcements':
      return <CollegeAnnouncementsPage />;
    case '/college/tasks':
      return <CollegeTasksPage />;
    case '/college/activity':
      return <CollegeActivityPage />;
    case '/college/settings':
      return <CollegeSettingsPage />;
    case '/college/profile':
      return <CollegeProfilePage />;
    case '/college/support':
      return <CollegeSupportPage />;
    default:
      // Any unknown or corporate admin route automatically falls back to College Dashboard
      return <CollegeDashboardPage />;
  }
};

const AppRoutes: React.FC = () => {
  const { path } = useRouter();
  const { isAuthenticated, isLoading } = useCollege();

  // 1. Standalone Authentication & Onboarding Routes
  if (path.startsWith('/login')) {
    return <LoginPage />;
  }
  if (path.startsWith('/activate-account')) {
    return <ActivateAccountPage />;
  }
  if (path.startsWith('/forgot-password')) {
    return <ForgotPasswordPage />;
  }
  if (path.startsWith('/reset-password')) {
    return <ResetPasswordPage />;
  }

  // 2. Unauthenticated Gate: Redirect to /login
  if (!isAuthenticated && !isLoading) {
    return <LoginPage />;
  }

  // 3. Protected Institutional College Portal Experience
  return (
    <CollegeLayout>
      <CollegeSubRoutes />
    </CollegeLayout>
  );
};

export const AppContent: React.FC = () => {
  const { activeEmailForPreview, setActiveEmailForPreview } = useCollege();

  return (
    <>
      <AppRoutes />

      {/* Interactive Outbox Email Preview Modal for In-Portal Notification Inspection */}
      {activeEmailForPreview && (
        <EmailPreviewModal
          isOpen={Boolean(activeEmailForPreview)}
          onClose={() => setActiveEmailForPreview(null)}
          email={activeEmailForPreview}
        />
      )}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <CollegeProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </CollegeProvider>
  );
};

export default App;
