import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { GitPullRequest, Search, Filter, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const RequestsPage: React.FC = () => {
  const { approvals } = useAdmin();
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const filtered = approvals.filter((a) => {
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    const matchesType = typeFilter === 'All' || a.type === typeFilter;
    return matchesStatus && matchesType;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <GitPullRequest size={26} color="var(--bexo-blue-600)" />
            <span>Institutional Requests Ledger</span>
          </h1>
          <p>
            Full historical audit tracking of all operational requests submitted by partner colleges and internal operators.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <label htmlFor="requests-status-filter" style={{ cursor: 'pointer' }}>Status:</label>
          <select
            id="requests-status-filter"
            name="statusFilter"
            className="form-select"
            style={{ width: 'auto', padding: '5px 10px', fontSize: '12.5px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <label htmlFor="requests-type-filter" style={{ cursor: 'pointer' }}>Category:</label>
          <select
            id="requests-type-filter"
            name="typeFilter"
            className="form-select"
            style={{ width: 'auto', padding: '5px 10px', fontSize: '12.5px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Quota Increase">Quota Increase</option>
            <option value="New College">New College</option>
            <option value="Service Activation">Service Activation</option>
            <option value="Agreement Request">Agreement Request</option>
            <option value="Access Request">Access Request</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Category</th>
                <th>Institution</th>
                <th>Title / Description</th>
                <th>Requester</th>
                <th>Submitted Date</th>
                <th>Decision Status</th>
                <th>Reviewer Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr key={req.id}>
                  <td><strong>{req.id}</strong></td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: '#F1F5F9', color: '#334155', fontSize: '11px' }}>
                      {req.type}
                    </span>
                  </td>
                  <td><strong style={{ color: 'var(--text-primary)' }}>{req.collegeName}</strong></td>
                  <td style={{ maxWidth: '320px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{req.details.title}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {req.details.description}
                    </div>
                  </td>
                  <td>
                    <div>{req.requester}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.requesterRole}</div>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <StatusBadge status={req.status} size="sm" />
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {req.decisionReason || '—'}
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
