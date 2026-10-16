import React, { useEffect } from 'react';
import { useRouter } from '../../router/Router';
import { useAdmin } from '../../context/AdminContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Hash,
  UploadCloud,
  Layers,
  Sparkles,
  Award,
  Users2,
  FileQuestion,
  FileCheck2,
  CreditCard,
  Bell,
  BarChart3,
  Megaphone,
  CheckSquare,
  Activity,
  Settings,
  HelpCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  X,
} from 'lucide-react';

interface CollegeSidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (val: boolean) => void;
}

export const CollegeSidebar: React.FC<CollegeSidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { path, navigate } = useRouter();
  const { currentUser, colleges, currentCollege, isCorporateAdmin } = useAdmin();

  // Handle mobile drawer lifecycle (escape key close, body scroll lock)
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMobileOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileOpen, setMobileOpen]);

  const college = currentCollege || colleges.find(
    (c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName
  ) || (isCorporateAdmin ? colleges[0] : undefined);

  const sections = [
    {
      group: 'MAIN',
      items: [
        { label: 'Dashboard', path: '/college/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'STUDENT MANAGEMENT',
      items: [
        { label: 'All Students', path: '/college/students', icon: Users },
        { label: 'Bulk Import', path: '/college/students/import', icon: UploadCloud },
        { label: 'Give Student Access', path: '/college/give-access', icon: UserCheck },
        { label: 'Provisioning Jobs', path: '/college/provisioning', icon: Layers },
        { label: 'Student Entitlements', path: '/college/entitlements', icon: Award },
      ],
    },
    {
      group: 'COLLEGE OPERATIONS',
      items: [
        { label: 'College Staff', path: '/college/staff', icon: Users2 },
        { label: 'Assigned Services', path: '/college/services', icon: Sparkles },
        { label: 'Requests', path: '/college/requests', icon: FileQuestion },
      ],
    },
    {
      group: 'INFORMATION',
      items: [
        { label: 'MOU / Agreement', path: '/college/agreement', icon: FileCheck2 },
        { label: 'Billing & Payments', path: '/college/billing', icon: CreditCard },
        { label: 'Notifications', path: '/college/notifications', icon: Bell },
        { label: 'Reports', path: '/college/reports', icon: BarChart3 },
        { label: 'Announcements', path: '/college/announcements', icon: Megaphone },
        { label: 'Tasks & Deadlines', path: '/college/tasks', icon: CheckSquare },
        { label: 'Activity Log', path: '/college/activity', icon: Activity },
      ],
    },
    {
      group: 'SETTINGS',
      items: [
        { label: 'College Settings', path: '/college/settings', icon: Settings },
        { label: 'My Profile', path: '/college/profile', icon: User },
        { label: 'Support', path: '/college/support', icon: HelpCircle },
      ],
    },
  ];

  const handleNav = (itemPath: string) => {
    navigate(itemPath);
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="college-sidebar-backdrop"
          aria-hidden="true"
        />
      )}

      <aside
        className={`college-sidebar ${mobileOpen ? 'mobile-open' : ''} ${collapsed ? 'collapsed' : ''}`}
        style={{
          width: collapsed ? '72px' : '260px',
          minWidth: collapsed ? '72px' : '260px',
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          transition: 'width 0.2s ease, transform 0.25s ease',
          borderRight: '1px solid #1E293B',
          overflowX: 'hidden',
        }}
      >
        {/* Brand bar */}
        <div
          style={{
            height: '64px',
            padding: collapsed ? '0 12px' : '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            borderBottom: '1px solid #1E293B',
          }}
        >
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  color: 'white',
                  fontSize: '16px',
                  letterSpacing: '0.05em',
                }}
              >
                B
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 800, fontSize: '15px', color: '#FFFFFF', letterSpacing: '0.04em' }}>
                    BEXO
                  </span>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      color: '#60A5FA',
                      textTransform: 'uppercase',
                    }}
                  >
                    College
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                  {college?.name || 'Institutional'}
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              B
            </button>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            title="Collapse sidebar"
            className="desktop-collapse-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '6px',
              display: collapsed ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Mobile drawer close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="mobile-drawer-close-btn"
            aria-label="Close navigation menu"
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
          {sections.map((sec, sIdx) => (
            <div key={sIdx} style={{ marginBottom: '16px' }}>
              {!collapsed && (
                <div
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#64748B',
                    padding: '6px 12px',
                    textTransform: 'uppercase',
                  }}
                >
                  {sec.group}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {sec.items.map((item, iIdx) => {
                  const isActive = path === item.path || (item.path === '/college/dashboard' && path === '/college');
                  const Icon = item.icon;

                  return (
                    <button
                      key={iIdx}
                      onClick={() => handleNav(item.path)}
                      title={collapsed ? item.label : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: collapsed ? '10px 0' : '9px 12px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        borderRadius: '8px',
                        backgroundColor: isActive ? '#1E293B' : 'transparent',
                        color: isActive ? '#60A5FA' : '#94A3B8',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: isActive ? 700 : 500,
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.5)';
                          e.currentTarget.style.color = '#F1F5F9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#94A3B8';
                        }
                      }}
                    >
                      <Icon size={17} style={{ flexShrink: 0, color: isActive ? '#60A5FA' : '#64748B' }} />
                      {!collapsed && (
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info & collapse toggle */}
        <div
          style={{
            padding: collapsed ? '12px 6px' : '12px 16px',
            borderTop: '1px solid #1E293B',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            fontSize: '11px',
            color: '#64748B',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: collapsed ? 'center' : 'stretch',
          }}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid #334155',
                color: '#94A3B8',
                borderRadius: '6px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1E293B';
                e.currentTarget.style.color = '#F1F5F9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
                e.currentTarget.style.color = '#94A3B8';
              }}
            >
              <ChevronRight size={17} />
            </button>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontWeight: 600 }}>
                <Shield size={13} color="#10B981" />
                <span>Scope Isolated</span>
              </div>
              <div style={{ marginTop: '2px' }}>Only data for {college?.name || 'this college'} is accessible</div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
