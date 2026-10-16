import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { GlobalSearchModal } from './GlobalSearchModal';
import { AccessDeniedGate } from '../common/AccessDeniedGate';
import { useAdmin } from '../../context/AdminContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toasts, removeToast, canAccessAdminPanel } = useAdmin();

  return (
    <div className="app-container">
      {/* Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Column */}
      <div className="app-main">
        <AdminHeader onToggleMobile={() => setMobileOpen(!mobileOpen)} />

        <main className="page-content-wrapper">
          {canAccessAdminPanel ? children : <AccessDeniedGate />}
        </main>
      </div>

      {/* Global Search Modal */}
      {canAccessAdminPanel && <GlobalSearchModal />}

      {/* Floating Toast Notification Dock */}
      {toasts.length > 0 && (
        <div className="toast-dock">
          {toasts.map((t) => {
            let Icon = CheckCircle2;
            let iconColor = 'var(--color-success)';
            if (t.type === 'error') {
              Icon = XCircle;
              iconColor = 'var(--color-danger)';
            } else if (t.type === 'warning') {
              Icon = AlertTriangle;
              iconColor = 'var(--color-warning)';
            } else if (t.type === 'info') {
              Icon = Info;
              iconColor = 'var(--bexo-blue-600)';
            }

            return (
              <div key={t.id} className={`toast-item ${t.type}`}>
                <Icon size={19} color={iconColor} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div className="toast-title">{t.title}</div>
                  {t.message && <div className="toast-msg">{t.message}</div>}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  style={{ color: '#94A3B8', padding: '2px', marginLeft: '6px' }}
                >
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
