import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { useRouter } from '../router/Router';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Layers,
  Building,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const { services, colleges, toggleGlobalService, isCompanyScope } = useAdmin();
  const { navigate } = useRouter();

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <Layers size={26} color="var(--bexo-blue-600)" />
            <span>Platform Services & Entitlements Catalog</span>
          </h1>
          <p>
            Centrally govern digital identity, career tools, and institutional features enabled for partner colleges.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {services.map((srv) => {
          // Count colleges having this service active
          const activeCollegeCount = colleges.filter(
            (c) => c.status === 'Active' && c.services.some((s) => s.serviceId === srv.id && s.isEnabled)
          ).length;

          return (
            <div key={srv.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div className="card-header">
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {srv.category}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {srv.name}
                  </div>
                </div>
                <StatusBadge status={srv.isGlobalActive ? 'Active' : 'Disabled'} size="sm" />
              </div>

              <div className="card-body" style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                  {srv.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>COLLEGE ADOPTION</div>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {activeCollegeCount} / {colleges.length}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>STUDENT ENROLLMENT</div>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--bexo-blue-600)', marginTop: '2px' }}>
                      {srv.totalStudentsEnrolled.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Service Code: <code>{srv.code}</code>
                </div>
              </div>

              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-surface-subtle)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Institutional Entitlement
                </span>

                {isCompanyScope ? (
                  <button
                    className={`btn btn-sm ${srv.isGlobalActive ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => toggleGlobalService(srv.id)}
                  >
                    {srv.isGlobalActive ? 'Deactivate Globally' : 'Activate Service'}
                  </button>
                ) : (
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Locked by HQ Policy
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* College Service Matrix */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">College-by-College Service Entitlement Matrix</span>
        </div>
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>College</th>
                <th>Status</th>
                <th>BEXO Portfolio</th>
                <th>BEXO Templates</th>
                <th>ATS Resume Engine</th>
                <th>Placement Suite</th>
                <th>NFC Smart Card</th>
              </tr>
            </thead>
            <tbody>
              {colleges.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate(`/admin/colleges/${c.id}`)}>
                      {c.name} ({c.code})
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={c.status} size="sm" />
                  </td>
                  {['srv-1', 'srv-2', 'srv-3', 'srv-4', 'srv-5'].map((srvId) => {
                    const match = c.services.find((s) => s.serviceId === srvId);
                    const isLive = match?.isEnabled && c.status === 'Active';

                    return (
                      <td key={srvId}>
                        {isLive ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontWeight: 700, fontSize: '12px' }}>
                            <CheckCircle2 size={14} /> Entitled
                          </span>
                        ) : (
                          <span style={{ color: '#CBD5E1', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
