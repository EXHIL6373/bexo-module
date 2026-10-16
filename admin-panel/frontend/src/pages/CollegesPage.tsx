import React, { useState, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useRouter } from '../router/Router';
import { College, CollegeStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { QuotaProgress } from '../components/common/QuotaProgress';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { QuotaAdjustModal } from '../components/colleges/QuotaAdjustModal';
import { CollegeOnboardingWizard } from '../components/colleges/CollegeOnboardingWizard';
import {
  Building2,
  Search,
  Filter,
  Plus,
  MoreVertical,
  ExternalLink,
  ShieldAlert,
  
  RotateCcw,
  Sliders,
  Users,
  Eye,
  FileText,
  Layers,
  MapPin,
  CheckCircle2,
  Ban,
} from 'lucide-react';

export const CollegesPage: React.FC = () => {
  const { colleges, suspendCollege, reactivateCollege, isCompanyScope } = useAdmin();
  const { navigate } = useRouter();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | CollegeStatus>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Modals state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedCollegeForQuota, setSelectedCollegeForQuota] = useState<College | null>(null);
  const [collegeToSuspend, setCollegeToSuspend] = useState<College | null>(null);
  const [collegeToReactivate, setCollegeToReactivate] = useState<College | null>(null);

  // Active three-dot action dropdown row ID
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filtered colleges
  const filteredColleges = useMemo(() => {
    return colleges.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchesType = typeFilter === 'All' || c.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [colleges, searchQuery, statusFilter, typeFilter]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <Building2 size={26} color="var(--bexo-blue-600)" />
            <span>Colleges Directory</span>
          </h1>
          <p>
            Manage and oversee all academic institutions connected to the BEXO platform ecosystem.
          </p>
        </div>

        {isCompanyScope && (
          <div className="page-actions-group">
            <button className="btn btn-primary" onClick={() => setIsOnboardingOpen(true)}>
              <Plus size={16} />
              <span>Add College</span>
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              width: '100%',
              maxWidth: '380px',
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search college name, code, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <Filter size={14} color="var(--text-muted)" />
            <span>Status:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12.5px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="All">All Statuses ({colleges.length})</option>
              <option value="Active">Active ({colleges.filter((c) => c.status === 'Active').length})</option>
              <option value="Pending">Pending ({colleges.filter((c) => c.status === 'Pending').length})</option>
              <option value="Suspended">Suspended ({colleges.filter((c) => c.status === 'Suspended').length})</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span>Type:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12.5px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Autonomous University">Autonomous University</option>
              <option value="Engineering">Engineering</option>
              <option value="Government Aided">Government Aided</option>
              <option value="Arts & Science">Arts & Science</option>
            </select>
          </div>
        </div>
      </div>

      {/* College Table Card */}
      <div className="card">
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>College / Code</th>
                <th>Location</th>
                <th>Students Enrolled</th>
                <th style={{ minWidth: '160px' }}>Quota Capacity</th>
                <th>Enabled Services</th>
                <th>MOU Status</th>
                <th>Status</th>
                <th>Last Activity</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredColleges.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                    <Building2 size={32} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>No colleges found</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Try adjusting your search query or status filter.</div>
                  </td>
                </tr>
              ) : (
                filteredColleges.map((col) => {
                  const quotaPct = col.quota.allocated > 0 ? Math.round((col.quota.used / col.quota.allocated) * 100) : 0;
                  const activeServicesCount = col.services.filter((s) => s.isEnabled).length;

                  return (
                    <tr key={col.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              backgroundColor: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              color: 'var(--bexo-blue-600)',
                              fontSize: '11px',
                            }}
                          >
                            {col.code.slice(0, 4)}
                          </div>
                          <div>
                            <div
                              style={{ fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                              onClick={() => navigate(`/admin/colleges/${col.id}`)}
                              className="hover-underline"
                            >
                              {col.name}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                              Code: <strong>{col.code}</strong> • {col.type}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px' }}>
                          <MapPin size={13} color="var(--text-muted)" />
                          <span>{col.city}, {col.state}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700 }}>
                          {col.totalStudents.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '11px', color: col.activeStudents > 0 ? 'var(--color-success)' : 'var(--text-muted)' }}>
                          {col.activeStudents.toLocaleString()} active
                        </div>
                      </td>

                      <td>
                        <QuotaProgress
                          allocated={col.quota.allocated}
                          used={col.quota.used}
                          warningThreshold={col.quota.warningThreshold}
                          criticalThreshold={col.quota.criticalThreshold}
                        />
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '180px' }}>
                          {col.services.filter((s) => s.isEnabled).slice(0, 2).map((s) => (
                            <span key={s.serviceId} className="status-badge service" style={{ fontSize: '10px', padding: '1px 6px' }}>
                              {s.name.replace('BEXO ', '')}
                            </span>
                          ))}
                          {activeServicesCount > 2 && (
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                              +{activeServicesCount - 2}
                            </span>
                          )}
                          {activeServicesCount === 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>None Active</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <StatusBadge status={col.agreement.status} size="sm" />
                      </td>

                      <td>
                        <StatusBadge status={col.status} size="sm" />
                      </td>

                      <td style={{ fontSize: '11.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(col.lastActivityAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>

                      <td style={{ textAlign: 'right', position: 'relative' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11.5px' }}
                            onClick={() => navigate(`/admin/colleges/${col.id}`)}
                            title="Open 360° Profile"
                          >
                            <Eye size={13} />
                            <span>Inspect</span>
                          </button>

                          <button
                            className="icon-btn"
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => setActiveMenuId(activeMenuId === col.id ? null : col.id)}
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>

                        {/* Three-dot Context Menu */}
                        {activeMenuId === col.id && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              right: '18px',
                              backgroundColor: 'white',
                              border: '1px solid var(--border-light)',
                              borderRadius: 'var(--radius-md)',
                              boxShadow: 'var(--shadow-xl)',
                              zIndex: 50,
                              width: '190px',
                              padding: '6px',
                              textAlign: 'left',
                            }}
                            onMouseLeave={() => setActiveMenuId(null)}
                          >
                            <button
                              onClick={() => {
                                navigate(`/admin/colleges/${col.id}`);
                                setActiveMenuId(null);
                              }}
                              style={{ width: '100%', padding: '7px 10px', fontSize: '12px', textAlign: 'left', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                              <Eye size={13} color="var(--bexo-blue-600)" />
                              <span>View 360° Profile</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedCollegeForQuota(col);
                                setActiveMenuId(null);
                              }}
                              style={{ width: '100%', padding: '7px 10px', fontSize: '12px', textAlign: 'left', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                              <Sliders size={13} color="var(--text-muted)" />
                              <span>Adjust Quota</span>
                            </button>

                            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

                            {col.status === 'Active' ? (
                              <button
                                onClick={() => {
                                  setCollegeToSuspend(col);
                                  setActiveMenuId(null);
                                }}
                                style={{ width: '100%', padding: '7px 10px', fontSize: '12px', textAlign: 'left', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}
                              >
                                <Ban size={13} color="var(--color-danger)" />
                                <span>Suspend College</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setCollegeToReactivate(col);
                                  setActiveMenuId(null);
                                }}
                                style={{ width: '100%', padding: '7px 10px', fontSize: '12px', textAlign: 'left', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)' }}
                              >
                                <RotateCcw size={13} color="var(--color-success)" />
                                <span>Reactivate College</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboarding Wizard Modal */}
      <CollegeOnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* Adjust Quota Modal */}
      {selectedCollegeForQuota && (
        <QuotaAdjustModal
          college={selectedCollegeForQuota}
          isOpen={true}
          onClose={() => setSelectedCollegeForQuota(null)}
        />
      )}

      {/* Suspend College Confirmation Modal */}
      {collegeToSuspend && (
        <ConfirmationModal
          isOpen={true}
          title={`Suspend College — ${collegeToSuspend.name}?`}
          description={`Suspending ${collegeToSuspend.name} (${collegeToSuspend.code}) will immediately halt institutional operations according to platform governance policies.`}
          impactItems={[
            'All college services will become inactive immediately',
            'New provisioning batches and student access creation will be blocked',
            'Existing student accounts, ATS resumes, and historical data remain strictly preserved',
            'College staff dashboard access is temporarily restricted',
            'An immutable audit log and company-wide alert will be generated',
          ]}
          requireReason={true}
          reasonLabel="Mandatory Suspension Justification"
          reasonPlaceholder="Specify commercial default, policy violation, or regulatory directive..."
          confirmLabel="Confirm & Suspend College"
          confirmVariant="danger"
          onConfirm={(reason) => {
            suspendCollege(collegeToSuspend.id, reason);
            setCollegeToSuspend(null);
          }}
          onClose={() => setCollegeToSuspend(null)}
        />
      )}

      {/* Reactivate College Confirmation Modal */}
      {collegeToReactivate && (
        <ConfirmationModal
          isOpen={true}
          title={`Reactivate College — ${collegeToReactivate.name}?`}
          description={`Reactivating ${collegeToReactivate.name} will restore operational eligibility and reinstate student service entitlements.`}
          impactItems={[
            'Approved platform services will be re-enabled',
            'Student access permissions will be restored to Active status',
            'College dashboard access will be re-opened for authorized coordinators',
            'Compliance restoration audit record will be logged',
          ]}
          requireReason={false}
          confirmLabel="Confirm Reactivation"
          confirmVariant="warning"
          onConfirm={(reason) => {
            reactivateCollege(collegeToReactivate.id, reason || 'Compliance restored');
            setCollegeToReactivate(null);
          }}
          onClose={() => setCollegeToReactivate(null)}
        />
      )}
    </div>
  );
};
