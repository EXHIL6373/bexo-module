import React, { useEffect } from 'react';
import { useRouter } from '../router/Router';
import { useAdmin } from '../context/AdminContext';
import { ShieldAlert, ArrowLeft, Building2, Lock, ShieldCheck } from 'lucide-react';

export const CorporateAccessDeniedPage: React.FC = () => {
  const { path, navigate } = useRouter();
  const { currentUser, colleges, logAction, switchToSuperAdmin } = useAdmin();

  const college = colleges.find(
    (c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName
  );

  useEffect(() => {
    logAction(
      'CORPORATE_ADMIN_ROUTE_BLOCKED',
      'SecurityGateway',
      currentUser.id,
      currentUser.name,
      `Multi-Tenant Isolation Enforcement: College user attempted unauthorized navigation to corporate route "${path}". Access terminated.`
    );
  }, [path, currentUser.id, currentUser.name, logAction]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '620px',
          width: '100%',
          backgroundColor: '#1E293B',
          borderRadius: '20px',
          border: '1px solid #334155',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <ShieldAlert size={40} />
        </div>

        <div
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '999px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#F87171',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          403 Forbidden • Multi-Tenant Isolation Gate Active
        </div>

        <h1
          style={{
            margin: '0 0 10px',
            fontSize: '22px',
            fontWeight: 800,
            color: '#F8FAFC',
          }}
        >
          Company-Wide Admin Routes Restricted
        </h1>

        <p
          style={{
            margin: '0 0 24px',
            fontSize: '13.5px',
            color: '#94A3B8',
            lineHeight: 1.6,
          }}
        >
          Under BEXO strict multi-tenant isolation policy, institutional college accounts are restricted to their authorized college operational dashboard and cannot access central enterprise management consoles.
        </p>

        {/* Tenant Identity Breakdown Card */}
        <div
          style={{
            backgroundColor: '#0F172A',
            borderRadius: '12px',
            border: '1px solid #334155',
            padding: '16px 20px',
            textAlign: 'left',
            marginBottom: '28px',
            fontSize: '13px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Lock size={13} color="#64748B" />
            <span>Authenticated Institutional Identity</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94A3B8' }}>Authenticated User:</span>
            <span style={{ color: '#F1F5F9', fontWeight: 700 }}>
              {currentUser.name} ({currentUser.email})
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94A3B8' }}>Institutional Role:</span>
            <span
              style={{
                color: '#60A5FA',
                fontWeight: 700,
                textTransform: 'uppercase',
                fontSize: '11.5px',
              }}
            >
              {currentUser.role.replace('_', ' ')}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94A3B8' }}>Scoped Institution:</span>
            <span style={{ color: '#F1F5F9', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={14} color="#3B82F6" />
              <span>{college?.name || currentUser.collegeName || 'Institutional College'}</span>
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94A3B8' }}>Enforced Tenant ID:</span>
            <span style={{ color: '#38BDF8', fontFamily: 'monospace', fontWeight: 700 }}>
              {currentUser.collegeId || 'TENANT_NOT_SET'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94A3B8' }}>Blocked Route Attempt:</span>
            <span style={{ color: '#EF4444', fontFamily: 'monospace', fontWeight: 600 }}>
              {path}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {import.meta.env.VITE_COLLEGE_PORTAL_URL && (
            <a
              href={import.meta.env.VITE_COLLEGE_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '10px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
              }}
            >
              <ArrowLeft size={16} />
              <span>Go to BEXO College Portal</span>
            </a>
          )}

          <button
            onClick={() => {
              navigate('/login');
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: import.meta.env.VITE_COLLEGE_PORTAL_URL ? 'transparent' : '#2563EB',
              color: '#FFFFFF',
              border: import.meta.env.VITE_COLLEGE_PORTAL_URL ? '1px solid #334155' : 'none',
              fontWeight: 600,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to Admin Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
