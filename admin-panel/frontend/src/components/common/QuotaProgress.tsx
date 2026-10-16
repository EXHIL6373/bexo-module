import React from 'react';

interface QuotaProgressProps {
  allocated: number;
  used: number;
  showLabels?: boolean;
  warningThreshold?: number;
  criticalThreshold?: number;
}

export const QuotaProgress: React.FC<QuotaProgressProps> = ({
  allocated,
  used,
  showLabels = true,
  warningThreshold = 80,
  criticalThreshold = 95,
}) => {
  const safeAllocated = allocated > 0 ? allocated : 1;
  const pct = Math.min(100, Math.round((used / safeAllocated) * 1000) / 10);

  let fillState: 'normal' | 'warning' | 'critical' = 'normal';
  if (pct >= criticalThreshold) {
    fillState = 'critical';
  } else if (pct >= warningThreshold) {
    fillState = 'warning';
  }

  return (
    <div className="quota-bar-wrapper">
      {showLabels && (
        <div className="quota-text-row">
          <span>
            <strong>{used.toLocaleString()}</strong> / {allocated.toLocaleString()}
          </span>
          <span style={{ color: fillState === 'critical' ? 'var(--color-danger)' : fillState === 'warning' ? 'var(--color-warning)' : 'inherit' }}>
            {pct}%
          </span>
        </div>
      )}
      <div className="quota-bar-track">
        <div
          className={`quota-bar-fill ${fillState}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
