import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useRouter } from '../router/Router';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { CollegeOnboardingWizard } from '../components/colleges/CollegeOnboardingWizard';
import {
  Building2,
  GraduationCap,
  Users2,
  Cpu,
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle2,
  XCircle,
  FileText,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    colleges,
    students,
    provisioningJobs,
    approvals,
    notifications,
    auditLogs,
    currentUser,
    getCollegeById,
    triggerProvisioningBatch,
  } = useAdmin();

  const { navigate } = useRouter();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Computed metrics
  const totalColleges = colleges.length;
  const activeColleges = colleges.filter((c) => c.status === 'Active').length;
  const pendingColleges = colleges.filter((c) => c.status === 'Pending').length;
  const suspendedColleges = colleges.filter((c) => c.status === 'Suspended').length;

  const totalStudents = colleges.reduce((sum, c) => sum + c.totalStudents, 0);
  const activeStudents = colleges.reduce((sum, c) => sum + c.activeStudents, 0);

  const pendingApprovals = approvals.filter((a) => a.status === 'Pending').length;
  const criticalApprovals = approvals.filter((a) => a.status === 'Pending' && (a.priority === 'Critical' || a.priority === 'High')).length;

  // Quota alerts (Colleges >= 80% quota)
  const quotaWarningColleges = colleges.filter((c) => {
    const pct = c.quota.allocated > 0 ? (c.quota.used / c.quota.allocated) * 100 : 0;
    return pct >= c.quota.warningThreshold;
  });

  // Expiring agreements (< 30 days)
  const expiringAgreements = colleges.filter((c) => c.agreement.status === 'Expiring Soon');

  // Failed jobs
  const failedJobs = provisioningJobs.filter((j) => j.status === 'Failed' || j.status === 'Partially Completed');
  const recentFailedCount = failedJobs.reduce((sum, j) => sum + j.failed, 0);

  return (
    <div>
      {/* Executive Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <span>Good morning, {currentUser.name.split(' ')[0]}</span>
            {currentUser.role === 'super_admin' ? (
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#92400E', backgroundColor: '#FEF3C7', padding: '3px 10px', borderRadius: '6px', border: '1px solid #FDE68A', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                👑 Super Admin • Central Authority
              </span>
            ) : (
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--bexo-blue-600)', backgroundColor: 'var(--bexo-blue-50)', padding: '3px 8px', borderRadius: '6px' }}>
                {currentUser.role.replace('_', ' ').toUpperCase()} • HQ
              </span>
            )}
          </h1>
          <p>
            Here's what's happening across the BEXO platform today • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="page-actions-group">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/approvals')}>
            <Clock size={15} />
            <span>Review Approvals ({pendingApprovals})</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/provisioning')}>
            <Cpu size={15} />
            <span>Provisioning Queue</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsOnboardingOpen(true)}>
            <Plus size={16} />
            <span>Onboard College</span>
          </button>
        </div>
      </div>

      {/* Top KPI Section */}
      <div className="stat-grid-4">
        <StatCard
          label="Total Colleges"
          value={totalColleges}
          subtext={`${activeColleges} active • ${suspendedColleges} suspended`}
          icon={Building2}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
          onClick={() => navigate('/admin/colleges')}
        />
        <StatCard
          label="Active Colleges"
          value={activeColleges}
          subtext={`${Math.round((activeColleges / totalColleges) * 100)}% operational rate`}
          icon={CheckCircle2}
          iconBg="#ECFDF5"
          iconColor="#059669"
          badge={pendingColleges > 0 ? `${pendingColleges} Pending` : undefined}
          badgeColor="amber"
          onClick={() => navigate('/admin/colleges')}
        />
        <StatCard
          label="Total Students"
          value={totalStudents.toLocaleString()}
          subtext="Enrolled across institutions"
          icon={GraduationCap}
          iconBg="#F5F3FF"
          iconColor="#7C3AED"
          onClick={() => navigate('/admin/students')}
        />
        <StatCard
          label="Active Student Access"
          value={activeStudents.toLocaleString()}
          subtext={`${Math.round((activeStudents / (totalStudents || 1)) * 100)}% entitlement rate`}
          icon={Layers}
          iconBg="#EFF6FF"
          iconColor="#0284C7"
          badge={totalStudents - activeStudents > 0 ? `${(totalStudents - activeStudents).toLocaleString()} Suspended` : undefined}
          badgeColor="red"
          onClick={() => navigate('/admin/students')}
        />
      </div>

      {/* Critical Attention Center */}
      <div style={{ marginBottom: '28px' }}>
        <div className="attention-center-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--color-warning)" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Operational Attention Center
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Items requiring immediate admin review</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
          {/* Attention Item 1: Agreement Expiring */}
          {expiringAgreements.map((c) => (
            <div
              key={c.id}
              className="card attention-card"
              style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="status-badge pending" style={{ fontSize: '11px' }}>
                  <Clock size={11} /> Agreement Expiry
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ends {c.agreement.endDate}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                {c.name} agreement expires in 16 days
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                MOU {c.agreement.agreementNumber} requires renewal approval to maintain uninterrupted service entitlements.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11.5px', padding: '4px 10px' }}
                  onClick={() => navigate(`/admin/colleges/${c.id}`)}
                >
                  Inspect College →
                </button>
              </div>
            </div>
          ))}

          {/* Attention Item 2: Quota Warnings */}
          {quotaWarningColleges.map((c) => (
            <div
              key={c.id}
              className="card attention-card"
              style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="status-badge pending" style={{ fontSize: '11px' }}>
                  <AlertCircle size={11} /> Quota Warning
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {Math.round((c.quota.used / c.quota.allocated) * 100)}% utilized
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                {c.name} has reached {Math.round((c.quota.used / c.quota.allocated) * 100)}% quota capacity
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {c.quota.used.toLocaleString()} of {c.quota.allocated.toLocaleString()} student seats allocated. Fresh bulk imports may fail.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11.5px', padding: '4px 10px' }}
                  onClick={() => navigate(`/admin/colleges/${c.id}`)}
                >
                  Adjust Quota →
                </button>
              </div>
            </div>
          ))}

          {/* Attention Item 3: Failed Provisioning */}
          {recentFailedCount > 0 && (
            <div
              className="card attention-card error"
              style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="status-badge suspended" style={{ fontSize: '11px' }}>
                  <XCircle size={11} /> Provisioning Failures
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Validation Error</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                {recentFailedCount} student records failed in recent batch runs
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Duplicate rolls and missing college emails flagged in batch JOB-2026-124.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11.5px', padding: '4px 10px' }}
                  onClick={() => navigate('/admin/provisioning')}
                >
                  Inspect Failed Records →
                </button>
              </div>
            </div>
          )}

          {/* Attention Item 4: Pending Approvals */}
          {pendingApprovals > 0 && (
            <div
              className="card attention-card"
              style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="status-badge pending" style={{ fontSize: '11px' }}>
                  <Clock size={11} /> Approval Center
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{criticalApprovals} High Priority</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                {pendingApprovals} operational requests require decision
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Quota increase from BIT, new college onboarding for GCT, and service activations pending.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11.5px', padding: '4px 10px' }}
                  onClick={() => navigate('/admin/approvals')}
                >
                  Review Requests →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Analytical Breakdown & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Visual System Telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Institutional Activity Breakdown */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Building2 size={17} color="var(--bexo-blue-600)" />
                <span>College Lifecycle Distribution</span>
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/admin/colleges')}
              >
                View All Colleges
              </button>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Colleges</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-success)', marginTop: '4px' }}>{activeColleges}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Operational with live access</div>
                </div>

                <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Clearance</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-warning)', marginTop: '4px' }}>{pendingColleges}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Draft / Legal review</div>
                </div>

                <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Suspended Colleges</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-danger)', marginTop: '4px' }}>{suspendedColleges}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Services locked; records intact</div>
                </div>
              </div>

              {/* Progress bar visual */}
              <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#E2E8F0', marginBottom: '14px' }}>
                <div style={{ width: `${(activeColleges / totalColleges) * 100}%`, backgroundColor: '#10B981' }} title={`Active: ${activeColleges}`} />
                <div style={{ width: `${(pendingColleges / totalColleges) * 100}%`, backgroundColor: '#F59E0B' }} title={`Pending: ${pendingColleges}`} />
                <div style={{ width: `${(suspendedColleges / totalColleges) * 100}%`, backgroundColor: '#EF4444' }} title={`Suspended: ${suspendedColleges}`} />
              </div>

              <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#10B981' }} /> Active ({Math.round((activeColleges / totalColleges) * 100)}%)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#F59E0B' }} /> Pending ({Math.round((pendingColleges / totalColleges) * 100)}%)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#EF4444' }} /> Suspended ({Math.round((suspendedColleges / totalColleges) * 100)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Provisioning Activity Overview */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Cpu size={17} color="var(--bexo-blue-600)" />
                <span>Recent Provisioning Batches</span>
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/admin/provisioning')}
              >
                Inspect Queue
              </button>
            </div>
            <div className="table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>College</th>
                    <th>Source</th>
                    <th>Records</th>
                    <th>Success / Fail</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {provisioningJobs.slice(0, 4).map((j) => (
                    <tr
                      key={j.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate('/admin/provisioning')}
                    >
                      <td>
                        <strong style={{ color: 'var(--bexo-blue-600)' }}>{j.id}</strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{j.collegeName}</div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{j.source}</td>
                      <td>{j.totalRecords.toLocaleString()}</td>
                      <td>
                        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{j.successful}</span>
                        {j.failed > 0 && (
                          <span style={{ color: 'var(--color-danger)', fontWeight: 600, marginLeft: '6px' }}>
                            / {j.failed} failed
                          </span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={j.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Platform Audit Feed & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Recent Administrative Activity Feed */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Activity size={17} color="var(--bexo-blue-600)" />
                <span>Administrative Audit Feed</span>
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/admin/audit')}
              >
                View Audit Log
              </button>
            </div>
            <div className="card-body" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--bexo-blue-600)',
                        marginTop: '6px',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {log.entityName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        by <strong>{log.actorName}</strong> ({log.actorRole})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Core Services Adoption */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Layers size={17} color="var(--bexo-blue-600)" />
                <span>Service Adoption</span>
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/admin/services')}
              >
                Catalog
              </button>
            </div>
            <div className="card-body" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>BEXO Portfolio</span>
                    <span style={{ color: 'var(--text-muted)' }}>18,450 students (100%)</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--bexo-blue-600)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>BEXO Templates</span>
                    <span style={{ color: 'var(--text-muted)' }}>16,200 students (88%)</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '88%', height: '100%', backgroundColor: '#3B82F6' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>ATS Resume Engine</span>
                    <span style={{ color: 'var(--text-muted)' }}>12,400 students (67%)</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '67%', height: '100%', backgroundColor: 'var(--color-purple)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>Placement Recruiter Portal</span>
                    <span style={{ color: 'var(--text-muted)' }}>9,800 students (53%)</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '53%', height: '100%', backgroundColor: '#059669' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Wizard Modal */}
      <CollegeOnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
};
