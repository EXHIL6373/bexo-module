import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { useAdmin } from '../context/AdminContext';
import {
  Shield,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
} from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { navigate } = useRouter();
  const { requestPasswordReset, outboxEmails, setActiveEmailForPreview, addToast } = useAdmin();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedToken, setSubmittedToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await requestPasswordReset(email);
      if (!res.success) {
        setErrorMsg(res.error || 'Password reset request failed.');
      } else {
        setSubmittedToken(res.token || null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const latestResetEmail = outboxEmails.find(
    (e) => e.templateType === 'password_reset' && e.to.toLowerCase() === email.trim().toLowerCase()
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #0B152B 0%, #050B17 100%)',
        padding: '24px 16px',
        fontFamily: 'var(--font-sans)',
        color: '#F8FAFC',
      }}
    >
      <div
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
            <Shield size={14} color="#60A5FA" />
            <span style={{ fontWeight: 900, letterSpacing: '0.05em', color: '#60A5FA', fontSize: '15px' }}>BEXO</span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#93C5FD' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#E2E8F0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Credential Recovery
            </span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            Reset Password
          </h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#94A3B8' }}>
            Enter your official email to receive a single-use secure reset link
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

        {submittedToken ? (
          <div>
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '20px',
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              <CheckCircle size={36} color="#10B981" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#10B981', fontWeight: 700 }}>
                Reset Email Dispatched
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#CBD5E1', lineHeight: 1.5 }}>
                We have generated a time-sensitive, single-use password reset link for{' '}
                <strong style={{ color: '#FFFFFF' }}>{email}</strong>.
              </p>
            </div>

            {/* Quick action buttons for demo testing */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => navigate(`/reset-password?token=${submittedToken}`)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>Proceed to Reset Password Page</span>
                <ArrowRight size={16} />
              </button>

              {latestResetEmail && (
                <button
                  type="button"
                  onClick={() => setActiveEmailForPreview(latestResetEmail)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#93C5FD',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Inspect Dispatched BEXO Email</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}#/reset-password?token=${submittedToken}`;
                  navigator.clipboard.writeText(url);
                  addToast('info', 'Copied Link', 'Reset link copied to clipboard.');
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                  color: '#CBD5E1',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Copy size={13} />
                <span>Copy Direct Reset Link</span>
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                Your Registered Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="e.g. raj@abc.edu or kavinbalaji@atbexo.com"
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

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: 'white',
                fontWeight: 700,
                fontSize: '14px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '18px',
              }}
            >
              <span>{isSubmitting ? 'Generating Secure Token...' : 'Send Password Reset Link'}</span>
              <ArrowRight size={16} />
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
