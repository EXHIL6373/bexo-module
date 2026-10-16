import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { useAdmin } from '../context/AdminContext';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Check,
  X,
} from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const { queryParams, navigate } = useRouter();
  const { validatePasswordResetToken, resetPasswordWithToken } = useAdmin();

  const token = queryParams.get('token') || '';
  const validation = validatePasswordResetToken(token);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Password rules validation
  const rules = [
    { label: 'At least 8 characters long', valid: password.length >= 8 },
    { label: 'Contains uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'Contains a number', valid: /[0-9]/.test(password) },
    { label: 'Contains a special character', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const allRulesPassed = rules.every((r) => r.valid);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg('Missing password reset token.');
      return;
    }
    if (!allRulesPassed) {
      setErrorMsg('Please ensure your new password satisfies all security requirements.');
      return;
    }
    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await resetPasswordWithToken(token, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to reset password.');
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          maxWidth: '480px',
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
            <KeyRound size={14} color="#60A5FA" />
            <span style={{ fontWeight: 900, letterSpacing: '0.05em', color: '#60A5FA', fontSize: '15px' }}>BEXO</span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#93C5FD' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#E2E8F0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Create New Password
            </span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            Set New Password
          </h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#94A3B8' }}>
            Create a secure password for your BEXO account
          </p>
        </div>

        {/* Invalid token screen */}
        {!validation.valid ? (
          <div>
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                padding: '24px 20px',
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '24px',
              }}
            >
              <AlertCircle size={40} color="#EF4444" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#FCA5A5', fontWeight: 700 }}>
                Invalid or Expired Link
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#CBD5E1', lineHeight: 1.5 }}>
                {validation.error || 'This password reset link is invalid or has already expired for security.'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
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
                <span>Request New Reset Link</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#94A3B8',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </button>
            </div>
          </div>
        ) : isSuccess ? (
          /* Success Screen */
          <div>
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '24px 20px',
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '24px',
              }}
            >
              <CheckCircle size={42} color="#10B981" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '17px', color: '#10B981', fontWeight: 700 }}>
                Password Updated Successfully
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#CBD5E1', lineHeight: 1.5 }}>
                Your password has been changed. You can now log in with your new credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: 'white',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>Sign In with New Password</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          /* Reset Form */
          <form onSubmit={handleSubmit}>
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(30, 41, 59, 0.6)',
                borderRadius: '8px',
                marginBottom: '18px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '12.5px',
                color: '#94A3B8',
              }}
            >
              Resetting credentials for:{' '}
              <strong style={{ color: '#F8FAFC' }}>{validation.email}</strong>
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
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#EF4444' }} />
                <div style={{ lineHeight: 1.4 }}>{errorMsg}</div>
              </div>
            )}

            {/* New Password */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create strong password"
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
                  required
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
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  required
                />
                <Lock
                  size={16}
                  color="#94A3B8"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Security checklist */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Security Requirements
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                {rules.map((rule, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    {rule.valid ? (
                      <Check size={14} color="#10B981" />
                    ) : (
                      <X size={14} color="#64748B" />
                    )}
                    <span style={{ color: rule.valid ? '#10B981' : '#94A3B8' }}>{rule.label}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  {passwordsMatch ? (
                    <Check size={14} color="#10B981" />
                  ) : (
                    <X size={14} color="#64748B" />
                  )}
                  <span style={{ color: passwordsMatch ? '#10B981' : '#94A3B8' }}>Passwords match</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !allRulesPassed || !passwordsMatch}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background:
                  !allRulesPassed || !passwordsMatch
                    ? 'rgba(59, 130, 246, 0.4)'
                    : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: 'white',
                fontWeight: 700,
                fontSize: '14px',
                cursor: !allRulesPassed || !passwordsMatch || isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <span>{isSubmitting ? 'Updating Password...' : 'Save New Password'}</span>
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
