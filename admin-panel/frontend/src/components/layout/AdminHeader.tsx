import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useRouter } from '../../router/Router';
import {
  Search,
  Bell,
  Globe,
  Plus,
  Activity,
  CheckCircle2,
  ChevronDown,
  Menu,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  LogOut,
} from 'lucide-react';

interface AdminHeaderProps {
  onToggleMobile: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleMobile }) => {
  const {
    currentUser,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setIsSearchOpen,
    resetAllData,
    canAccessAdminPanel,
    switchToSuperAdmin,
    staffUsers,
    logout,
    isDemoMode,
  } = useAdmin();

  const { navigate } = useRouter();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="app-header">
      {/* Left: Mobile Toggle & Global Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          className="icon-btn"
          onClick={onToggleMobile}
          style={{ display: 'none' }}
          id="mobile-nav-toggle"
        >
          <Menu size={18} />
        </button>

        <div className="header-search-bar" onClick={() => setIsSearchOpen(true)}>
          <Search size={16} color="var(--text-muted)" />
          <span className="search-placeholder-text">Search colleges, students, roll no...</span>
          <span className="kbd-shortcut">Ctrl+K</span>
        </div>

        {isDemoMode && (
          <div
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#D97706',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              letterSpacing: '0.04em',
            }}
          >
            <Sparkles size={13} color="#D97706" />
            <span>DEMO MODE ACTIVE</span>
          </div>
        )}

        {!canAccessAdminPanel && (
          <div
            style={{
              backgroundColor: '#FFE4E6',
              color: '#BE123C',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid #FECDD3',
              letterSpacing: '0.02em',
            }}
          >
            <ShieldAlert size={15} />
            <span>COLLEGE ACCOUNT: ADMIN ACCESS FORBIDDEN</span>
          </div>
        )}
      </div>

      {/* Right: Scope Switcher, Health, Notifications, Profile */}
      <div className="header-actions-right">
        {/* Corporate Authority Indicator */}
        <div
          className="scope-pill-btn company-mode"
          title="BEXO Central Corporate Administration — Platform-Wide Governance"
        >
          <Globe size={14} color="#2563EB" />
          <span>Company-Wide Authority</span>
        </div>

        {/* Quick System Health Pill */}
        <div
          onClick={() => navigate('/admin/system-health')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#059669',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          title="System Health Telemetry"
        >
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
          <span>Services 100% Up</span>
        </div>

        {/* Notification Bell Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            title="Notification Center"
          >
            <Bell size={18} />
            {unreadNotificationCount > 0 && <span className="btn-indicator-dot" />}
          </button>

          {notifDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '360px',
                backgroundColor: 'white',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 60,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--bg-surface-subtle)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  Notifications ({unreadNotificationCount} unread)
                </div>
                {unreadNotificationCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    style={{ fontSize: '11.5px', color: 'var(--bexo-blue-600)', fontWeight: 600 }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationAsRead(n.id);
                      if (n.actionUrl) {
                        navigate(n.actionUrl);
                        setNotifDropdownOpen(false);
                      }
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: n.isRead ? 'transparent' : '#F0F9FF',
                      cursor: 'pointer',
                      transition: 'background 120ms',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text-primary)' }}>
                        {n.title}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: '10px 16px',
                  textAlign: 'center',
                  borderTop: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                }}
              >
                <button
                  onClick={() => {
                    navigate('/admin/notifications');
                    setNotifDropdownOpen(false);
                  }}
                  style={{ fontSize: '12px', fontWeight: 600, color: 'var(--bexo-blue-600)' }}
                >
                  View All Notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Actions */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '4px 6px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: currentUser.role === 'super_admin' ? '#F59E0B' : currentUser.role.startsWith('college_') ? '#E11D48' : 'var(--bexo-navy-900)',
                color: currentUser.role === 'super_admin' ? '#000000' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '13px',
              }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div style={{ textAlign: 'left', marginRight: '4px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {currentUser.name.split(' ')[0]}
                {currentUser.role === 'super_admin' && <span style={{ fontSize: '11px', color: '#F59E0B' }}>👑</span>}
              </div>
              <div
                style={{
                  fontSize: '10.5px',
                  color: currentUser.role === 'super_admin' ? '#D97706' : currentUser.role.startsWith('college_') ? '#E11D48' : 'var(--text-muted)',
                  lineHeight: 1,
                  fontWeight: 600,
                }}
              >
                {currentUser.role === 'super_admin' ? 'SUPER ADMIN' : currentUser.role.startsWith('college_') ? 'COLLEGE (DENIED)' : currentUser.role.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            <ChevronDown size={14} color="#64748B" />
          </button>

          {profileDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '260px',
                backgroundColor: 'white',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 60,
                padding: '6px',
              }}
            >
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {currentUser.name}
                  {currentUser.role === 'super_admin' && <span style={{ fontSize: '11px' }}>👑</span>}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{currentUser.email}</div>
                <div
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: currentUser.role === 'super_admin' ? '#D97706' : currentUser.role.startsWith('college_') ? '#E11D48' : '#2563EB',
                    marginTop: '2px',
                  }}
                >
                  {currentUser.role === 'super_admin' ? 'SUPER ADMIN (FULL HQ AUTHORITY)' : currentUser.role.startsWith('college_') ? 'COLLEGE SCOPE (PANEL DENIED)' : currentUser.role.replace('_', ' ').toUpperCase()}
                </div>
              </div>

              {/* Quick Super Admin switcher buttons */}
              <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Switch Super Admin Persona
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    onClick={() => {
                      switchToSuperAdmin('usr-super-kavin');
                      setProfileDropdownOpen(false);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '5px 8px',
                      borderRadius: '4px',
                      backgroundColor: currentUser.id === 'usr-super-kavin' ? '#EFF6FF' : 'transparent',
                      color: currentUser.id === 'usr-super-kavin' ? '#1E40AF' : '#334155',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>👑 Kavinbalaji S K</span>
                    {currentUser.id === 'usr-super-kavin' && <CheckCircle2 size={13} color="#2563EB" />}
                  </button>

                  <button
                    onClick={() => {
                      switchToSuperAdmin('usr-admin-1');
                      setProfileDropdownOpen(false);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '5px 8px',
                      borderRadius: '4px',
                      backgroundColor: currentUser.id === 'usr-admin-1' ? '#EFF6FF' : 'transparent',
                      color: currentUser.id === 'usr-admin-1' ? '#1E40AF' : '#334155',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>👑 Ezhilarasan M.</span>
                    {currentUser.id === 'usr-admin-1' && <CheckCircle2 size={13} color="#2563EB" />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  navigate('/admin/settings');
                  setProfileDropdownOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ShieldCheck size={15} color="#64748B" />
                <span>Account & Security</span>
              </button>

              <button
                onClick={() => {
                  resetAllData();
                  setProfileDropdownOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  color: 'var(--color-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <RotateCcw size={15} color="var(--color-warning)" />
                <span>Reset Demo State</span>
              </button>

              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  logout();
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  color: 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <LogOut size={15} color="var(--color-danger)" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
