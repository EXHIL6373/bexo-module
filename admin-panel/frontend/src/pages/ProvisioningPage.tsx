import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { ProvisioningJob } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Cpu,
  Play,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  X,
  FileSpreadsheet,
  Building,
  RefreshCw,
} from 'lucide-react';

export const ProvisioningPage: React.FC = () => {
  const {
    scopedProvisioningJobs,
    colleges,
    triggerProvisioningBatch,
    isCompanyScope,
  } = useAdmin();

  const [activeJob, setActiveJob] = useState<ProvisioningJob | null>(null);

  // Trigger modal state
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [selectedCollegeId, setSelectedCollegeId] = useState(colleges[0]?.id || '');
  const [provisionMode, setProvisionMode] = useState<'Roll Number Range' | 'CSV Upload'>('Roll Number Range');
  const [startRoll, setStartRoll] = useState('24CS001');
  const [endRoll, setEndRoll] = useState('24CS120');
  const [batchCount, setBatchCount] = useState(120);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLaunchBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await triggerProvisioningBatch(
        selectedCollegeId,
        provisionMode,
        startRoll,
        endRoll,
        Number(batchCount)
      );
      setIsTriggerModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <Cpu size={26} color="var(--bexo-blue-600)" />
            <span>Bulk Student Provisioning Queue</span>
          </h1>
          <p>
            Monitor large-scale student entitlement operations, validation error breakdowns, and background batch queues.
          </p>
        </div>

        <div className="page-actions-group">
          <button className="btn btn-primary" onClick={() => setIsTriggerModalOpen(true)}>
            <Play size={16} />
            <span>Run Provisioning Batch</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="stat-grid-4">
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL BATCHES</div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>{scopedProvisioningJobs.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Dispatched batch jobs</div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>SUCCESSFUL RECORDS</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)', marginTop: '4px' }}>
            {scopedProvisioningJobs.reduce((sum, j) => sum + j.successful, 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Entitled student accounts</div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>VALIDATION FAILURES</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-danger)', marginTop: '4px' }}>
            {scopedProvisioningJobs.reduce((sum, j) => sum + j.failed, 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Duplicate or schema errors</div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>QUEUE WORKER STATUS</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-success)', marginTop: '8px' }}>
            BullMQ Active
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>2 Worker Threads Online</div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Provisioning Batch Log</span>
        </div>
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Job Identifier</th>
                <th>Target College</th>
                <th>Ingestion Source</th>
                <th>Dispatched By</th>
                <th>Total Records</th>
                <th>Success</th>
                <th>Failed</th>
                <th>Job Status</th>
                <th>Timestamp</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scopedProvisioningJobs.map((j) => (
                <tr key={j.id}>
                  <td>
                    <strong style={{ color: 'var(--bexo-blue-600)' }}>{j.id}</strong>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{j.collegeName}</span>
                  </td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '11px' }}>
                      {j.source}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{j.createdBy}</td>
                  <td>{j.totalRecords.toLocaleString()}</td>
                  <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>{j.successful.toLocaleString()}</td>
                  <td style={{ color: j.failed > 0 ? 'var(--color-danger)' : 'inherit', fontWeight: j.failed > 0 ? 700 : 400 }}>
                    {j.failed.toLocaleString()}
                  </td>
                  <td>
                    <StatusBadge status={j.status} size="sm" />
                  </td>
                  <td style={{ fontSize: '11.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(j.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 10px', fontSize: '11.5px' }}
                      onClick={() => setActiveJob(j)}
                    >
                      <Eye size={13} />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Details Drawer */}
      {activeJob && (
        <div className="drawer-backdrop" onClick={() => setActiveJob(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={22} color="var(--bexo-blue-600)" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '16px' }}>Batch {activeJob.id}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{activeJob.collegeName}</div>
                </div>
              </div>
              <button onClick={() => setActiveJob(null)} style={{ color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Status Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Batch Processing Status</span>
                <StatusBadge status={activeJob.status} size="md" />
              </div>

              {/* Counts Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: '11px', color: '#1E40AF', fontWeight: 700 }}>TOTAL ROWS</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#1E3A8A', marginTop: '2px' }}>{activeJob.totalRecords}</div>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '11px', color: '#065F46', fontWeight: 700 }}>SUCCESSFUL</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#047857', marginTop: '2px' }}>{activeJob.successful}</div>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: '11px', color: '#991B1B', fontWeight: 700 }}>FAILED ROWS</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#B91C1C', marginTop: '2px' }}>{activeJob.failed}</div>
                </div>
              </div>

              {/* Telemetry info */}
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                <div>Dispatched by: <strong>{activeJob.createdBy}</strong></div>
                <div>Ingestion Mode: <strong>{activeJob.source}</strong></div>
                <div>Created At: <strong>{new Date(activeJob.createdAt).toLocaleString()}</strong></div>
                {activeJob.completedAt && (
                  <div>Finished At: <strong>{new Date(activeJob.completedAt).toLocaleString()}</strong></div>
                )}
              </div>

              {/* Failed Records Table */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Validation Errors Breakdown ({activeJob.failedRecords.length})
                </div>

                {activeJob.failedRecords.length === 0 ? (
                  <div style={{ padding: '24px', backgroundColor: '#F0FDF4', borderRadius: '8px', textAlign: 'center', color: '#166534', fontSize: '13px' }}>
                    <CheckCircle2 size={24} style={{ margin: '0 auto 6px' }} />
                    <div>All records in this batch passed validation without error.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activeJob.failedRecords.map((rec, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '6px',
                          border: '1px solid #FECACA',
                          backgroundColor: '#FFF5F5',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                          <span>Roll: {rec.rollNumber} • {rec.name}</span>
                          <span style={{ color: 'var(--color-danger)' }}>{rec.status}</span>
                        </div>
                        <div style={{ color: '#7F1D1D', marginTop: '3px' }}>
                          Reason: {rec.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveJob(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Batch Modal */}
      {isTriggerModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsTriggerModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Play size={20} color="var(--bexo-blue-600)" />
                <span>Launch Student Provisioning Batch</span>
              </div>
              <button onClick={() => setIsTriggerModalOpen(false)} style={{ color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLaunchBatch}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="provisioning-target-college-select" className="form-label">Target Academic Institution *</label>
                  <select
                    id="provisioning-target-college-select"
                    name="targetCollegeId"
                    className="form-select"
                    value={selectedCollegeId}
                    onChange={(e) => setSelectedCollegeId(e.target.value)}
                  >
                    {colleges.filter((c) => c.status === 'Active').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code}) — {c.quota.allocated - c.quota.used} Seats Available
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Ingestion Mode</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setProvisionMode('Roll Number Range')}
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
                        border: `1.5px solid ${provisionMode === 'Roll Number Range' ? 'var(--bexo-blue-600)' : 'var(--border-light)'}`,
                        backgroundColor: provisionMode === 'Roll Number Range' ? 'var(--bexo-blue-50)' : 'white',
                        fontWeight: 600,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                      }}
                    >
                      Roll Number Range
                    </button>
                    <button
                      type="button"
                      onClick={() => setProvisionMode('CSV Upload')}
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
                        border: `1.5px solid ${provisionMode === 'CSV Upload' ? 'var(--bexo-blue-600)' : 'var(--border-light)'}`,
                        backgroundColor: provisionMode === 'CSV Upload' ? 'var(--bexo-blue-50)' : 'white',
                        fontWeight: 600,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                      }}
                    >
                      CSV / Excel Upload
                    </button>
                  </div>
                </div>

                {provisionMode === 'Roll Number Range' ? (
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="provisioning-start-roll-input" className="form-label">Start Roll Number *</label>
                      <input
                        id="provisioning-start-roll-input"
                        name="startRoll"
                        type="text"
                        className="form-input"
                        value={startRoll}
                        onChange={(e) => setStartRoll(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="provisioning-end-roll-input" className="form-label">End Roll Number *</label>
                      <input
                        id="provisioning-end-roll-input"
                        name="endRoll"
                        type="text"
                        className="form-input"
                        value={endRoll}
                        onChange={(e) => setEndRoll(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      border: '2px dashed var(--border-light)',
                      borderRadius: '8px',
                      padding: '24px',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      marginBottom: '16px',
                    }}
                  >
                    <UploadCloud size={28} color="var(--bexo-blue-600)" style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>Upload Roster Spreadsheet</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Supported: .CSV, .XLSX (Columns: ROLL_NUM, NAME, EMAIL, DEPT)</div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="provisioning-batch-count-input" className="form-label">Batch Size (Estimated Student Accounts)</label>
                  <input
                    id="provisioning-batch-count-input"
                    name="batchCount"
                    type="number"
                    className="form-input"
                    value={batchCount}
                    onChange={(e) => setBatchCount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsTriggerModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing Batch...' : 'Dispatch Queue Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
