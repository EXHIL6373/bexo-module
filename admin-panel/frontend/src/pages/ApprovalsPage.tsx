import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { ApprovalRequest, ApprovalStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Building,
  User,
  AlertTriangle,
  Layers,
  BarChart3,
  FileText,
  Sliders,
} from 'lucide-react';

export const ApprovalsPage: React.FC = () => {
  const { approvals, approveRequest, rejectRequest, currentUser } = useAdmin();

  const [filterStatus, setFilterStatus] = useState<'All' | ApprovalStatus>('Pending');
  const [selectedForDecision, setSelectedForDecision] = useState<{
    request: ApprovalRequest;
    decision: 'Approve' | 'Reject';
  } | null>(null);

  const filteredApprovals = approvals.filter((a) => {
    if (filterStatus === 'All') return true;
    return a.status === filterStatus;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <CheckSquare size={26} color="var(--bexo-blue-600)" />
            <span>Approval Center</span>
          </h1>
          <p>
            Review and adjudicate operational requests including quota expansions, service activations, and college lifecycle transitions.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tabs-nav-bar">
        <button
          className={`tab-nav-item ${filterStatus === 'Pending' ? 'active' : ''}`}
          onClick={() => setFilterStatus('Pending')}
        >
          <Clock size={15} /> Pending Actions ({approvals.filter((a) => a.status === 'Pending').length})
        </button>
        <button
          className={`tab-nav-item ${filterStatus === 'Approved' ? 'active' : ''}`}
          onClick={() => setFilterStatus('Approved')}
        >
          <CheckCircle2 size={15} /> Approved History ({approvals.filter((a) => a.status === 'Approved').length})
        </button>
        <button
          className={`tab-nav-item ${filterStatus === 'Rejected' ? 'active' : ''}`}
          onClick={() => setFilterStatus('Rejected')}
        >
          <XCircle size={15} /> Rejected ({approvals.filter((a) => a.status === 'Rejected').length})
        </button>
        <button
          className={`tab-nav-item ${filterStatus === 'All' ? 'active' : ''}`}
          onClick={() => setFilterStatus('All')}
        >
          All Requests ({approvals.length})
        </button>
      </div>

      {/* Approvals Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredApprovals.length === 0 ? (
          <div className="card" style={{ padding: '50px 20px', textAlign: 'center' }}>
            <CheckCircle2 size={36} color="var(--color-success)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>No requests in this queue</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              All submitted operational items have been resolved.
            </p>
          </div>
        ) : (
          filteredApprovals.map((req) => {
            const isPending = req.status === 'Pending';
            let priorityBadgeColor = '#2563EB';
            let priorityBg = '#EFF6FF';
            if (req.priority === 'Critical') {
              priorityBadgeColor = '#DC2626';
              priorityBg = '#FEF2F2';
            } else if (req.priority === 'High') {
              priorityBadgeColor = '#D97706';
              priorityBg = '#FFFBEB';
            }

            return (
              <div key={req.id} className="card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--bexo-blue-600)',
                        flexShrink: 0,
                      }}
                    >
                      {req.type === 'Quota Increase' ? (
                        <BarChart3 size={20} />
                      ) : req.type === 'Service Activation' ? (
                        <Layers size={20} />
                      ) : req.type === 'Agreement Request' ? (
                        <FileText size={20} />
                      ) : (
                        <Building size={20} />
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>
                          {req.details.title}
                        </span>
                        <StatusBadge status={req.status} size="sm" />
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: priorityBg,
                            color: priorityBadgeColor,
                            textTransform: 'uppercase',
                          }}
                        >
                          {req.priority} Priority
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>Request ID: <strong>{req.id}</strong></span>
                        <span>•</span>
                        <span>College: <strong>{req.collegeName}</strong></span>
                        <span>•</span>
                        <span>Requester: {req.requester} ({req.requesterRole})</span>
                        <span>•</span>
                        <span>{new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons if Pending */}
                  {isPending && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => setSelectedForDecision({ request: req, decision: 'Reject' })}
                      >
                        Reject
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelectedForDecision({ request: req, decision: 'Approve' })}
                      >
                        Approve Request
                      </button>
                    </div>
                  )}
                </div>

                {/* Description & Impact */}
                <div style={{ marginTop: '14px', padding: '14px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <p>{req.details.description}</p>

                  {req.details.requestedValue && (
                    <div style={{ marginTop: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Requested Change: {req.details.currentValue ? `${req.details.currentValue} → ` : ''}
                      <span style={{ color: 'var(--bexo-blue-600)' }}>{req.details.requestedValue}</span>
                    </div>
                  )}

                  {req.decisionReason && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                      <strong>Decision Note:</strong> {req.decisionReason} — <em>Reviewed by {req.reviewedBy} at {new Date(req.reviewedAt || '').toLocaleDateString()}</em>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Decision Modal */}
      {selectedForDecision && (
        <ConfirmationModal
          isOpen={true}
          title={`${selectedForDecision.decision} Request — ${selectedForDecision.request.id}?`}
          description={
            selectedForDecision.decision === 'Approve'
              ? `Approving this request will automatically apply operational updates across the BEXO platform for ${selectedForDecision.request.collegeName}.`
              : `Rejecting this request will mark it as denied and send notification to ${selectedForDecision.request.requester}.`
          }
          impactItems={
            selectedForDecision.decision === 'Approve'
              ? [
                  'Target college quota or service status will be immediately revised',
                  'Requester will receive automated confirmation',
                  'Permanent decision record logged in audit feed',
                ]
              : [
                  'Requested expansion or activation will not be granted',
                  'Requester will be notified of rejection reason',
                ]
          }
          requireReason={true}
          reasonLabel="Decision Justification"
          reasonPlaceholder={`State the administrative basis for ${selectedForDecision.decision.toLowerCase()}ing this request...`}
          confirmLabel={`Confirm ${selectedForDecision.decision}`}
          confirmVariant={selectedForDecision.decision === 'Approve' ? 'primary' : 'danger'}
          onConfirm={(reason) => {
            if (selectedForDecision.decision === 'Approve') {
              approveRequest(selectedForDecision.request.id, reason);
            } else {
              rejectRequest(selectedForDecision.request.id, reason);
            }
            setSelectedForDecision(null);
          }}
          onClose={() => setSelectedForDecision(null)}
        />
      )}
    </div>
  );
};
