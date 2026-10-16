import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ShieldCheck, Ban } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toLowerCase().trim();

  let badgeClass = 'status-badge';
  let Icon = Clock;

  if (['active', 'completed', 'paid', 'healthy', 'approved'].includes(norm)) {
    badgeClass += ' active';
    Icon = CheckCircle2;
  } else if (['pending', 'processing', 'queued', 'partially completed', 'expiring soon', 'warning', 'draft'].includes(norm)) {
    badgeClass += ' pending';
    Icon = AlertTriangle;
  } else if (['suspended', 'failed', 'critical', 'rejected', 'expired', 'terminated'].includes(norm)) {
    badgeClass += ' suspended';
    Icon = XCircle;
  } else if (['revoked'].includes(norm)) {
    badgeClass += ' revoked';
    Icon = Ban;
  } else {
    badgeClass += ' service';
    Icon = ShieldCheck;
  }

  return (
    <span className={badgeClass} style={{ fontSize: size === 'sm' ? '11px' : '12px', padding: size === 'sm' ? '2px 7px' : '4px 10px' }}>
      <Icon size={size === 'sm' ? 12 : 13} />
      <span>{status}</span>
    </span>
  );
};
