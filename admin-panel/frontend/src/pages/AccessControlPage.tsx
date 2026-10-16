import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { useRouter } from '../router/Router';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  KeyRound,
  Shield,
  ShieldAlert,
  Building,
  GraduationCap,
  Layers,
  Lock,
  Unlock,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const AccessControlPage: React.FC = () => {
  const { colleges, isCompanyScope } = useAdmin();
  const { navigate } = useRouter();

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <KeyRound size={26} color="var(--bexo-blue-600)" />
            <span>Access Control Center</span>
          </h1>
          <p>
            Enforce institutional boundary restrictions, role-based scope limitations, and student seat ceilings.
          </p>
        </div>
      </div>

      {/* Governance Principles Card */}
      <div
        className="card"
        style={{
          padding: '18px 22px',
          marginBottom: '24px',
          backgroundColor: '#F8FAFC',
          borderLeft: '4px solid var(--bexo-blue-600)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Shield size={22} color="var(--bexo-blue-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--text-primary)' }}>
              BEXO Multi-Tenant Scope Isolation & Central Admin Access Rule
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              The BEXO Central Admin Panel is restricted exclusively to <strong>Super Admins (Kavinbalaji S K, Ezhilarasan M.)</strong> and <strong>Platform Admins</strong>. College administrators and staff are strictly restricted to their institutional portal at <code>app.bexo.in/college</code> and are barred from accessing this Central Admin Panel under Zero-Trust RBAC security.
            </p>
          </div>
        </div>
      </div>

      {/* Scope Matrices */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <span className="card-title">College Scope Access Status</span>
        </div>
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>College</th>
                <th>Dashboard Access</th>
                <th>Seat Ceiling</th>
                <th>Service Access</th>
                <th>Department Limits</th>
                <th>Enforcement State</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {colleges.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Code: {c.code}</div>
                  </td>
                  <td>
                    {c.dashboardAccess ? (
                      <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Unlock size={13} /> Granted
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-danger)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={13} /> Locked
                      </span>
                    )}
                  </td>
                  <td>
                    <div><strong>{c.quota.allocated.toLocaleString()}</strong> Seats</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.quota.used.toLocaleString()} Enrolled</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>
                      {c.services.filter((s) => s.isEnabled).length} of {c.services.length} Permitted
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {c.quota.departmentLimits ? `${Object.keys(c.quota.departmentLimits).length} Managed Departments` : 'General Pool'}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={c.status} size="sm" />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11.5px', padding: '4px 10px' }}
                      onClick={() => navigate(`/admin/colleges/${c.id}`)}
                    >
                      <Sliders size={13} /> Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
