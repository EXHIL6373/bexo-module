import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { useCollege } from '../context/CollegeContext';
import { apiClient } from '../services/apiClient';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { navigate } = useRouter();
  const { login } = useCollege();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your institutional email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Authentication failure.');
      } else {
        navigate(res.redirectPath);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('••••••••••••');
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await login(demoEmail, 'SecureDemoPassword123!');
      if (res.success) {
        navigate(res.redirectPath);
      } else {
        setErrorMsg(res.error || 'Quick login failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login attempt failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDemo = apiClient.isDemoMode();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #0B152B 0%, #050B17 100%)',
        padding: '24px 16px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#F8FAFC',
      }}
    >
      <div
        className="auth-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '36px 30px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(37, 99, 235, 0.15)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 16px',
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '999px',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontWeight: 900, letterSpacing: '0.05em', color: '#60A5FA', fontSize: '15px' }}>BEXO</span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#93C5FD' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#E2E8F0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Institutional Portal
            </span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            College Sign In
          </h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#94A3B8' }}>
            Student Onboarding, Access Governance & Quota Operations
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#FCA5A5',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#EF4444' }} />
            <div style={{ lineHeight: 1.4 }}>{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
              Institutional Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="name@college.edu or name@institution.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 38px',
                  borderRadius: '8px',
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  fontSize: '13.5px',
                  outline: 'none',
                }}
                required
              />
              <Mail
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#CBD5E1' }}>Password</label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                style={{ background: 'none', border: 'none', color: '#60A5FA', fontSize: '12px', cursor: 'pointer', padding: 0 }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 38px',
                  borderRadius: '8px',
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  fontSize: '13.5px',
                  outline: 'none',
                }}
              />
              <Lock
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: '14.5px',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In to College Portal'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Development Persona Switcher - Exclusively College Scoped */}
        {isDemo && (
          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#93C5FD', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              <Sparkles size={12} />
              <span>Demo Institutional Personas (Local Test Mode)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('venkatesh.r@psgtech.edu')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#E2E8F0',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>🏛️ Prof. Venkatesh &bull; <strong>PSG Tech (College A)</strong></span>
                <span style={{ fontSize: '10.5px', color: '#10B981' }}>Active Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('preetha.s@kct.ac.in')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#E2E8F0',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>🏛️ Dr. Preetha &bull; <strong>Kumaraguru (College B)</strong></span>
                <span style={{ fontSize: '10.5px', color: '#10B981' }}>Active Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('tsridhar@cit.edu.in')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#FCA5A5',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>⚠️ Dr. Sridhar &bull; <strong>CIT Coimbatore (Suspended)</strong></span>
                <span style={{ fontSize: '10.5px', color: '#EF4444' }}>Test Rejection</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('kavinbalaji@atbexo.com')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(148, 163, 184, 0.08)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: '#94A3B8',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>🚫 Kavinbalaji &bull; <strong>BEXO Corporate Super Admin</strong></span>
                <span style={{ fontSize: '10.5px', color: '#F59E0B' }}>Test 403 Gate</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Notice */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: '#64748B', lineHeight: 1.5 }}>
          BEXO Enterprise Institutional Control Gateway &bull; Multi-Tenant Isolation Protection Active.
        </div>
      </div>
    </div>
  );
};
