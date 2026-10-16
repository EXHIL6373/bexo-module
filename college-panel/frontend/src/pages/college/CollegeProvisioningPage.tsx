import React, { useState, useMemo } from 'react';
import { useRouter } from '../../router/Router';
import { useAdmin } from '../../context/AdminContext';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  Eye,
  RotateCcw,
  Sparkles,
  Download,
  FileCheck2,
  XCircle,
} from 'lucide-react';
import { ProvisioningJob } from '../../types';

export const CollegeProvisioningPage: React.FC = () => {
  const { navigate } = useRouter();
  const {
    currentUser,
    colleges,
    getScopedProvisioningJobsForCollege,
    retryFailedProvisioningRecords,
    addToast,
    currentCollege,
    isCorporateAdmin,
  } = useAdmin();

  const college = currentCollege || colleges.find(
    (c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName
  ) || (isCorporateAdmin ? colleges[0] : undefined);

  const collegeId = college?.id || currentUser.collegeId || '';
  const isSuspended = college?.status === 'Suspended' || currentUser.accountStatus === 'SUSPENDED';

  const jobs = getScopedProvisioningJobsForCollege();

  const quotaRemaining = college ? Math.max(0, college.quota.allocated - college.quota.used) : 0;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedJob, setSelectedJob] = useState<ProvisioningJob | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchSearch =
        j.id.toLowerCase().includes(search.toLowerCase()) ||
        j.source.toLowerCase().includes(search.toLowerCase()) ||
        j.createdBy.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || j.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [jobs, search, statusFilter]);

  const handleRetry = async (jobId: string) => {
    if (isSuspended) {
      addToast('error', 'Operation Locked', 'College account is suspended.');
      return;
    }

    if (quotaRemaining <= 0) {
      addToast('error', 'Quota Exceeded', 'Insufficient remaining quota to retry failed records.');
      return;
    }

    setIsRetrying(true);
    try {
      const res = await retryFailedProvisioningRecords(jobId);
      if (res.success) {
        // Refresh selected job view if open
        const updated = jobs.find((j) => j.id === jobId);
        if (updated) setSelectedJob(updated);
      }
    } catch (err: any) {
      addToast('error', 'Retry Failed', err.message || 'Failed to retry records.');
    } finally {
      setIsRetrying(false);
    }
  };

  const exportJobReport = (job: ProvisioningJob) => {
    let csv = `Job ID,${job.id}\nStatus,${job.status}\nSource,${job.source}\nTotal,${job.totalRecords}\nSuccessful,${job.successful}\nFailed,${job.failed}\nCreated At,${job.createdAt}\n\n`;
    if (job.failedRecords && job.failedRecords.length > 0) {
      csv += 'Roll Number,Student Name,Failure Reason,Error Status\n';
      job.failedRecords.forEach((f) => {
        csv += `"${f.rollNumber}","${f.name}","${f.reason}","${f.status}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bexo_job_report_${job.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('success', 'Job Report Downloaded', `Saved report for ${job.id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-actions-bar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
              Provisioning Jobs
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
              }}
            >
              {jobs.length} Total Jobs
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
            Historical access provisioning batches executed for {college?.name || 'Assigned College'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/college/give-access')}
            disabled={isSuspended}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              backgroundColor: isSuspended ? '#94A3B8' : '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isSuspended ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} />
            <span>Launch New Provisioning</span>
          </button>
        </div>
      </div>

      {/* Suspension Alert */}
      {isSuspended && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECDD3',
            borderRadius: '10px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            color: '#9F1239',
          }}
        >
          <AlertTriangle size={18} color="#E11D48" />
          <span>
            <strong>Read-Only Mode:</strong> Institutional account is currently suspended. Jobs history remains preserved, but retrying and new provisioning are locked.
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="page-filter-bar"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '14px 20px',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '380px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search job ID, creator, or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '12.5px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Partially Completed">Partially Completed</option>
            <option value="Processing">Processing</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Provisioning Jobs Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
      >
        <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ backgroundColor: '#F8FAFC' }}>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700 }}>Job ID</th>
                <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700 }}>Source / Batch</th>
                <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700 }}>Initiated By</th>
                <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700 }}>Total Records</th>
                <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700 }}>Successful</th>
                <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700 }}>Failed</th>
                <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700 }}>Date</th>
                <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700, textAlign: 'right', width: '180px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                    No provisioning jobs found matching this criteria.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((j) => (
                  <tr
                    key={j.id}
                    style={{ borderBottom: '1px solid #F1F5F9' }}
                  >
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                        {j.id}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', color: '#334155', fontWeight: 600 }}>
                      {j.source}
                    </td>
                    <td style={{ padding: '12px 18px', color: '#64748B' }}>
                      {j.createdBy}
                    </td>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: '#0F172A' }}>
                      {j.totalRecords}
                    </td>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: '#16A34A' }}>
                      {j.successful}
                    </td>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: j.failed > 0 ? '#DC2626' : '#64748B' }}>
                      {j.failed}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          backgroundColor:
                            j.status === 'Completed'
                              ? '#DCFCE7'
                              : j.status === 'Partially Completed'
                              ? '#FEF3C7'
                              : j.status === 'Processing'
                              ? '#EFF6FF'
                              : '#FEE2E2',
                          color:
                            j.status === 'Completed'
                              ? '#166534'
                              : j.status === 'Partially Completed'
                              ? '#B45309'
                              : j.status === 'Processing'
                              ? '#1D4ED8'
                              : '#991B1B',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {j.status === 'Completed' ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                        {j.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', color: '#64748B', whiteSpace: 'nowrap' }}>
                      {new Date(j.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', minWidth: '150px' }}>
                        <button
                          onClick={() => setSelectedJob(j)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #CBD5E1',
                            color: '#334155',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={12} />
                          <span>Drilldown</span>
                        </button>

                        {j.failed > 0 && !isSuspended && (
                          <button
                            onClick={() => handleRetry(j.id)}
                            disabled={isRetrying}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#2563EB',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: isRetrying ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <RotateCcw size={12} />
                            <span>Retry</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JOB DETAILS DRILLDOWN MODAL */}
      {selectedJob && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                  Job Details: {selectedJob.id}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Initiated by {selectedJob.createdBy} • {new Date(selectedJob.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>TOTAL RECORDS</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>{selectedJob.totalRecords}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700 }}>SUCCESSFUL</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>{selectedJob.successful}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 700 }}>PARTIAL / SKIPPED</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#D97706', marginTop: '2px' }}>{selectedJob.partial || 0}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECDD3', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#991B1B', fontWeight: 700 }}>FAILED</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>{selectedJob.failed}</div>
              </div>
            </div>

            {/* Failed Records Drilldown Table */}
            {selectedJob.failedRecords && selectedJob.failedRecords.length > 0 ? (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 800, color: '#991B1B' }}>
                  Failed Records Reason Breakdown ({selectedJob.failedRecords.length})
                </h4>
                <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #FECDD3', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                    <thead style={{ backgroundColor: '#FEF2F2', position: 'sticky', top: 0 }}>
                      <tr style={{ borderBottom: '1px solid #FECDD3' }}>
                        <th style={{ padding: '8px 12px', color: '#991B1B', fontWeight: 700 }}>Roll Number</th>
                        <th style={{ padding: '8px 12px', color: '#991B1B', fontWeight: 700 }}>Student Name</th>
                        <th style={{ padding: '8px 12px', color: '#991B1B', fontWeight: 700 }}>Error Classification</th>
                        <th style={{ padding: '8px 12px', color: '#991B1B', fontWeight: 700 }}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedJob.failedRecords.map((f, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F172A' }}>{f.rollNumber}</td>
                          <td style={{ padding: '8px 12px', color: '#334155' }}>{f.name}</td>
                          <td style={{ padding: '8px 12px', color: '#DC2626', fontWeight: 600 }}>{f.status}</td>
                          <td style={{ padding: '8px 12px', color: '#64748B' }}>{f.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', color: '#166534', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} />
                <span>All records in this provisioning job were processed cleanly without errors.</span>
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => exportJobReport(selectedJob)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '7px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Download size={13} />
                <span>Download Report CSV</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                {selectedJob.failed > 0 && !isSuspended && (
                  <button
                    onClick={() => handleRetry(selectedJob.id)}
                    disabled={isRetrying || quotaRemaining <= 0}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '7px',
                      backgroundColor: '#2563EB',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: isRetrying || quotaRemaining <= 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>Retry Failed ({selectedJob.failed})</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedJob(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '7px',
                    backgroundColor: '#F1F5F9',
                    border: 'none',
                    color: '#475569',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
