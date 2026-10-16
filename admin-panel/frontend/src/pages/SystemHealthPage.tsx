import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Activity,
  RefreshCw,
  Server,
  Database,
  ShieldCheck,
  Mail,
  Cpu,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const SystemHealthPage: React.FC = () => {
  const { systemHealth, refreshSystemHealth } = useAdmin();

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <Activity size={26} color="var(--bexo-blue-600)" />
            <span>System Health & Microservices Telemetry</span>
          </h1>
          <p>
            Real-time infrastructure probes monitoring API gateway latency, PostgreSQL connection poolers, and background workers.
          </p>
        </div>

        <div className="page-actions-group">
          <button className="btn btn-secondary btn-sm" onClick={refreshSystemHealth}>
            <RefreshCw size={14} />
            <span>Probe Health Endpoints</span>
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px', marginBottom: '24px' }}>
        {systemHealth.map((svc, idx) => {
          let Icon = Server;
          if (svc.name.includes('PostgreSQL')) Icon = Database;
          else if (svc.name.includes('Provisioning')) Icon = Cpu;
          else if (svc.name.includes('OTP')) Icon = ShieldCheck;
          else if (svc.name.includes('SMTP')) Icon = Mail;
          else if (svc.name.includes('Cloudflare')) Icon = Server;

          return (
            <div key={idx} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      backgroundColor: svc.status === 'Healthy' ? '#ECFDF5' : '#FFFBEB',
                      color: svc.status === 'Healthy' ? 'var(--color-success)' : 'var(--color-warning)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                      {svc.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Latency: <strong style={{ color: 'var(--text-primary)' }}>{svc.latencyMs}ms</strong> • Uptime: {svc.uptimePct}%
                    </div>
                  </div>
                </div>

                <StatusBadge status={svc.status} size="sm" />
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '14px', lineHeight: 1.4 }}>
                {svc.details}
              </p>

              {svc.lastIncident && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px 10px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    color: '#991B1B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                  <span>{svc.lastIncident}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Operational Diagnostic Checklist */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Production Environment Telemetry</span>
          <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 700 }}>● ALL SYSTEMS NOMINAL</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '13px' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700 }}>DATABASE POOL (SUPABASE)</div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>aws-0-ap-southeast-1.pooler.supabase.com:6543</div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-success)' }}>18 / 60 Active Connections (Healthy)</div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700 }}>R2 CLOUDFLARE ASSETS</div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>pub-dea3489e0d644467a9a61d41406280f0.r2.dev</div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-success)' }}>0 Errors / 45ms P99 Latency</div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700 }}>MSG91 SMS GATEWAY</div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>Template otp_test_authu (Indian Carrier Relay)</div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-success)' }}>99.1% Delivery Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
