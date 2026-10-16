import React from 'react';
import { useRouter } from '../../router/Router';
import { useAdmin } from '../../context/AdminContext';
import {
  Users,
  Layers,
  Sparkles,
  Award,
  Users2,
  FileText,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  Hash,
  ChevronRight,
  BarChart2,
  Calendar,
  UploadCloud,
  FileCheck2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export const CollegeDashboardPage: React.FC = () => {
  const { navigate } = useRouter();
  const {
    currentUser,
    colleges,
    currentCollege,
    isCorporateAdmin,
    getScopedStudentsForCollege,
    getScopedStaffForCollege,
    getScopedProvisioningJobsForCollege,
    getScopedApprovalsForCollege,
    getScopedAuditLogsForCollege,
  } = useAdmin();

  // Find college strictly from authenticated identity
  const college = currentCollege || colleges.find(
    (c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName
  ) || (isCorporateAdmin ? colleges[0] : undefined);

  const collegeId = college?.id || currentUser.collegeId || '';
  const isSuspended = college?.status === 'Suspended' || currentUser.accountStatus === 'SUSPENDED';

  // Scoped datasets strictly derived from authenticated tenant
  const students = getScopedStudentsForCollege();
  const staff = getScopedStaffForCollege();
  const jobs = getScopedProvisioningJobsForCollege();

  // Authoritative KPI figures
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.accessStatus === 'Active').length;
  const pendingStudents = students.filter((s) => s.accessStatus === 'Pending').length;

  const quotaAllocated = college?.quota.allocated || 0;
  const quotaUsed = college?.quota.used || 0;
  const quotaRemaining = Math.max(0, quotaAllocated - quotaUsed);
  const quotaPercent = quotaAllocated > 0 ? Math.min(100, Math.round((quotaUsed / quotaAllocated) * 100)) : 0;

  // Additional indicators
  const departments = Array.from(new Set(students.map((s) => s.department).filter(Boolean)));
  const activeStaff = staff.filter((s) => s.accountStatus === 'ACTIVE').length;

  // Jobs stats
  const completedJobs = jobs.filter((j) => j.status === 'Completed').length;
  const processingJobs = jobs.filter((j) => j.status === 'Processing').length;
  const partialJobs = jobs.filter((j) => j.status === 'Partially Completed').length;
  const failedJobs = jobs.filter((j) => j.status === 'Failed').length;
  const totalFailedRecords = jobs.reduce((acc, j) => acc + (j.failed || 0), 0);

  // Pending requests strictly scoped
  const pendingRequests = getScopedApprovalsForCollege().filter((a) => a.status === 'Pending');

  // Assigned services
  const assignedServices = college?.services ? college.services.filter((s) => s.isEnabled) : [];

  // Agreement days remaining calculation
  let agreementDaysRemaining: number | null = null;
  if (college?.agreement?.endDate) {
    const end = new Date(college.agreement.endDate).getTime();
    const now = new Date().getTime();
    agreementDaysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  }

  // Scoped activity logs
  const collegeActivity = getScopedAuditLogsForCollege().slice(0, 6);

  // Attention Required items
  const attentionItems: Array<{
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    actionText: string;
    path: string;
  }> = [];

  if (isSuspended) {
    attentionItems.push({
      title: 'Institutional Account Suspended',
      description: `Suspended by BEXO Administration. Reason: "${college?.suspensionReason || 'Administrative hold'}". Student provisioning locked.`,
      severity: 'critical',
      actionText: 'Contact Support',
      path: '/college/support',
    });
  }

  if (quotaPercent >= 80) {
    attentionItems.push({
      title: 'High Student Quota Utilization',
      description: `Your college has utilized ${quotaPercent}% of approved quota (${quotaRemaining.toLocaleString()} licenses remaining).`,
      severity: quotaPercent >= 95 ? 'critical' : 'warning',
      actionText: 'Request Quota Increase',
      path: '/college/requests',
    });
  }

  if (pendingStudents > 0) {
    attentionItems.push({
      title: `${pendingStudents} Students Awaiting Access`,
      description: `${pendingStudents} student records enrolled from import do not yet have an active BEXO service assigned.`,
      severity: 'info',
      actionText: 'Give Student Access',
      path: '/college/give-access',
    });
  }

  if (totalFailedRecords > 0) {
    attentionItems.push({
      title: `${totalFailedRecords} Failed Student Records in Provisioning`,
      description: `Recent batch runs had records fail due to duplicates or formatting. Review student error reasons and retry.`,
      severity: 'warning',
      actionText: 'Review Provisioning Jobs',
      path: '/college/provisioning',
    });
  }

  if (agreementDaysRemaining !== null && agreementDaysRemaining <= 45 && agreementDaysRemaining > 0) {
    attentionItems.push({
      title: `Institutional MOU Expiring in ${agreementDaysRemaining} Days`,
      description: `Your partnership agreement concludes on ${new Date(college.agreement.endDate).toLocaleDateString()}. Submit a renewal request to prevent interruption.`,
      severity: 'warning',
      actionText: 'View Agreement & Renew',
      path: '/college/agreement',
    });
  }

  if (pendingRequests.length > 0) {
    attentionItems.push({
      title: `${pendingRequests.length} Pending Administrative Request${pendingRequests.length > 1 ? 's' : ''}`,
      description: `Requests submitted to BEXO Central Administration are currently under evaluation.`,
      severity: 'info',
      actionText: 'Track Requests',
      path: '/college/requests',
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Suspension Alert */}
      {isSuspended && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECDD3',
            borderRadius: '12px',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
          }}
        >
          <AlertTriangle size={24} color="#E11D48" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: '#9F1239', fontWeight: 800 }}>
              INSTITUTIONAL ACCESS SUSPENDED
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#BE123C', lineHeight: 1.5 }}>
              This college account has been suspended by BEXO Central Administration ({college?.suspensionReason || 'Compliance hold'}).
              All student provisioning operations are locked. Historical student records, course entitlements, and audit events remain
              fully preserved.
            </p>
          </div>
        </div>
      )}

      {/* Hero Welcome Bar */}
      <div
        className="dashboard-hero-banner"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '16px',
          padding: '28px 32px',
          color: '#FFFFFF',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: 'rgba(59, 130, 246, 0.25)',
                color: '#93C5FD',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Institutional Operations Hub
            </span>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>•</span>
            <span style={{ fontSize: '12px', color: '#CBD5E1' }}>
              Institution Code: {college?.code || 'INST'} • {college?.affiliation || 'Affiliated'}
            </span>
          </div>

          <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {college?.name || 'Assigned College'}
          </h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#94A3B8', maxWidth: '640px' }}>
            Central workspace for student enrollment, service access provisioning, department rosters, and staff coordination.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="dashboard-hero-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={() => navigate('/college/give-access')}
            disabled={isSuspended}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              backgroundColor: isSuspended ? '#475569' : '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isSuspended ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isSuspended ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.35)',
            }}
          >
            <Sparkles size={15} />
            <span>Give Student Access</span>
          </button>

          <button
            onClick={() => navigate('/college/students/import')}
            disabled={isSuspended}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: isSuspended ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <UploadCloud size={15} />
            <span>Bulk CSV Import</span>
          </button>
        </div>
      </div>

      {/* 4 PRIMARY KPI CARDS (from Section 5) */}
      <div className="dashboard-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* KPI 1: Total Students */}
        <div
          onClick={() => navigate('/college/students')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748B' }}>Total Students</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>
            {totalStudents.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            Across {departments.length} departments
          </div>
        </div>

        {/* KPI 2: Students with Active Access */}
        <div
          onClick={() => navigate('/college/entitlements')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748B' }}>Active BEXO Access</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#15803D', marginBottom: '4px' }}>
            {activeStudents.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>
            {totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0}% activation rate
          </div>
        </div>

        {/* KPI 3: Pending Student Access */}
        <div
          onClick={() => navigate('/college/give-access')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748B' }}>Pending Student Access</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: pendingStudents > 0 ? '#D97706' : '#0F172A', marginBottom: '4px' }}>
            {pendingStudents.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#B45309' }}>
            {pendingStudents > 0 ? 'Imported • Awaiting service' : 'All enrolled active'}
          </div>
        </div>

        {/* KPI 4: Remaining Student Quota */}
        <div
          onClick={() => navigate('/college/services')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748B' }}>Remaining Quota</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: quotaRemaining > 100 ? '#F0FDF4' : '#FEF2F2', color: quotaRemaining > 100 ? '#16A34A' : '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: quotaRemaining > 100 ? '#0F172A' : '#DC2626', marginBottom: '4px' }}>
            {quotaRemaining.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            {quotaUsed.toLocaleString()} used of {quotaAllocated.toLocaleString()} ({quotaPercent}%)
          </div>
        </div>
      </div>

      {/* ATTENTION REQUIRED SECTION */}
      {attentionItems.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '22px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={18} color="#D97706" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
              Attention Required ({attentionItems.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {attentionItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: item.severity === 'critical' ? '1px solid #FECDD3' : item.severity === 'warning' ? '1px solid #FDE68A' : '1px solid #E2E8F0',
                  backgroundColor: item.severity === 'critical' ? '#FFF1F2' : item.severity === 'warning' ? '#FFFBEB' : '#F8FAFC',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: item.severity === 'critical' ? '#9F1239' : item.severity === 'warning' ? '#92400E' : '#1E293B' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    {item.description}
                  </div>
                </div>

                <button
                  onClick={() => navigate(item.path)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: item.severity === 'critical' ? '#E11D48' : item.severity === 'warning' ? '#D97706' : '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{item.actionText}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROVISIONING OVERVIEW & QUOTA GAUGES */}
      <div className="dashboard-twin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {/* Provisioning Overview Box */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '22px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
              Provisioning Overview
            </h3>
            <button
              onClick={() => navigate('/college/provisioning')}
              style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
            >
              All Jobs ({jobs.length})
            </button>
          </div>

          <div className="dashboard-provisioning-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '18px' }}>
            <div style={{ padding: '12px 8px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700 }}>COMPLETED</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>{completedJobs}</div>
            </div>
            <div style={{ padding: '12px 8px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
              <div style={{ fontSize: '11px', color: '#1E40AF', fontWeight: 700 }}>PROCESSING</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#2563EB', marginTop: '2px' }}>{processingJobs}</div>
            </div>
            <div style={{ padding: '12px 8px', backgroundColor: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 700 }}>PARTIAL</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#D97706', marginTop: '2px' }}>{partialJobs}</div>
            </div>
            <div style={{ padding: '12px 8px', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECDD3' }}>
              <div style={{ fontSize: '11px', color: '#991B1B', fontWeight: 700 }}>FAILED</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>{failedJobs}</div>
            </div>
          </div>

          {/* Recent Jobs Snippet */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {jobs.slice(0, 3).map((j) => (
              <div
                key={j.id}
                onClick={() => navigate('/college/provisioning')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{j.id}</span>
                  <span style={{ color: '#64748B', marginLeft: '8px' }}>{j.source} • {j.totalRecords} records</span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: j.status === 'Completed' ? '#DCFCE7' : '#EFF6FF',
                    color: j.status === 'Completed' ? '#166534' : '#1D4ED8',
                  }}
                >
                  {j.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quota Usage Gauge & Services */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '22px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                Quota Capacity & Services
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                Active licenses under MOU #{college?.agreement?.agreementNumber || 'MOU-CURRENT'}
              </p>
            </div>
            <button
              onClick={() => navigate('/college/requests')}
              style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
            >
              Request Upgrade
            </button>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
              <span style={{ color: '#0F172A' }}>{quotaUsed.toLocaleString()} of {quotaAllocated.toLocaleString()} Used</span>
              <span style={{ color: quotaPercent >= 90 ? '#E11D48' : '#2563EB' }}>{quotaPercent}%</span>
            </div>
            <div style={{ height: '10px', backgroundColor: '#F1F5F9', borderRadius: '5px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${quotaPercent}%`,
                  backgroundColor: isSuspended ? '#EF4444' : quotaPercent >= 90 ? '#F59E0B' : '#2563EB',
                  borderRadius: '5px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Assigned Services Pills */}
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
            Active Platform Services ({assignedServices.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {assignedServices.map((s) => (
              <span
                key={s.serviceId}
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#EFF6FF',
                  color: '#1E40AF',
                  border: '1px solid #BFDBFE',
                }}
              >
                {s.name} ({s.studentsUsing.toLocaleString()} students)
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY LOG */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          padding: '22px',
          border: '1px solid #E2E8F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
              Recent Institutional Activity
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
              Authoritative audit events scoped strictly to your college
            </p>
          </div>
          <button
            onClick={() => navigate('/college/activity')}
            style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
          >
            Full Activity Log
          </button>
        </div>

        {collegeActivity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: '13px' }}>
            No recent activity recorded for this college.
          </div>
        ) : (
          <div className="dashboard-activity-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            {collegeActivity.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <Clock size={15} color="#94A3B8" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1E293B' }}>
                    {log.action.replace(/_/g, ' ')}
                  </div>
                  <div
                    style={{
                      fontSize: '11.5px',
                      color: '#64748B',
                      lineHeight: 1.35,
                      marginTop: '2px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {log.entityName} {log.reason ? `• ${log.reason}` : ''}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '4px' }}>
                    By {log.actorName} ({log.actorRole}) • {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
