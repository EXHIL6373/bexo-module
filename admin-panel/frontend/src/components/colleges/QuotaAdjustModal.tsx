import React, { useState } from 'react';
import { College } from '../../types';
import { useAdmin } from '../../context/AdminContext';
import { BarChart3, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { QuotaProgress } from '../common/QuotaProgress';

interface QuotaAdjustModalProps {
  college: College;
  isOpen: boolean;
  onClose: () => void;
}

export const QuotaAdjustModal: React.FC<QuotaAdjustModalProps> = ({ college, isOpen, onClose }) => {
  const { updateQuota } = useAdmin();
  const [newAllocated, setNewAllocated] = useState(college.quota.allocated);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAllocated < college.quota.used) {
      setError(`Allocated quota cannot be lower than the already provisioned student count (${college.quota.used}).`);
      return;
    }
    if (!reason.trim()) {
      setError('Operational reason is strictly required for quota revisions.');
      return;
    }
    updateQuota(college.id, Number(newAllocated), reason.trim());
    onClose();
  };

  const diff = newAllocated - college.quota.allocated;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <BarChart3 size={20} color="var(--bexo-blue-600)" />
            <span>Adjust Student Quota — {college.code}</span>
          </div>
          <button onClick={onClose} style={{ color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Current State Summary */}
            <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                CURRENT ALLOCATION CAPACITY
              </div>
              <QuotaProgress allocated={college.quota.allocated} used={college.quota.used} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '8px', color: 'var(--text-secondary)' }}>
                <span>Allocated: {college.quota.allocated.toLocaleString()}</span>
                <span>Used: {college.quota.used.toLocaleString()}</span>
                <span>Remaining: {(college.quota.allocated - college.quota.used).toLocaleString()}</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="quota-seats-allocation-input" className="form-label">
                <span>New Quota Allocation (Seats) *</span>
                {diff !== 0 && (
                  <span style={{ fontSize: '12px', color: diff > 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700 }}>
                    {diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()} seats
                  </span>
                )}
              </label>
              <input
                id="quota-seats-allocation-input"
                name="newAllocatedSeats"
                type="number"
                step="50"
                className="form-input"
                value={newAllocated}
                onChange={(e) => {
                  setNewAllocated(Number(e.target.value));
                  if (error) setError('');
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="quota-justification-reason-input" className="form-label">
                <span>Administrative Justification / Reason *</span>
              </label>
              <textarea
                id="quota-justification-reason-input"
                name="quotaReason"
                className="form-textarea"
                rows={3}
                placeholder="e.g. Approved additional 1,000 seats per commercial addendum BEXO-MOU-2026-A1"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                This will be permanently recorded in the immutable audit log and quota change history.
              </span>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)', fontSize: '12.5px', marginTop: '10px' }}>
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Confirm & Apply Quota
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
