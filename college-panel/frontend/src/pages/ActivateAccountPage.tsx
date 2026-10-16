import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/Router';
import { useAdmin } from '../context/AdminContext';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  KeyRound,
  Check,
} from 'lucide-react';

export const ActivateAccountPage: React.FC = () => {
  const { queryParams, navigate } = useRouter();
  const { validateInvitationToken, activateAccount } = useAdmin();

  const token = queryParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [tokenStatus, setTokenStatus] = useState<{
    valid: boolean;
    error?: string;
    invitation?: any;
    checked: boolean;
  }>({ valid: false, checked: false });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [activationSuccess, setActivationSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenStatus({
        valid: false,
        error: 'No activation token was provided in the invitation URL.',
        checked: true,
      });
      return;
    }

    const res = validateInvitationToken(token);
    setTokenStatus({
      valid: res.valid,
      error: res.error,
      invitation: res.invitation,
      checked: true,
    });
  }, [token, validateInvitationToken]);

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = hasMinLength && hasUpperCase && hasNumber && passwordsMatch && acceptedTerms;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await activateAccount(token, password);
      if (!result.success) {
        setSubmitError(result.error || 'Failed to activate account.');
      } else {
        setActivationSuccess(true);
        setTimeout(() => {
          navigate('/college/dashboard');
        }, 1800);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred during account activation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const invite = tokenStatus.invitation;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #0F172A 0%, #070D19 100%)',
        padding: '24px 16px',
        fontFamily: 'var(--font-sans)',
        color: '#F8FAFC',
      }}
    >
      <div
        className="auth-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '36px 32px',
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
              Campus Gateway
            </span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            Welcome to BEXO
          </h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#94A3B8' }}>
            Initialize your authorized institutional access credentials
          </p>
        </div>

        {/* Loading State */}
        {!tokenStatus.checked && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <div>Verifying cryptographic security token...</div>
          </div>
        )}

        {/* Token Error State */}
        {tokenStatus.checked && !tokenStatus.valid && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#F87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FECACA', margin: '0 0 8px' }}>
              Activation Token Invalid
            </h3>
            <p style={{ fontSize: '13px', color: '#FCA5A5', margin: '0 0 20px', lineHeight: 1.5 }}>
              {tokenStatus.error || 'This invitation link cannot be verified or has already expired.'}
            </p>

            <button
              className="btn btn-secondary"
              onClick={() => navigate('/login')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Proceed to Sign In
            </button>
          </div>
        )}

        {/* Activation Success Celebration */}
        {activationSuccess && (
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '28px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.5)',
              }}
            >
              <Check size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#A7F3D0', margin: '0 0 8px' }}>
              Account Activated Successfully!
            </h3>
            <p style={{ fontSize: '13.5px', color: '#D1FAE5', margin: '0 0 20px', lineHeight: 1.5 }}>
              Welcome aboard! Launching your personalized <strong>{invite?.collegeName}</strong> dashboard...
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#6EE7B7', fontSize: '12.5px' }}>
              <div className="spinner-sm" /> Redirecting to College Command Center...
            </div>
          </div>
        )}

        {/* Valid Token -> Form Active */}
        {tokenStatus.checked && tokenStatus.valid && !activationSuccess && (
          <div>
            {/* Institution Badge Box */}
            <div
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#1E3A8A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60A5FA',
                  }}
                >
                  <Building2 size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '14.5px', color: '#FFFFFF' }}>
                    {invite?.collegeName || 'Associated Institution'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                    User: <strong>{invite?.fullName}</strong> &bull; {invite?.email}
                  </div>
                </div>
                <span
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#60A5FA',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  {invite?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>

            {submitError && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#FCA5A5',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  marginBottom: '16px',
                }}
              >
                {submitError}
              </div>
            )}

            <form onSubmit={handleActivate}>
              {/* Password Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Create Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 40px 11px 14px',
                      borderRadius: '8px',
                      background: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: 'white',
                      fontSize: '13.5px',
                      outline: 'none',
                    }}
                    required
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

              {/* Confirm Password Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'white',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              {/* Password Requirements Checklist */}
              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '18px',
                  fontSize: '11.5px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasMinLength ? '#10B981' : '#94A3B8' }}>
                  <CheckCircle2 size={13} color={hasMinLength ? '#10B981' : '#64748B'} />
                  <span>8+ Characters</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasUpperCase ? '#10B981' : '#94A3B8' }}>
                  <CheckCircle2 size={13} color={hasUpperCase ? '#10B981' : '#64748B'} />
                  <span>1 Uppercase (A-Z)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasNumber ? '#10B981' : '#94A3B8' }}>
                  <CheckCircle2 size={13} color={hasNumber ? '#10B981' : '#64748B'} />
                  <span>1 Number (0-9)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: passwordsMatch ? '#10B981' : '#94A3B8' }}>
                  <CheckCircle2 size={13} color={passwordsMatch ? '#10B981' : '#64748B'} />
                  <span>Passwords Match</span>
                </div>
              </div>

              {/* Terms Checkbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#94A3B8',
                  marginBottom: '24px',
                  lineHeight: 1.5,
                }}
              >
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  style={{ marginTop: '3px', cursor: 'pointer' }}
                />
                <span>
                  I agree to the BEXO Institutional Service Terms, DPDP Platform Privacy Standards, and confirm my administrative role for {invite?.collegeName}.
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '10px',
                  background: isFormValid
                    ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
                    : 'rgba(51, 65, 85, 0.5)',
                  color: isFormValid ? 'white' : '#94A3B8',
                  fontWeight: 700,
                  fontSize: '14.5px',
                  border: 'none',
                  cursor: isFormValid && !isSubmitting ? 'pointer' : 'not-allowed',
                  boxShadow: isFormValid ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                {isSubmitting ? (
                  <span>Securing Credentials & Activating...</span>
                ) : (
                  <>
                    <span>Activate Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer Security Notice */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#64748B',
          }}
        >
          <Shield size={13} color="#3B82F6" />
          <span>SOC2 Type II Protected &bull; 256-Bit Cryptographic Enrollment</span>
        </div>
      </div>
    </div>
  );
};
