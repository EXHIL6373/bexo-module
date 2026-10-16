import React, { useState } from 'react';
import { CollegeSidebar } from './CollegeSidebar';
import { CollegeHeader } from './CollegeHeader';
import { useAdmin } from '../../context/AdminContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const CollegeLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toasts, removeToast } = useAdmin();

  return (
    <div className="college-layout-root" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* College Institutional Sidebar */}
      <CollegeSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Column */}
      <div className="college-main-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        <CollegeHeader onToggleMobile={() => setMobileOpen(!mobileOpen)} />

        <main className="app-main-content" style={{ flex: 1, padding: '24px 28px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      {/* Floating Toast Dock */}
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
                  style={{ color: '#94A3B8', padding: '2px', marginLeft: '6px', background: 'none', border: 'none', cursor: 'pointer' }}
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
