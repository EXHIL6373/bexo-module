import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useRouter } from '../router/Router';
import { StatusBadge } from '../components/common/StatusBadge';
import { QuotaProgress } from '../components/common/QuotaProgress';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { QuotaAdjustModal } from '../components/colleges/QuotaAdjustModal';
import { AddStaffModal } from '../components/colleges/AddStaffModal';
import { AddCollegeAdminModal } from '../components/colleges/AddCollegeAdminModal';
import { Role, StaffUser } from '../types';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Layers,
  GraduationCap,
  Users,
  BarChart3,
  FileText,
  Cpu,
  GitPullRequest,
  CreditCard,
  Activity,
  Sliders,
  Ban,
  RotateCcw,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Download,
  ShieldCheck,
  UserPlus,
  Play,
  Copy,
  Check,
  MoreVertical,
  Key,
  Lock,
  RefreshCw,
  Send,
  Shield,
} from 'lucide-react';

export const CollegeDetailPage: React.FC = () => {
  const { params, queryParams, navigate } = useRouter();
  const collegeId = params.id;

  const {
    getCollegeById,
    students,
    staffUsers,
    provisioningJobs,
    approvals,
    payments,
    auditLogs,
    quotaHistory,
    suspendCollege,
    reactivateCollege,
    toggleCollegeService,
    revokeStudentAccess,
    reactivateStudentAccess,
    triggerProvisioningBatch,
    invitations,
    outboxEmails,
    resendInvitation,
    revokeInvitation,
    suspendCollegeStaff,
    activateCollegeStaff,
    changeStaffRole,
    requestPasswordReset,
    setActiveEmailForPreview,
  } = useAdmin();

  const college = getCollegeById(collegeId);

  // Tab State
  const activeTab = queryParams.get('tab') || 'overview';
  const setActiveTab = (tab: string) => {
    navigate(`/admin/colleges/${collegeId}?tab=${tab}`);
  };

  // Modals
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [selectedStudentToRevoke, setSelectedStudentToRevoke] = useState<string | null>(null);

  // Staff Management State
  const [activeStaffMenuId, setActiveStaffMenuId] = useState<string | null>(null);
  const [staffForRoleChange, setStaffForRoleChange] = useState<StaffUser | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<Role>('college_admin');
  const [copiedStaffTokenId, setCopiedStaffTokenId] = useState<string | null>(null);

  if (!college) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Building2 size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>College Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>The specified institution record does not exist or has been removed.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/colleges')}>
          <ArrowLeft size={16} /> Back to Colleges Directory
        </button>
      </div>
    );
  }

  // Scoped Data
  const collegeStudents = students.filter((s) => s.collegeId === college.id);
  const collegeStaff = staffUsers.filter((u) => u.collegeId === college.id);
  const collegeJobs = provisioningJobs.filter((j) => j.collegeId === college.id);
  const collegeApprovals = approvals.filter((a) => a.collegeId === college.id);
  const collegePayments = payments.filter((p) => p.collegeId === college.id);
  const collegeAudit = auditLogs.filter((a) => a.entityId === college.id || a.entityName?.includes(college.code));
  const collegeQuotaHistory = quotaHistory.filter((q) => q.collegeId === college.id);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Building2 },
    { key: 'students', label: `Students (${collegeStudents.length})`, icon: GraduationCap },
    { key: 'staff', label: `Staff (${collegeStaff.length})`, icon: Users },
    { key: 'services', label: `Services (${college.services.length})`, icon: Layers },
    { key: 'quota', label: 'Quota & Limits', icon: BarChart3 },
    { key: 'agreement', label: 'MOU & Legal', icon: FileText },
    { key: 'provisioning', label: `Provisioning (${collegeJobs.length})`, icon: Cpu },
    { key: 'requests', label: `Requests (${collegeApprovals.length})`, icon: GitPullRequest },
    { key: 'payments', label: `Billing (${collegePayments.length})`, icon: CreditCard },
    { key: 'activity', label: 'Audit Trail', icon: Activity },
  ];

  return (
    <div>
      {/* Back Link */}
      <div style={{ marginBottom: '14px' }}>
        <button
          onClick={() => navigate('/admin/colleges')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}
        >
          <ArrowLeft size={14} /> Back to Colleges Directory
        </button>
      </div>

      {/* College 360° Header Banner */}
      <div
        className="card"
        style={{
          marginBottom: '22px',
          padding: '24px 28px',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: '1px solid var(--border-light)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '12px',
                backgroundColor: 'var(--bexo-navy-900)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 800,
                boxShadow: '0 4px 10px rgba(11, 21, 43, 0.25)',
              }}
            >
              {college.code.slice(0, 4)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {college.name}
                </h1>
                <StatusBadge status={college.status} size="md" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '12.5px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={14} /> Code: <strong>{college.code}</strong>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} /> {college.city}, {college.state}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> Est. {college.establishedYear} • {college.type}
                </span>
                <span>Affiliation: {college.affiliation}</span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsQuotaModalOpen(true)}>
              <Sliders size={14} /> Adjust Quota
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsAddStaffOpen(true)}>
              <UserPlus size={14} /> Add Staff
            </button>

            {college.status === 'Active' ? (
              <button className="btn btn-danger btn-sm" onClick={() => setIsSuspendModalOpen(true)}>
                <Ban size={14} /> Suspend College
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: 'var(--color-success)' }}
                onClick={() => setIsReactivateModalOpen(true)}
              >
                <RotateCcw size={14} /> Reactivate College
              </button>
            )}
          </div>
        </div>

        {/* Suspension Banner if Suspended */}
        {college.status === 'Suspended' && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-danger)',
              border: '1px solid var(--border-danger)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--color-danger)',
              fontSize: '13px',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>College Operation Suspended:</strong> {college.suspensionReason || 'Access locked by administrative mandate.'}
              <div style={{ fontSize: '11.5px', marginTop: '2px', color: '#991B1B' }}>
                Platform services and new student provisioning are disabled. Historical student profiles and resumes remain fully preserved.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation Bar */}
      <div className="tabs-nav-bar">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isAct = activeTab === t.key;
          return (
            <button
              key={t.key}
              className={`tab-nav-item ${isAct ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              <Icon size={15} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Top Quick Metrics */}
          <div className="stat-grid-4">
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>ENROLLED STUDENTS</div>
              <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>{college.totalStudents.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '2px' }}>
                {college.activeStudents.toLocaleString()} Active Entitlements
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>QUOTA USAGE</div>
              <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
                {Math.round((college.quota.used / college.quota.allocated) * 100)}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {college.quota.used.toLocaleString()} / {college.quota.allocated.toLocaleString()} seats
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>AGREEMENT VALIDITY</div>
              <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '8px' }}>
                <StatusBadge status={college.agreement.status} size="md" />
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Valid till {college.agreement.endDate}
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>PORTAL ACCESS</div>
              <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '8px', color: college.dashboardAccess ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {college.dashboardAccess ? 'Enabled' : 'Disabled'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {collegeStaff.length} Authorized Staff Users
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '22px' }}>
            {/* Primary Contacts & Admin Card */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Institutional Leadership & Contacts</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Primary Institutional Authority
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>{college.primaryContact.name}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{college.primaryContact.designation}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {college.primaryContact.email} • {college.primaryContact.mobile}
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Designated College Administrator
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>{college.adminContact.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {college.adminContact.email} • {college.adminContact.mobile}
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Campus Location
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '2px' }}>{college.address}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {college.city}, {college.district}, {college.state} — {college.pincode}
                  </div>
                </div>
              </div>
            </div>

            {/* Quota Progress & Services Summary */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Quota Capacity & Service Scope</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setIsQuotaModalOpen(true)}>
                  Adjust
                </button>
              </div>
              <div className="card-body">
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>Seat Utilization</span>
                    <span><strong>{college.quota.used.toLocaleString()}</strong> of {college.quota.allocated.toLocaleString()} Seats</span>
                  </div>
                  <QuotaProgress
                    allocated={college.quota.allocated}
                    used={college.quota.used}
                    warningThreshold={college.quota.warningThreshold}
                    criticalThreshold={college.quota.criticalThreshold}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    <span>Warning Cap: {college.quota.warningThreshold}%</span>
                    <span>Remaining: {(college.quota.allocated - college.quota.used).toLocaleString()} seats</span>
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '16px 0' }} />

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Activated Services
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {college.services.map((srv) => (
                      <div
                        key={srv.serviceId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-surface-subtle)',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{srv.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {srv.studentsUsing.toLocaleString()} students entitled • Plan: {srv.planLevel || 'Enterprise'}
                          </div>
                        </div>
                        <StatusBadge status={srv.isEnabled ? 'Active' : 'Suspended'} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS */}
      {activeTab === 'students' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <GraduationCap size={18} color="var(--bexo-blue-600)" />
              <span>Enrolled Students — {college.name}</span>
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => triggerProvisioningBatch(college.id, 'Roll Number Range')}
            >
              <Plus size={14} /> Provision Students Batch
            </button>
          </div>
          <div className="table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Department</th>
                  <th>Official Email</th>
                  <th>Entitlement Status</th>
                  <th>Services</th>
                  <th>Resumes</th>
                  <th>Portfolio</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {collegeStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px' }}>
                      <GraduationCap size={32} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontWeight: 700 }}>No students provisioned yet for {college.code}</div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Trigger a bulk range provisioning job to grant student access.
                      </p>
                    </td>
                  </tr>
                ) : (
                  collegeStudents.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.rollNumber}</strong>
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.department}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{s.email}</td>
                      <td>
                        <StatusBadge status={s.accessStatus} size="sm" />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {s.services.map((srv, idx) => (
                            <span key={idx} className="status-badge service" style={{ fontSize: '10px', padding: '1px 5px' }}>
                              {srv.replace('BEXO ', '')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{s.resumeCount}</td>
                      <td>
                        {s.portfolioSubdomain ? (
                          <span style={{ fontSize: '11.5px', color: 'var(--bexo-blue-600)' }}>
                            {s.portfolioSubdomain}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {s.accessStatus === 'Active' ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--color-danger)', fontSize: '11px', padding: '3px 8px' }}
                            onClick={() => setSelectedStudentToRevoke(s.id)}
                          >
                            Revoke Access
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--color-success)', fontSize: '11px', padding: '3px 8px' }}
                            onClick={() => reactivateStudentAccess(s.id)}
                          >
                            Restore Access
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STAFF & ACCESS GOVERNANCE */}
      {activeTab === 'staff' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Staff KPI Cards */}
          <div className="stat-grid-4">
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL AUTHORIZED PERSONNEL</div>
              <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>{collegeStaff.length}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Governing {college.name}
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>COLLEGE ADMINISTRATORS</div>
              <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: '#1D4ED8' }}>
                {collegeStaff.filter((u) => u.role === 'college_admin').length}
              </div>
              <div style={{ fontSize: '11.5px', color: '#2563EB', marginTop: '2px' }}>
                Full institutional authority
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>PENDING INVITATIONS</div>
              <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: '#D97706' }}>
                {collegeStaff.filter((u) => u.accountStatus === 'INVITED').length}
              </div>
              <div style={{ fontSize: '11.5px', color: '#B45309', marginTop: '2px' }}>
                Awaiting user password setup
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE ACCOUNTS</div>
              <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: '#059669' }}>
                {collegeStaff.filter((u) => u.accountStatus === 'ACTIVE' || (!u.accountStatus && u.isActive)).length}
              </div>
              <div style={{ fontSize: '11.5px', color: '#047857', marginTop: '2px' }}>
                Operating within campus scope
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="var(--bexo-blue-600)" />
                  <span>Authorized Institutional Personnel & Access Controls</span>
                </span>
                <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Manage institutional credentials, invitation delivery, single-use tokens, and account suspension policies.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setIsAddStaffOpen(true)}>
                  <UserPlus size={14} /> Add Staff
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsAddAdminModalOpen(true)}
                  style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
                >
                  <Shield size={14} /> + Add College Admin
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Staff Name & Title</th>
                    <th>Official Email</th>
                    <th>Institutional Role</th>
                    <th>Account Status</th>
                    <th>Invitation Lifecycle</th>
                    <th>Last Login</th>
                    <th style={{ textAlign: 'right' }}>Access Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collegeStaff.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <Users size={32} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>No Institutional Staff Configured</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                          Authorize the primary College Administrator to enable institutional access.
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ marginTop: '14px' }}
                          onClick={() => setIsAddAdminModalOpen(true)}
                        >
                          <Shield size={14} /> + Add College Admin
                        </button>
                      </td>
                    </tr>
                  ) : (
                    collegeStaff.map((u) => {
                      const invite = invitations.find(
                        (i) => i.id === u.invitationId || i.email.toLowerCase() === u.email.toLowerCase()
                      );
                      const outboxItem = outboxEmails.find((e) => e.to.toLowerCase() === u.email.toLowerCase());
                      const accountStatus = u.accountStatus || (u.isActive ? 'ACTIVE' : 'SUSPENDED');

                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  backgroundColor: u.role === 'college_admin' ? '#EFF6FF' : '#F1F5F9',
                                  border: u.role === 'college_admin' ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: u.role === 'college_admin' ? 'var(--bexo-blue-600)' : 'var(--text-secondary)',
                                  fontWeight: 800,
                                  fontSize: '12px',
                                }}
                              >
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  {u.designation || u.department || 'Institutional Operations'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{u.email}</div>
                            {u.phone && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.phone}</div>}
                          </td>

                          <td>
                            <span
                              className="status-badge"
                              style={{
                                backgroundColor: u.role === 'college_admin' ? '#EFF6FF' : '#F8FAFC',
                                color: u.role === 'college_admin' ? '#1D4ED8' : '#334155',
                                border: u.role === 'college_admin' ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                                fontWeight: 700,
                                fontSize: '11px',
                                padding: '3px 8px',
                              }}
                            >
                              {u.role === 'college_admin' && '👑 '}
                              {u.role.toUpperCase().replace('_', ' ')}
                            </span>
                          </td>

                          <td>
                            {accountStatus === 'ACTIVE' && (
                              <span className="status-badge success" style={{ fontSize: '11px', padding: '3px 8px' }}>
                                ACTIVE
                              </span>
                            )}
                            {accountStatus === 'INVITED' && (
                              <span className="status-badge warning" style={{ fontSize: '11px', padding: '3px 8px' }}>
                                INVITED
                              </span>
                            )}
                            {accountStatus === 'SUSPENDED' && (
                              <span className="status-badge danger" style={{ fontSize: '11px', padding: '3px 8px' }}>
                                SUSPENDED
                              </span>
                            )}
                            {accountStatus === 'REVOKED' && (
                              <span className="status-badge danger" style={{ fontSize: '11px', padding: '3px 8px' }}>
                                REVOKED
                              </span>
                            )}
                            {accountStatus === 'EXPIRED' && (
                              <span className="status-badge" style={{ fontSize: '11px', padding: '3px 8px', background: '#F1F5F9', color: '#64748B' }}>
                                EXPIRED
                              </span>
                            )}
                          </td>

                          <td>
                            {invite ? (
                              <div style={{ fontSize: '11.5px', lineHeight: 1.4 }}>
                                {invite.status === 'INVITED' && (
                                  <div>
                                    <span style={{ color: '#D97706', fontWeight: 600 }}>Pending Activation</span>
                                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                                      Expires: {new Date(invite.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </div>
                                  </div>
                                )}
                                {invite.status === 'ACTIVE' && (
                                  <div>
                                    <span style={{ color: '#059669', fontWeight: 600 }}>Accepted & Live</span>
                                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                                      {invite.acceptedAt ? new Date(invite.acceptedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Verified'}
                                    </div>
                                  </div>
                                )}
                                {invite.status === 'REVOKED' && (
                                  <span style={{ color: '#DC2626', fontWeight: 600 }}>Token Revoked</span>
                                )}
                              </div>
                            ) : (
                              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                Direct Provisioned
                              </div>
                            )}
                          </td>

                          <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never Logged In'}
                          </td>

                          <td style={{ textAlign: 'right', position: 'relative' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {accountStatus === 'INVITED' && invite && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    const fullUrl = `${window.location.origin}${window.location.pathname}#/activate-account?token=${invite.token}`;
                                    navigator.clipboard.writeText(fullUrl);
                                    setCopiedStaffTokenId(u.id);
                                    setTimeout(() => setCopiedStaffTokenId(null), 2500);
                                  }}
                                  title="Copy Single-Use Activation Link"
                                  style={{ padding: '4px 8px', fontSize: '11.5px' }}
                                >
                                  {copiedStaffTokenId === u.id ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                                  <span>{copiedStaffTokenId === u.id ? 'Copied' : 'Link'}</span>
                                </button>
                              )}

                              {outboxItem && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setActiveEmailForPreview(outboxItem)}
                                  title="Inspect Dispatched Email"
                                  style={{ padding: '4px 8px', fontSize: '11.5px' }}
                                >
                                  <Mail size={13} />
                                  <span>Email</span>
                                </button>
                              )}

                              <button
                                className="icon-btn"
                                style={{ width: '28px', height: '28px' }}
                                onClick={() => setActiveStaffMenuId(activeStaffMenuId === u.id ? null : u.id)}
                              >
                                <MoreVertical size={14} />
                              </button>
                            </div>

                            {/* Dropdown Action Menu */}
                            {activeStaffMenuId === u.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '100%',
                                  right: '12px',
                                  backgroundColor: 'white',
                                  border: '1px solid var(--border-light)',
                                  borderRadius: 'var(--radius-md)',
                                  boxShadow: 'var(--shadow-xl)',
                                  zIndex: 60,
                                  width: '210px',
                                  padding: '6px',
                                  textAlign: 'left',
                                }}
                                onMouseLeave={() => setActiveStaffMenuId(null)}
                              >
                                {accountStatus === 'INVITED' && invite && (
                                  <>
                                    <button
                                      onClick={() => {
                                        resendInvitation(invite.id);
                                        setActiveStaffMenuId(null);
                                      }}
                                      style={{ width: '100%', padding: '7px 10px', fontSize: '12px', textAlign: 'left', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                      <RefreshCw size={13} color="var(--bexo-blue-600)" />
                                      <span>Resend Invitation</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        revokeInvitation(invite.id, 'Revoked from admin staff console');
                                        setActiveStaffMenuId(null);
                                      }}
                                      style={{ width: '100%', padding: '7px 10px', fontSize: '12px', textAlign: 'left', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}
                                    >
                                      <Ban size={13} color="var(--color-danger)" />
                                      <span>Revoke Invitation</span>
                                    </button>

                                    <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />
                                  </>
                                )}

                                <button
                                  onClick={() => {
                                    setStaffForRoleChange(u);
                                    setNewSelectedRole(u.role);
                                    setActiveStaffMenuId(null);
                                  }}
                                  style={{ width: '100%', padding: '7px 10px', fontSize: '12px', textAlign: 'left', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                  <Shield size={13} color="#D97706" />
                                  <span>Change Role</span>
                                </button>

                                <button
                                  onClick={() => {
                                    requestPasswordReset(u.email);
                                    setActiveStaffMenuId(null);
                                  }}
                                  style={{ width: '100%', padding: '7px 10px', fontSize: '12px', textAlign: 'left', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                  <Key size={13} color="var(--text-secondary)" />
                                  <span>Send Password Reset</span>
                                </button>

                                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

                                {accountStatus === 'ACTIVE' ? (
                                  <button
                                    onClick={() => {
                                      suspendCollegeStaff(u.id, 'Suspended by administrative mandate');
                                      setActiveStaffMenuId(null);
                                    }}
                                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px', textAlign: 'left', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}
                                  >
                                    <Lock size={13} color="var(--color-danger)" />
                                    <span>Suspend Staff Access</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      activateCollegeStaff(u.id);
                                      setActiveStaffMenuId(null);
                                    }}
                                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px', textAlign: 'left', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)' }}
                                  >
                                    <CheckCircle2 size={13} color="var(--color-success)" />
                                    <span>Activate Staff Access</span>
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
        </div>
      )}

      {/* TAB 4: SERVICES */}
      {activeTab === 'services' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Institutional Platform Services</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {college.services.map((s) => (
                <div
                  key={s.serviceId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: s.isEnabled ? 'white' : '#F8FAFC',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px' }}>{s.name}</span>
                      <StatusBadge status={s.isEnabled ? 'Active' : 'Disabled'} size="sm" />
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Entitled to {s.studentsUsing.toLocaleString()} active students • Activated: {s.activatedAt}
                    </div>
                  </div>

                  <div>
                    <button
                      className={`btn btn-sm ${s.isEnabled ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => toggleCollegeService(college.id, s.serviceId, !s.isEnabled)}
                    >
                      {s.isEnabled ? 'Disable Service' : 'Enable Service'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: QUOTA */}
      {activeTab === 'quota' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Student Quota Governance</span>
              <button className="btn btn-primary btn-sm" onClick={() => setIsQuotaModalOpen(true)}>
                <Sliders size={14} /> Adjust Capacity
              </button>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '16px' }}>
                <QuotaProgress
                  allocated={college.quota.allocated}
                  used={college.quota.used}
                  warningThreshold={college.quota.warningThreshold}
                  criticalThreshold={college.quota.criticalThreshold}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginTop: '20px' }}>
                <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ALLOCATED</div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>{college.quota.allocated.toLocaleString()}</div>
                </div>
                <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PROVISIONED USED</div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>{college.quota.used.toLocaleString()}</div>
                </div>
                <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AVAILABLE SEATS</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-success)' }}>
                    {(college.quota.allocated - college.quota.used).toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>WARNING / CRITICAL</div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>{college.quota.warningThreshold}% / {college.quota.criticalThreshold}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quota History */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Quota Change History (Audit Logged)</span>
            </div>
            <div className="table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Date / Timestamp</th>
                    <th>Administrator</th>
                    <th>Previous Value</th>
                    <th>New Value</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {collegeQuotaHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No quota adjustments recorded.
                      </td>
                    </tr>
                  ) : (
                    collegeQuotaHistory.map((q) => (
                      <tr key={q.id}>
                        <td>{new Date(q.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td><strong>{q.adminName}</strong></td>
                        <td>{q.previousAllocated.toLocaleString()}</td>
                        <td style={{ color: 'var(--bexo-blue-600)', fontWeight: 700 }}>{q.newAllocated.toLocaleString()}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{q.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AGREEMENT */}
      {activeTab === 'agreement' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">MOU & Contractual Agreement</span>
            <StatusBadge status={college.agreement.status} size="md" />
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div className="form-group">
                  <label className="form-label">Agreement Reference Number</label>
                  <div style={{ fontSize: '15px', fontWeight: 700 }}>{college.agreement.agreementNumber}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Agreement Type</label>
                  <div style={{ fontSize: '14px' }}>{college.agreement.type}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Term Validity Period</label>
                  <div style={{ fontSize: '14px' }}>
                    {college.agreement.startDate} through <strong>{college.agreement.endDate}</strong>
                  </div>
                </div>
              </div>

              <div>
                <div
                  style={{
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '20px',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText size={28} color="var(--bexo-blue-600)" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13.5px' }}>
                        {college.agreement.documentName || 'Signed_MOU_Agreement.pdf'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verified Document Reference</div>
                    </div>
                  </div>

                  <button className="btn btn-secondary btn-sm" onClick={() => alert('Downloading verified agreement document...')}>
                    <Download size={14} /> Download
                  </button>
                </div>

                {college.agreement.notes && (
                  <div style={{ marginTop: '16px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    <strong>Legal Notes:</strong> {college.agreement.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: PROVISIONING */}
      {activeTab === 'provisioning' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Student Access Provisioning Batches</span>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => triggerProvisioningBatch(college.id, 'Roll Number Range')}
            >
              <Play size={14} /> Trigger Range Batch (24CS001-24CS120)
            </button>
          </div>
          <div className="table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Source</th>
                  <th>Initiated By</th>
                  <th>Total Records</th>
                  <th>Successful</th>
                  <th>Failed</th>
                  <th>Status</th>
                  <th>Completed At</th>
                </tr>
              </thead>
              <tbody>
                {collegeJobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>
                      No provisioning batches run yet.
                    </td>
                  </tr>
                ) : (
                  collegeJobs.map((j) => (
                    <tr key={j.id}>
                      <td><strong>{j.id}</strong></td>
                      <td>{j.source}</td>
                      <td>{j.createdBy}</td>
                      <td>{j.totalRecords}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{j.successful}</td>
                      <td style={{ color: j.failed > 0 ? 'var(--color-danger)' : 'inherit', fontWeight: j.failed > 0 ? 700 : 400 }}>
                        {j.failed}
                      </td>
                      <td><StatusBadge status={j.status} size="sm" /></td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {j.completedAt ? new Date(j.completedAt).toLocaleTimeString() : 'In Progress'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: REQUESTS */}
      {activeTab === 'requests' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Approval Requests from {college.code}</span>
          </div>
          <div className="table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Type</th>
                  <th>Requester</th>
                  <th>Details</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {collegeApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No open requests from this institution.
                    </td>
                  </tr>
                ) : (
                  collegeApprovals.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{a.id}</strong></td>
                      <td>{a.type}</td>
                      <td>{a.requester}</td>
                      <td style={{ fontSize: '12.5px' }}>{a.details.title}</td>
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: a.priority === 'Critical' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                          {a.priority}
                        </span>
                      </td>
                      <td><StatusBadge status={a.status} size="sm" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Invoicing & Financial Indicators</span>
          </div>
          <div className="table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Description</th>
                  <th>Amount (INR)</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {collegePayments.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.invoiceNumber}</strong></td>
                    <td style={{ fontSize: '12.5px' }}>{p.description}</td>
                    <td style={{ fontWeight: 700 }}>₹{p.amount.toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.dueDate}</td>
                    <td><StatusBadge status={p.status} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 10: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Institutional Audit Activity</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {collegeAudit.map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--bexo-blue-600)', marginTop: '6px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>
                      {log.action.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {log.reason || 'Executed administrative action'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      by {log.actorName} ({log.actorRole}) • {new Date(log.timestamp).toLocaleString()} • IP: {log.ip}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Adjust Quota Modal */}
      {isQuotaModalOpen && (
        <QuotaAdjustModal
          college={college}
          isOpen={true}
          onClose={() => setIsQuotaModalOpen(false)}
        />
      )}

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <AddStaffModal
          collegeId={college.id}
          collegeName={college.name}
          isOpen={true}
          onClose={() => setIsAddStaffOpen(false)}
        />
      )}

      {/* Suspend Modal */}
      {isSuspendModalOpen && (
        <ConfirmationModal
          isOpen={true}
          title={`Suspend ${college.name}?`}
          description={`Suspending ${college.name} immediately locks operational services and college staff access while preserving student profiles.`}
          impactItems={[
            'College services will become inactive immediately',
            'New provisioning batches will be blocked',
            'Student accounts and resumes remain preserved intact',
            'Historical audit trail and logs remain immutable',
          ]}
          requireReason={true}
          reasonLabel="Suspension Reason"
          reasonPlaceholder="Specify reason for institutional suspension..."
          confirmLabel="Confirm Suspension"
          confirmVariant="danger"
          onConfirm={(reason) => {
            suspendCollege(college.id, reason);
            setIsSuspendModalOpen(false);
          }}
          onClose={() => setIsSuspendModalOpen(false)}
        />
      )}

      {/* Reactivate Modal */}
      {isReactivateModalOpen && (
        <ConfirmationModal
          isOpen={true}
          title={`Reactivate ${college.name}?`}
          description={`Reactivating ${college.name} will restore operational eligibility and reinstate student service entitlements.`}
          impactItems={[
            'Assigned platform services will become active',
            'College dashboard access will be re-enabled',
            'Student access entitlements will be restored',
          ]}
          confirmLabel="Confirm Reactivation"
          confirmVariant="warning"
          onConfirm={(reason) => {
            reactivateCollege(college.id, reason || 'Restoration authorized');
            setIsReactivateModalOpen(false);
          }}
          onClose={() => setIsReactivateModalOpen(false)}
        />
      )}

      {/* Revoke Student Access Confirmation Modal */}
      {selectedStudentToRevoke && (
        <ConfirmationModal
          isOpen={true}
          title="Revoke Student Access Entitlement?"
          description="Are you sure you want to revoke this student's platform services? Their portfolio and profile data will remain safe."
          requireReason={true}
          reasonLabel="Revocation Reason"
          confirmLabel="Confirm Revocation"
          confirmVariant="danger"
          onConfirm={(reason) => {
            revokeStudentAccess(selectedStudentToRevoke, reason);
            setSelectedStudentToRevoke(null);
          }}
          onClose={() => setSelectedStudentToRevoke(null)}
        />
      )}

      {/* Add College Admin Modal */}
      <AddCollegeAdminModal
        college={college}
        isOpen={isAddAdminModalOpen}
        onClose={() => setIsAddAdminModalOpen(false)}
      />

      {/* Change Staff Role Modal */}
      {staffForRoleChange && (
        <div className="modal-backdrop" onClick={() => setStaffForRoleChange(null)} style={{ zIndex: 1100 }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 8px' }}>Modify Institutional Role</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Assign new permissions for <strong>{staffForRoleChange.name}</strong> at {college.name}.
            </p>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Role Specification</label>
              <select
                className="form-select"
                value={newSelectedRole}
                onChange={(e) => setNewSelectedRole(e.target.value as Role)}
              >
                <option value="college_admin">COLLEGE_ADMIN (Full Institutional Governance)</option>
                <option value="college_coordinator">COLLEGE_COORDINATOR (Placement & Entitlement)</option>
                <option value="college_staff">COLLEGE_STAFF (Department Support)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setStaffForRoleChange(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  changeStaffRole(staffForRoleChange.id, newSelectedRole);
                  setStaffForRoleChange(null);
                }}
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
