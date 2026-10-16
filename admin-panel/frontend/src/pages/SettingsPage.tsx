import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  Settings,
  User,
  Shield,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentUser, resetAllData, addToast } = useAdmin();

  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      addToast('error', 'Password Error', 'Password must be at least 8 characters.');
      return;
    }
    setPasswordSuccess(true);
    setCurrPassword('');
    setNewPassword('');
    addToast('success', 'Security Key Updated', 'Admin credentials revised successfully.');
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <Settings size={26} color="var(--bexo-blue-600)" />
            <span>Administrator Profile & Platform Settings</span>
          </h1>
          <p>
            Manage active operator credentials, administrative session controls, and platform demonstration state.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
        {/* Left: Profile Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <User size={18} color="var(--bexo-blue-600)" />
              <span>Active Operator Profile</span>
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bexo-navy-950)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 800,
                  border: '2px solid var(--bexo-blue-600)',
                }}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {currentUser.name}
                  {currentUser.role === 'super_admin' && <span title="BEXO Super Admin">👑</span>}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{currentUser.email}</div>
                <div style={{ fontSize: '11px', color: currentUser.role === 'super_admin' ? '#D97706' : '#059669', fontWeight: 800, marginTop: '2px' }}>
                  Role: {currentUser.role === 'super_admin' ? '👑 SUPER ADMIN (PLATFORM EXECUTIVE)' : currentUser.role.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Operational Scope
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
                {currentUser.collegeName || 'Company-Wide BEXO Headquarters Authority'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Last Verified Login
              </div>
              <div style={{ fontSize: '13px', marginTop: '2px' }}>{currentUser.lastLoginAt}</div>
            </div>
          </div>
        </div>

        {/* Right: Security & Platform Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Security & Password */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <KeyRound size={18} color="var(--bexo-blue-600)" />
                <span>Security & Credential Management</span>
              </span>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="card-body">
                <div className="form-group">
                  <label htmlFor="settings-current-password" className="form-label">Current Password</label>
                  <input
                    id="settings-current-password"
                    name="currentPassword"
                    type="password"
                    className="form-input"
                    placeholder="••••••••••••"
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="settings-new-password" className="form-label">New Administrative Passphrase</label>
                  <input
                    id="settings-new-password"
                    name="newPassword"
                    type="password"
                    className="form-input"
                    placeholder="At least 8 characters with numbers and symbols"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                {passwordSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', fontSize: '13px', marginBottom: '12px' }}>
                    <CheckCircle2 size={16} />
                    <span>Credentials updated successfully!</span>
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-sm">
                  Update Security Credentials
                </button>
              </div>
            </form>
          </div>

          {/* Demonstration Environment Controls */}
          <div className="card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
            <div className="card-header">
              <span className="card-title">Platform Reset & Sandbox State</span>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Reset local simulation store to factory demo state. This will restore default colleges (PSG, KCT, BIT, CIT), seed provisioning jobs, sample audit logs, and clear custom changes.
              </p>
              <button className="btn btn-secondary btn-sm" style={{ color: 'var(--color-warning)' }} onClick={resetAllData}>
                <RotateCcw size={14} />
                <span>Reset Demo State</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
