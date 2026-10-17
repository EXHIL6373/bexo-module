import React from 'react';
import { useRouter } from '../router/Router';
import { useCollege } from '../context/CollegeContext';
import { authService } from '../services';
import {
  User,
  ShieldCheck,
  Smartphone,
  Mail,
  Award,
  BookOpen,
  LogOut,
  ExternalLink,
  Sparkles,
  Lock,
} from 'lucide-react';

export const ConsumerUserPage: React.FC = () => {
  const { navigate } = useRouter();
  const { currentUser, logout } = useCollege();

  const handleLogout = async () => {
    await authService.logout();
    logout();
    navigate('/login');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#090D16',
        color: '#F8FAFC',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '860px' }}>
        {/* Navigation Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '36px',
            paddingBottom: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: 'white',
                fontSize: '18px',
              }}
            >
              B
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em' }}>BEXO Identity Portal</div>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>Consumer & Student Services Hub</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        {/* Identity Overview Hero */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 700,
                color: 'white',
                boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)',
              }}
            >
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                  {currentUser?.name || 'Verified BEXO User'}
                </h1>
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#6EE7B7',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ShieldCheck size={12} />
                  Active Identity
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Smartphone size={14} color="#60A5FA" />
                  {currentUser?.phone || 'Verified Phone Connected'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} color="#A78BFA" />
                  {currentUser?.email || 'Individual Account'}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '12px 18px',
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Account Persona</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#38BDF8', marginTop: '2px' }}>
              {currentUser?.role === 'college_admin' ? 'College Management' : 'Standard Consumer'}
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(37, 99, 235, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <BookOpen size={22} color="#60A5FA" />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 8px' }}>Learning & Skill Pathways</h3>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Explore open courses, interactive hands-on coding challenges, and career acceleration modules.
              </p>
            </div>
            <div style={{ marginTop: '20px', fontSize: '13px', color: '#38BDF8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              Open Catalog <ChevronRight size={14} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Award size={22} color="#A78BFA" />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 8px' }}>Verified Credentials</h3>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Tamper-proof verifiable credentials and digital skill certificates issued under your primary phone identity.
              </p>
            </div>
            <div style={{ marginTop: '20px', fontSize: '13px', color: '#A78BFA', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              View Credentials <ChevronRight size={14} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Lock size={22} color="#34D399" />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 8px' }}>Security & Linked Accounts</h3>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Manage your primary mobile phone, linked Google account, active devices, and privacy settings.
              </p>
            </div>
            <div style={{ marginTop: '20px', fontSize: '13px', color: '#34D399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              Account Settings <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChevronRight: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);
