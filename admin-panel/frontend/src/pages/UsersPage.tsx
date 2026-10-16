import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { StaffUser, Role } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { AddStaffModal } from '../components/colleges/AddStaffModal';
import {
  Users2,
  Shield,
  UserPlus,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Mail,
  Phone,
  Building,
  KeyRound,
  Trash2,
  Ban,
  RotateCcw,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { staffUsers, updateStaffUser, deleteStaffUser, currentUser, colleges } = useAdmin();
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');

  const permissionsList = [
    { key: 'access_central_admin', label: 'Central Admin Panel Access (Exclusive Control Center)', super: true, admin: true, ops: false, finance: false, support: false, clgAdmin: false, clgStaff: false },
    { key: 'view_colleges', label: 'View Colleges Directory', super: true, admin: true, ops: true, finance: true, support: true, clgAdmin: false, clgStaff: false },
    { key: 'create_colleges', label: 'Onboard / Create Colleges', super: true, admin: true, ops: true, finance: false, support: false, clgAdmin: false, clgStaff: false },
    { key: 'suspend_colleges', label: 'Suspend / Reactivate Colleges', super: true, admin: true, ops: false, finance: false, support: false, clgAdmin: false, clgStaff: false },
    { key: 'manage_quota', label: 'Set & Reallocate Quota', super: true, admin: true, ops: true, finance: false, support: false, clgAdmin: false, clgStaff: false },
    { key: 'manage_services', label: 'Assign Institutional Services', super: true, admin: true, ops: true, finance: false, support: false, clgAdmin: false, clgStaff: false },
    { key: 'manage_agreements', label: 'MOU & Legal Approval', super: true, admin: true, ops: false, finance: true, support: false, clgAdmin: false, clgStaff: false },
    { key: 'view_students', label: 'Cross-College Student Roster', super: true, admin: true, ops: true, finance: false, support: true, clgAdmin: false, clgStaff: false },
    { key: 'provision_students', label: 'Bulk Student Provisioning', super: true, admin: true, ops: true, finance: false, support: false, clgAdmin: true, clgStaff: true },
    { key: 'manage_payments', label: 'Payments & Financial Ledger', super: true, admin: false, ops: false, finance: true, support: false, clgAdmin: false, clgStaff: false },
    { key: 'view_audit', label: 'View Audit & System Health', super: true, admin: true, ops: true, finance: false, support: false, clgAdmin: false, clgStaff: false },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <Users2 size={26} color="var(--bexo-blue-600)" />
            <span>Users & Role-Based Access Control (RBAC)</span>
          </h1>
          <p>
            Manage company-side operators, college administrators, and fine-grained authorization permission boundaries.
          </p>
        </div>

        <div className="page-actions-group">
          <button className="btn btn-primary" onClick={() => setIsAddStaffOpen(true)}>
            <UserPlus size={16} />
            <span>Add Staff User</span>
          </button>
        </div>
      </div>

      {/* Enterprise Authority Notice */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          backgroundColor: '#F8FAFC',
          borderLeft: '4px solid #F59E0B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={22} color="#D97706" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0F172A' }}>
              Central Administration Security Architecture: Super Admin & Admin Only
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
              Active Super Admins: <strong>Kavinbalaji S K</strong> & <strong>Ezhilarasan M.</strong> have company-wide authority over all {colleges.length} colleges.
              College users operate solely within institutional portals and are strictly blocked from the Central Admin Panel.
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <span
            style={{
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 800,
              border: '1px solid #FDE68A',
            }}
          >
            Multi-Tenant Isolation
          </span>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="tabs-nav-bar">
        <button
          className={`tab-nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users2 size={15} /> Staff & User Directory ({staffUsers.length})
        </button>
        <button
          className={`tab-nav-item ${activeTab === 'matrix' ? 'active' : ''}`}
          onClick={() => setActiveTab('matrix')}
        >
          <Shield size={15} /> RBAC Permissions Matrix
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="card">
          <div className="table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Contact Email</th>
                  <th>Role</th>
                  <th>Scope Association</th>
                  <th>Account Status</th>
                  <th>Last Login</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: u.role === 'super_admin' ? '#F59E0B' : u.role.startsWith('college') ? '#FFE4E6' : '#EFF6FF',
                            color: u.role === 'super_admin' ? '#000000' : u.role.startsWith('college') ? '#E11D48' : 'var(--bexo-blue-600)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '12.5px',
                          }}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {u.name}
                            {u.role === 'super_admin' && <span title="BEXO Super Admin">👑</span>}
                          </div>
                          {u.department && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.department}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ fontSize: '13px' }}>{u.email}</td>

                    <td>
                      {u.role === 'super_admin' ? (
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            border: '1px solid #FDE68A',
                            fontSize: '11px',
                            fontWeight: 800,
                          }}
                        >
                          👑 SUPER ADMIN
                        </span>
                      ) : u.role === 'admin' ? (
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: '#EFF6FF',
                            color: '#1E40AF',
                            border: '1px solid #BFDBFE',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          🛡️ PLATFORM ADMIN
                        </span>
                      ) : u.role.startsWith('college') ? (
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: '#FFE4E6',
                            color: '#9F1239',
                            border: '1px solid #FECDD3',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          ⛔ COLLEGE SCOPE (ADMIN BLOCKED)
                        </span>
                      ) : (
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            border: '1px solid #CBD5E1',
                            fontSize: '11px',
                          }}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      )}
                    </td>

                    <td>
                      {u.collegeName ? (
                        <div>
                          <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 600 }}>
                            {u.collegeName}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#E11D48', fontWeight: 600 }}>
                            Isolated College Portal Only
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>
                          Company-Wide (BEXO HQ)
                        </span>
                      )}
                    </td>

                    <td>
                      <StatusBadge status={u.isActive ? 'Active' : 'Suspended'} size="sm" />
                    </td>

                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {u.lastLoginAt}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => updateStaffUser(u.id, { isActive: !u.isActive })}
                        >
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </button>
                        {u.id !== currentUser.id && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--color-danger)', padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => deleteStaffUser(u.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* RBAC Permissions Matrix */
        <div className="card">
          <div className="card-header">
            <span className="card-title">Role-Based Permission Matrix</span>
          </div>
          <div className="table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Permission / Capability</th>
                  <th>Super Admin</th>
                  <th>Operations</th>
                  <th>Finance</th>
                  <th>Support</th>
                  <th>College Admin</th>
                  <th>College Staff</th>
                </tr>
              </thead>
              <tbody>
                {permissionsList.map((perm) => (
                  <tr key={perm.key}>
                    <td style={{ fontWeight: 600 }}>{perm.label}</td>
                    <td>{perm.super ? <CheckCircle2 size={16} color="var(--color-success)" /> : <XCircle size={16} color="#CBD5E1" />}</td>
                    <td>{perm.ops ? <CheckCircle2 size={16} color="var(--color-success)" /> : <XCircle size={16} color="#CBD5E1" />}</td>
                    <td>{perm.finance ? <CheckCircle2 size={16} color="var(--color-success)" /> : <XCircle size={16} color="#CBD5E1" />}</td>
                    <td>{perm.support ? <CheckCircle2 size={16} color="var(--color-success)" /> : <XCircle size={16} color="#CBD5E1" />}</td>
                    <td>{perm.clgAdmin ? <CheckCircle2 size={16} color="var(--color-success)" /> : <XCircle size={16} color="#CBD5E1" />}</td>
                    <td>{perm.clgStaff ? <CheckCircle2 size={16} color="var(--color-success)" /> : <XCircle size={16} color="#CBD5E1" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
      />
    </div>
  );
};
