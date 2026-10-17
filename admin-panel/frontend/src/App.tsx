import React from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { RouterProvider, useRouter } from './router/Router';
import { AdminLayout } from './components/layout/AdminLayout';
import { EmailPreviewModal } from './components/common/EmailPreviewModal';

// Auth Pages
import { LoginPage } from './pages/LoginPage';
import { ActivateAccountPage } from './pages/ActivateAccountPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { CorporateAccessDeniedPage } from './pages/CorporateAccessDeniedPage';
import { ConsumerUserPage } from './pages/ConsumerUserPage';

// Admin Page components
import { DashboardPage } from './pages/DashboardPage';
import { CollegesPage } from './pages/CollegesPage';
import { CollegeDetailPage } from './pages/CollegeDetailPage';
import { StudentsPage } from './pages/StudentsPage';
import { ProvisioningPage } from './pages/ProvisioningPage';
import { ServicesPage } from './pages/ServicesPage';
import { AccessControlPage } from './pages/AccessControlPage';
import { UsersPage } from './pages/UsersPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { RequestsPage } from './pages/RequestsPage';
import { AgreementsPage } from './pages/AgreementsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditPage } from './pages/AuditPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { SettingsPage } from './pages/SettingsPage';
import { TemplatesPage } from './pages/TemplatesPage';

const AdminSubRoutes: React.FC = () => {
  const { path } = useRouter();

  // Match /admin/colleges/:id
  if (path.startsWith('/admin/colleges/') && path.split('/')[3]) {
    return <CollegeDetailPage />;
  }

  switch (path) {
    case '/admin':
    case '/':
      return <DashboardPage />;
    case '/admin/colleges':
      return <CollegesPage />;
    case '/admin/students':
      return <StudentsPage />;
    case '/admin/provisioning':
      return <ProvisioningPage />;
    case '/admin/services':
      return <ServicesPage />;
    case '/admin/access-control':
      return <AccessControlPage />;
    case '/admin/users':
      return <UsersPage />;
    case '/admin/approvals':
      return <ApprovalsPage />;
    case '/admin/requests':
      return <RequestsPage />;
    case '/admin/agreements':
      return <AgreementsPage />;
    case '/admin/payments':
      return <PaymentsPage />;
    case '/admin/notifications':
      return <NotificationsPage />;
    case '/admin/reports':
      return <ReportsPage />;
    case '/admin/audit':
      return <AuditPage />;
    case '/admin/system-health':
      return <SystemHealthPage />;
    case '/admin/templates':
      return <TemplatesPage />;
    case '/admin/settings':
      return <SettingsPage />;
    default:
      return <DashboardPage />;
  }
};

const AppRoutes: React.FC = () => {
  const { path, navigate } = useRouter();
  const { currentUser, isCorporateAdmin, isAuthenticated } = useAdmin();

  // Redirect legacy /college paths to /admin
  React.useEffect(() => {
    if (isAuthenticated && path.startsWith('/college')) {
      navigate('/admin');
    }
  }, [path, navigate, isAuthenticated]);

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

  // 2. Unauthenticated Gate: Redirect to login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // 2b. Consumer / Standard User Identity Hub
  if (path.startsWith('/user') || currentUser?.role === 'normal_user') {
    return <ConsumerUserPage />;
  }

  // 3. Multi-Tenant Route Isolation Gate
  // College users must never access company-wide admin routes or central controls
  const isCollegeUser = !isCorporateAdmin && Boolean(currentUser.collegeId || currentUser.role.startsWith('college_'));
  if (isCollegeUser) {
    return <CorporateAccessDeniedPage />;
  }

  // 4. Fallback for legacy college path before layout render
  if (path.startsWith('/college')) {
    return <DashboardPage />;
  }

  // 5. Central Corporate Admin Panel Routes
  return (
    <AdminLayout>
      <AdminSubRoutes />
    </AdminLayout>
  );
};

export const AppContent: React.FC = () => {
  const { activeEmailForPreview, setActiveEmailForPreview } = useAdmin();

  return (
    <>
      <AppRoutes />

      {/* Global Interactive BEXO Email Preview Center */}
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
    <AdminProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AdminProvider>
  );
};

export default App;
