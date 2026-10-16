import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { AuditLogItem } from '../types';
import {
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Lock,
  User,
  Clock,
  Terminal,
  X,
} from 'lucide-react';

export const AuditPage: React.FC = () => {
  const { auditLogs } = useAdmin();
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const filtered = auditLogs.filter((l) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      l.action.toLowerCase().includes(q) ||
      l.actorName.toLowerCase().includes(q) ||
      l.entityName.toLowerCase().includes(q) ||
      l.ip.includes(q)
    );
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <ShieldCheck size={26} color="var(--bexo-blue-600)" />
            <span>Audit & Compliance Security Center</span>
          </h1>
          <p>
            Immutable event telemetry recording administrative actions, quota adjustments, lifecycle state shifts, and access revocations.
          </p>
        </div>
      </div>

      {/* Security Banner */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC',
          borderLeft: '4px solid var(--color-success)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Lock size={18} color="var(--color-success)" />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>
            Audit records are append-only and cryptographically immutable from the admin interface.
          </span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {auditLogs.length} Verified Entries
        </span>
      </div>

      {/* Search Input */}
      <div className="card" style={{ padding: '12px 18px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '380px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            id="audit-search-input"
            name="searchQuery"
            type="text"
            className="form-input"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px' }}
            placeholder="Search action, administrator, entity, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Audit Table */}
      <div className="card">
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Administrator</th>
                <th>Role</th>
                <th>Action</th>
                <th>Target Entity</th>
                <th>IP Address</th>
                <th>Outcome</th>
                <th style={{ textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td>
                    <strong style={{ color: 'var(--text-primary)' }}>{log.actorName}</strong>
                  </td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '10.5px' }}>
                      {log.actorRole}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--bexo-blue-600)', fontSize: '12.5px' }}>
                      {log.action}
                    </strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{log.entityName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.entity}</div>
                  </td>
                  <td>
                    <code style={{ fontSize: '11.5px', color: '#64748B' }}>{log.ip}</code>
                  </td>
                  <td>
                    <span style={{ color: log.result === 'Success' ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700, fontSize: '12px' }}>
                      {log.result}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye size={12} /> Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Entry Modal */}
      {selectedLog && (
        <div className="modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Terminal size={20} color="var(--bexo-blue-600)" />
                <span>Audit Entry #{selectedLog.id}</span>
              </div>
              <button onClick={() => setSelectedLog(null)} style={{ color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: 'var(--bg-surface-subtle)', padding: '14px', borderRadius: '8px', fontSize: '12.5px' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>ACTION</div>
                  <div style={{ fontWeight: 700, color: 'var(--bexo-blue-600)' }}>{selectedLog.action}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>TIMESTAMP</div>
                  <div>{new Date(selectedLog.timestamp).toISOString()}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>ACTOR</div>
                  <div style={{ fontWeight: 600 }}>{selectedLog.actorName} ({selectedLog.actorRole})</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>IP / ENVIRONMENT</div>
                  <div>{selectedLog.ip}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Operational Reason / Notes
                </div>
                <div style={{ marginTop: '4px', padding: '10px 14px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '13px' }}>
                  {selectedLog.reason || 'Standard administrative execution.'}
                </div>
              </div>

              {/* State Diffs */}
              {(selectedLog.beforeState || selectedLog.afterState) && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    State Transition Payload
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626', marginBottom: '4px' }}>BEFORE STATE</div>
                      <pre style={{ fontSize: '11px', overflowX: 'auto', color: '#475569' }}>
                        {JSON.stringify(selectedLog.beforeState || { empty: true }, null, 2)}
                      </pre>
                    </div>

                    <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', marginBottom: '4px' }}>AFTER STATE</div>
                      <pre style={{ fontSize: '11px', overflowX: 'auto', color: '#475569' }}>
                        {JSON.stringify(selectedLog.afterState || { updated: true }, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
