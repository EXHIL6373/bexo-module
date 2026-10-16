import React from 'react';
import { useRouter } from '../../router/Router';
import { useAdmin } from '../../context/AdminContext';
import {
  Building2,
  Bell,
  LogOut,
  AlertTriangle,
  Menu,
} from 'lucide-react';

interface CollegeHeaderProps {
  onToggleMobile: () => void;
}

export const CollegeHeader: React.FC<CollegeHeaderProps> = ({ onToggleMobile }) => {
  const { navigate } = useRouter();
  const {
    currentUser,
    logout,
    colleges,
    currentCollege,
    unreadNotificationCount,
    isCorporateAdmin,
  } = useAdmin();

  // Find college details strictly from authenticated identity
  const college = currentCollege || colleges.find(
    (c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName
  ) || (isCorporateAdmin ? colleges[0] : undefined);

  const isSuspended =
    college?.status === 'Suspended' ||
    currentUser.accountStatus === 'SUSPENDED' ||
    currentUser.isActive === false;

  const quotaPercent = college
    ? Math.min(100, Math.round((college.quota.used / Math.max(1, college.quota.allocated)) * 100))
    : 0;

  return (
    <div>
      {/* Top Main College Header */}
      <header
        className="college-header"
        style={{
          minHeight: '68px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Left: Mobile hamburger & College Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <button
            onClick={onToggleMobile}
            className="mobile-menu-btn"
            aria-label="Open Navigation Menu"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <Menu size={22} color="#0F172A" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                flexShrink: 0,
                borderRadius: '10px',
                backgroundColor: isSuspended ? '#FEF2F2' : '#EFF6FF',
                border: isSuspended ? '1px solid #FECDD3' : '1px solid #BFDBFE',
                color: isSuspended ? '#E11D48' : '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '15px',
              }}
            >
              <Building2 size={22} />
            </div>

            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                <span
                  className="header-college-title"
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#0F172A',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '260px',
                    lineHeight: '1.25',
                    display: 'inline-block',
                  }}
                  title={college?.name || currentUser.collegeName}
                >
                  {college?.name || currentUser.collegeName || 'Institutional College'}
                </span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {college?.code || 'COL-INST'}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: isSuspended ? '#FEE2E2' : '#DCFCE7',
                    color: isSuspended ? '#991B1B' : '#166534',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: isSuspended ? '#EF4444' : '#22C55E',
                    }}
                  />
                  {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                </span>
              </div>
              <div
                className="header-subtitle"
                style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}
              >
                BEXO Institutional Portal • Scope ID: {currentUser.collegeId || college?.id || 'COL001'}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quota Bar, Notifications & User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Quota indicator widget */}
          {college && (
            <div
              style={{
                width: '120px',
                padding: '4px 8px',
                borderRadius: '8px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                flexShrink: 0,
              }}
              className="quota-header-widget"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>
                <span>Quota</span>
                <span>{college.quota.used} / {college.quota.allocated}</span>
              </div>
              <div style={{ height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${quotaPercent}%`,
                    backgroundColor: isSuspended ? '#EF4444' : quotaPercent > 90 ? '#F59E0B' : '#2563EB',
                    borderRadius: '2px',
                  }}
                />
              </div>
            </div>
          )}

          {/* Notifications button */}
          <button
            onClick={() => navigate('/college/notifications')}
            style={{
              position: 'relative',
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            title="College Notifications"
          >
            <Bell size={16} />
            {unreadNotificationCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#EF4444',
                }}
              />
            )}
          </button>

          {/* User Profile Capsule */}
          <div
            onClick={() => navigate('/college/profile')}
            className="header-user-capsule"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              borderRadius: '8px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="View Profile"
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '11px',
                flexShrink: 0,
              }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div className="user-capsule-text" style={{ textAlign: 'left', lineHeight: 1.1 }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0F172A', maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name.split(' ')[0]}
              </div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>
                {currentUser.role.replace('college_', '').replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="header-exit-btn"
            style={{
              padding: '6px 8px',
              borderRadius: '7px',
              backgroundColor: 'transparent',
              border: '1px solid #E2E8F0',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11.5px',
              fontWeight: 600,
              flexShrink: 0,
            }}
            title="Sign Out"
          >
            <LogOut size={13} />
            <span className="exit-btn-label">Exit</span>
          </button>
        </div>
      </header>

      {/* College Suspension Banner */}
      {isSuspended && (
        <div
          style={{
            backgroundColor: '#BE123C',
            color: '#FFFFFF',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            fontSize: '13px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="#FECDD3" style={{ flexShrink: 0 }} />
            <div>
              <strong>INSTITUTIONAL SUSPENSION NOTICE:</strong> This college account is currently in{' '}
              <strong>SUSPENDED</strong> status by BEXO Administration. New student provisioning is blocked.
              Historical student records, provisioning logs, and audit trails remain preserved in read-only mode.
            </div>
          </div>
          <button
            onClick={() => navigate('/college/support')}
            style={{
              padding: '4px 12px',
              backgroundColor: '#FFFFFF',
              color: '#BE123C',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Contact BEXO Support
          </button>
        </div>
      )}
    </div>
  );
};
