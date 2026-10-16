import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  impactItems?: string[];
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  impactItems,
  requireReason = false,
  reasonLabel = 'Administrative Reason',
  reasonPlaceholder = 'Please state the operational justification for this action...',
  confirmLabel = 'Confirm Action',
  confirmVariant = 'danger',
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError('A valid reason is required to proceed with this administrative action.');
      return;
    }
    setError('');
    onConfirm(reason.trim());
    setReason('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {confirmVariant === 'danger' ? (
              <ShieldAlert color="var(--color-danger)" size={22} />
            ) : (
              <AlertTriangle color="var(--color-warning)" size={22} />
            )}
            <span>{title}</span>
          </div>
          <button onClick={onClose} style={{ color: '#64748B', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
            {description}
          </p>

          {impactItems && impactItems.length > 0 && (
            <div
              style={{
                backgroundColor: confirmVariant === 'danger' ? '#FEF2F2' : '#FFFBEB',
                border: `1px solid ${confirmVariant === 'danger' ? '#FECACA' : '#FDE68A'}`,
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: confirmVariant === 'danger' ? '#991B1B' : '#92400E',
                  marginBottom: '8px',
                }}
              >
                Immediate System Impact:
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {impactItems.map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#1E293B' }}>
                    <CheckCircle2 size={15} color={confirmVariant === 'danger' ? '#DC2626' : '#D97706'} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {requireReason && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="confirmation-reason-input" className="form-label">
                <span>{reasonLabel} <strong style={{ color: 'var(--color-danger)' }}>*</strong></span>
              </label>
              <textarea
                id="confirmation-reason-input"
                name="confirmationReason"
                className="form-textarea"
                rows={3}
                placeholder={reasonPlaceholder}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
              />
              {error && (
                <div style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px' }}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`btn ${confirmVariant === 'danger' ? 'btn-danger' : confirmVariant === 'warning' ? 'btn-primary' : 'btn-primary'} btn-sm`}
            style={confirmVariant === 'warning' ? { backgroundColor: 'var(--color-warning)', color: 'white' } : {}}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
