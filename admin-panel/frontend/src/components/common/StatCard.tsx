import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  badge?: string;
  badgeColor?: 'blue' | 'green' | 'amber' | 'red';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  iconBg = '#EFF6FF',
  iconColor = '#2563EB',
  badge,
  badgeColor = 'blue',
  onClick,
}) => {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="stat-top-row">
        <span className="stat-label">{label}</span>
        <div
          className="stat-icon-wrapper"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          <Icon size={19} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <div className="stat-value">{value}</div>
        {badge && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor:
                badgeColor === 'green'
                  ? 'var(--bg-success)'
                  : badgeColor === 'amber'
                  ? 'var(--bg-warning)'
                  : badgeColor === 'red'
                  ? 'var(--bg-danger)'
                  : 'var(--bexo-blue-50)',
              color:
                badgeColor === 'green'
                  ? 'var(--color-success)'
                  : badgeColor === 'amber'
                  ? 'var(--color-warning)'
                  : badgeColor === 'red'
                  ? 'var(--color-danger)'
                  : 'var(--bexo-blue-600)',
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {subtext && <div className="stat-subtext">{subtext}</div>}
    </div>
  );
};
