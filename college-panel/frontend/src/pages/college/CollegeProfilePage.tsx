import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  User,
  Shield,
  KeyRound,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { getRoleDisplayName, getRoleBadgeStyle } from '../../lib/collegePermissions';

export const CollegeProfilePage: React.FC = () => {
  const {
    currentUser,
    colleges,
    updateUserProfile,
    changeUserPassword,
    addToast,
    currentCollege,
    isCorporateAdmin,
  } = useAdmin();

  const college = currentCollege || colleges.find(
    (c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName
  ) || (isCorporateAdmin ? colleges[0] : undefined);

  // Profile Form State
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [designation, setDesignation] = useState(currentUser.designation || '');
  const [department, setDepartment] = useState(currentUser.department || '');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('error', 'Validation Error', 'Full Name is required.');
      return;
    }
    updateUserProfile({
      name: name.trim(),
      phone: phone.trim(),
      designation: designation.trim(),
      department: department.trim(),
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');

    if (newPassword.length < 8) {
      setPwdError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('New password and confirmation do not match.');
      return;
    }

    const res = changeUserPassword(currentPassword, newPassword);
    if (!res.success) {
      setPwdError(res.error || 'Failed to update password.');
    } else {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const badgeStyle = getRoleBadgeStyle(currentUser.role);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
          My Account Profile
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
          Manage your personal credentials, contact details, and institutional account settings
        </p>
      </div>

      {/* Identity Summary Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px 28px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 800,
            }}
          >
            {currentUser.name.charAt(0)}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                {currentUser.name}
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: badgeStyle.bg,
                  color: badgeStyle.color,
                  border: `1px solid ${badgeStyle.border}`,
                }}
              >
                {getRoleDisplayName(currentUser.role)}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '13px', color: '#64748B' }}>
              <span>{currentUser.email}</span>
              <span>•</span>
              <span>{college?.name || currentUser.collegeName || 'Institutional College'}</span>
              <span>•</span>
              <span>Scope ID: {currentUser.collegeId || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '999px',
              backgroundColor: currentUser.accountStatus === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2',
              color: currentUser.accountStatus === 'ACTIVE' ? '#166534' : '#991B1B',
            }}
          >
            ● {currentUser.accountStatus}
          </span>
        </div>
      </div>

      {/* Main Grid: Details Form & Password Change */}
      <div className="cards-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Profile Information Form */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
            Personal Details
          </h3>

          <form onSubmit={handleUpdateProfile}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Official Email (Read-Only)
                </label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#64748B', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Designation / Title
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Head of Career Services"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Training & Placements"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Phone / Mobile Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98401 23456"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Save Profile Details
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
            Security & Password
          </h3>
          <p style={{ margin: '0 0 18px', fontSize: '12.5px', color: '#64748B' }}>
            Ensure your account is protected with a secure password containing at least 8 characters.
          </p>

          {pwdError && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECDD3',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#991B1B',
                fontSize: '12.5px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={15} />
              <span>{pwdError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Lock size={14} />
                  <span>Update Password</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
