import React, { useState } from 'react';
import { useRouter } from '../../router/Router';
import { useAdmin } from '../../context/AdminContext';
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Cpu,
  Layers,
  KeyRound,
  Users2,
  CheckSquare,
  GitPullRequest,
  FileCheck2,
  CreditCard,
  BarChart3,
  Bell,
  ShieldCheck,
  Activity,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building,
  UserCheck,
  LayoutTemplate,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (m: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { path, navigate } = useRouter();
  const {
    currentUser,
    unreadNotificationCount,
    approvals,
    setIsSearchOpen,
    setCurrentUser,
    staffUsers,
    canAccessAdminPanel,
    logout,
  } = useAdmin();

  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'Pending').length;

  const isRoleAuthorized = (minRole: 'company' | 'college') => {
    if (!canAccessAdminPanel) return false;
    if (minRole === 'company') {
      return ['super_admin', 'admin'].includes(currentUser.role) && !currentUser.collegeId;
    }
    return true;
  };

  const navItems = [
    {
      section: 'OPERATIONS',
      items: [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, requiredScope: 'all' },
        { label: 'Colleges', path: '/admin/colleges', icon: Building2, requiredScope: 'company' },
        { label: 'Students', path: '/admin/students', icon: GraduationCap, requiredScope: 'all' },
        { label: 'Provisioning', path: '/admin/provisioning', icon: Cpu, requiredScope: 'all' },
        { label: 'Platform Services', path: '/admin/services', icon: Layers, requiredScope: 'all' },
      ],
    },
    {
      section: 'GOVERNANCE & WORKFLOWS',
      items: [
        {
          label: 'Approval Center',
          path: '/admin/approvals',
          icon: CheckSquare,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
          requiredScope: 'company',
        },
        { label: 'Requests Ledger', path: '/admin/requests', icon: GitPullRequest, requiredScope: 'all' },
        { label: 'Access Control', path: '/admin/access-control', icon: KeyRound, requiredScope: 'company' },
        { label: 'Users & Roles', path: '/admin/users', icon: Users2, requiredScope: 'company' },
      ],
    },
    {
      section: 'COMMERCIAL & ECOSYSTEM',
      items: [
        { label: 'App Templates', path: '/admin/templates', icon: LayoutTemplate, requiredScope: 'all' },
        { label: 'Agreements & MOUs', path: '/admin/agreements', icon: FileCheck2, requiredScope: 'all' },
        { label: 'Payments & Billing', path: '/admin/payments', icon: CreditCard, requiredScope: 'company' },
        { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3, requiredScope: 'all' },
      ],
    },
    {
      section: 'SYSTEM & CONFIGURATION',
      items: [
        { label: 'Audit & Security', path: '/admin/audit', icon: ShieldCheck, requiredScope: 'company' },
        { label: 'System Health', path: '/admin/system-health', icon: Activity, requiredScope: 'company' },
        {
          label: 'Notifications',
          path: '/admin/notifications',
          icon: Bell,
          badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined,
          requiredScope: 'all',
        },
        { label: 'Settings', path: '/admin/settings', icon: Settings, requiredScope: 'all' },
      ],
    },
  ];

  const handleNavClick = (item: { path?: string; action?: () => void }) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
    setMobileOpen(false);
  };

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        {!collapsed ? (
          <div className="brand-logo-wrap">
            <div className="brand-icon-box">
              <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.05em' }}>B</span>
            </div>
            <div className="brand-text-col">
              <span className="brand-title">
                BEXO <span className="brand-badge">ADMIN</span>
              </span>
              <span className="brand-sub">Central Control Center</span>
            </div>
          </div>
        ) : (
          <div className="brand-icon-box" style={{ margin: '0 auto' }}>
            <span style={{ fontWeight: 800, fontSize: '18px' }}>B</span>
          </div>
        )}

        <button
          className="sidebar-collapse-btn desktop-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <button
          className="mobile-drawer-close-btn"
          onClick={() => setMobileOpen(false)}
          title="Close Navigation"
          aria-label="Close Navigation"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Navigation */}
      <div className="sidebar-nav-scroll">
        {navItems.map((sec, secIdx) => {
          // Filter items by role/scope
          const allowedItems = sec.items.filter((item) => {
            if (item.requiredScope === 'company') {
              return isRoleAuthorized('company');
            }
            return true;
          });

          if (allowedItems.length === 0) return null;

          return (
            <div key={secIdx}>
              {!collapsed && <div className="nav-section-title">{sec.section}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {allowedItems.map((item, itemIdx) => {
                  const isActive = item.path ? path === item.path || (item.path !== '/admin' && path.startsWith(item.path)) : false;
                  const Icon = item.icon;

                  return (
                    <button
                      key={itemIdx}
                      className={`nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavClick(item)}
                      title={collapsed ? item.label : undefined}
                      style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px 0' : '9px 12px' }}
                    >
                      <Icon size={18} style={{ flexShrink: 0 }} />
                      {!collapsed && <span>{item.label}</span>}
                      {!collapsed && 'badge' in item && item.badge !== undefined && (
                        <span className="nav-link-badge">{item.badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sign Out Button */}
      <div style={{ padding: collapsed ? '6px 4px' : '6px 12px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          className="nav-link"
          onClick={() => logout()}
          title={collapsed ? 'Sign Out' : undefined}
          style={{
            width: '100%',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px 0' : '9px 12px',
            color: '#EF4444',
          }}
        >
          <LogOut size={18} style={{ flexShrink: 0, color: '#EF4444' }} />
          {!collapsed && <span style={{ color: '#EF4444' }}>Sign Out</span>}
        </button>
      </div>

      {/* Footer System Status & Version */}
      <div className="sidebar-footer">
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>BEXO Engine Online</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>v2.4</span>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} title="BEXO Engine Online (v2.4)" />
          </div>
        )}
      </div>
    </aside>
  );
};
