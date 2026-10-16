import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AddStaffModal } from '../../components/college/AddStaffModal';
import { StaffUser } from '../../types';
import {
  Users2,
  UserPlus,
  Mail,
  Copy,
  ExternalLink,
  RotateCcw,
  Ban,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
  Shield,
  Clock,
  Briefcase,
  Search,
  Edit2,
} from 'lucide-react';
import { canPerformCollegeAction } from '../../lib/collegePermissions';

export const CollegeStaffPage: React.FC = () => {
  const {
    currentUser,
    colleges,
    getScopedStaffForCollege,
    invitations,
    resendInvitation,
    revokeInvitation,
    suspendCollegeStaff,
    activateCollegeStaff,
    outboxEmails,
    setActiveEmailForPreview,
    addToast,
    currentCollege,
    isCorporateAdmin,
  } = useAdmin();

  const college = currentCollege || colleges.find(
    (c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName
  ) || (isCorporateAdmin ? colleges[0] : undefined);

  const collegeId = college?.id || currentUser.collegeId || '';
  const isSuspended = college?.status === 'Suspended' || currentUser.accountStatus === 'SUSPENDED';

  const staff = getScopedStaffForCollege();

  const canManageStaff = canPerformCollegeAction(currentUser.role, 'MANAGE_STAFF');
  const canInviteStaff = canPerformCollegeAction(currentUser.role, 'INVITE_STAFF');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    const sStatus = s.accountStatus || (s.isActive ? 'ACTIVE' : 'INVITED');
    const matchesStatus = statusFilter === 'ALL' || sStatus === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCopyInviteLink = (inviteId?: string) => {
    if (!inviteId) return;
    const invite = invitations.find((i) => i.id === inviteId);
    if (!invite) return;
    const url = `${window.location.origin}${window.location.pathname}#/activate-account?token=${invite.token}`;
    navigator.clipboard.writeText(url);
    addToast('info', 'Link Copied', `Invitation link for ${invite.email} copied.`);
  };

  const handlePreviewEmail = (email: string) => {
    const outboxItem = outboxEmails.find((e) => e.to.toLowerCase() === email.toLowerCase());
    if (outboxItem) {
      setActiveEmailForPreview(outboxItem);
    } else {
      addToast('info', 'Email Record', `No recent sent email cached for ${email}.`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-actions-bar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
              College Staff & Access
            </h1>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
              }}
            >
              {staff.length} Members
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
            Manage institutional coordinators and operational staff for {college?.name || 'this college'}
          </p>
        </div>

        {canInviteStaff && (
          <button
            onClick={() => setIsAddOpen(true)}
            disabled={isSuspended}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: isSuspended ? '#94A3B8' : '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isSuspended ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isSuspended ? 'none' : '0 4px 10px rgba(37, 99, 235, 0.25)',
            }}
          >
            <UserPlus size={15} />
            <span>+ Add Staff</span>
          </button>
        )}
      </div>

      {/* Permission & Suspension Alerts */}
      {!canManageStaff && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            color: '#334155',
          }}
        >
          <Shield size={18} color="#2563EB" style={{ flexShrink: 0 }} />
          <div>
            <strong>View-Only Operational Access:</strong> Staff administration, role assignments, and account management are restricted to College Administrators.
          </div>
        </div>
      )}

      {isSuspended && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECDD3',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            color: '#991B1B',
          }}
        >
          <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
          <div>
            <strong>Institution Suspended:</strong> Onboarding new staff members is disabled while the college is in suspended status.
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="page-filter-bar"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          padding: '12px 18px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: '1',
            minWidth: '240px',
            height: '38px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '0 12px',
          }}
        >
          <Search size={15} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search staff by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              color: '#0F172A',
              backgroundColor: 'transparent',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '12px' }}
            >
              Clear
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              height: '38px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              color: '#334155',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="college_admin">College Admin</option>
            <option value="college_coordinator">Department Coordinator</option>
            <option value="college_staff">College Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: '38px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              color: '#334155',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INVITED">Invited</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Staff Table Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 18px' }}>Staff Member</th>
                <th style={{ padding: '12px 18px' }}>Institutional Role</th>
                <th style={{ padding: '12px 18px' }}>Department</th>
                <th style={{ padding: '12px 18px' }}>Account Status</th>
                <th style={{ padding: '12px 18px' }}>Last Activity</th>
                <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
                    No staff members match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((u) => {
                  const status = u.accountStatus || (u.isActive ? 'ACTIVE' : 'INVITED');
                  const hasInvite = Boolean(u.invitationId);

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: '#EFF6FF',
                              color: '#2563EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '12px',
                            }}
                          >
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{u.name}</div>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 18px' }}>
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor:
                              u.role === 'college_admin'
                                ? '#FEF3C7'
                                : u.role === 'college_coordinator'
                                ? '#EFF6FF'
                                : '#F1F5F9',
                            color:
                              u.role === 'college_admin'
                                ? '#92400E'
                                : u.role === 'college_coordinator'
                                ? '#1D4ED8'
                                : '#334155',
                          }}
                        >
                          {u.role === 'college_admin'
                            ? 'College Admin'
                            : u.role === 'college_coordinator'
                            ? 'Department Coordinator'
                            : u.role === 'college_staff'
                            ? 'College Staff'
                            : u.role.replace('_', ' ').toUpperCase()}
                        </span>
                        {u.designation && (
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                            {u.designation}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 18px', color: '#475569' }}>
                        {u.department || 'Academic Affairs'}
                      </td>

                      <td style={{ padding: '12px 18px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor:
                              status === 'ACTIVE'
                                ? '#DCFCE7'
                                : status === 'INVITED'
                                ? '#EFF6FF'
                                : status === 'SUSPENDED'
                                ? '#FEE2E2'
                                : '#F1F5F9',
                            color:
                              status === 'ACTIVE'
                                ? '#166534'
                                : status === 'INVITED'
                                ? '#1D4ED8'
                                : status === 'SUSPENDED'
                                ? '#991B1B'
                                : '#64748B',
                          }}
                        >
                          {status}
                        </span>
                      </td>

                      <td style={{ padding: '12px 18px', color: '#64748B', fontSize: '12px' }}>
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never logged in'}
                      </td>

                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {canManageStaff && status === 'INVITED' && (
                            <>
                              <button
                                onClick={() => handleCopyInviteLink(u.invitationId)}
                                title="Copy Invitation Link"
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #E2E8F0',
                                  backgroundColor: '#FFFFFF',
                                  color: '#334155',
                                  cursor: 'pointer',
                                  fontSize: '11.5px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Copy size={13} />
                                <span>Copy Link</span>
                              </button>

                              <button
                                onClick={() => u.invitationId && resendInvitation(u.invitationId)}
                                title="Resend Invitation"
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #BFDBFE',
                                  backgroundColor: '#EFF6FF',
                                  color: '#1D4ED8',
                                  cursor: 'pointer',
                                  fontSize: '11.5px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <RotateCcw size={13} />
                                <span>Resend</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handlePreviewEmail(u.email)}
                            title="Inspect Dispatched Email"
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0',
                              backgroundColor: '#F8FAFC',
                              color: '#64748B',
                              cursor: 'pointer',
                              fontSize: '11.5px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Mail size={13} />
                            <span>Email</span>
                          </button>

                          {canManageStaff && (
                            <>
                              {status === 'ACTIVE' ? (
                                <button
                                  onClick={() => suspendCollegeStaff(u.id, 'Suspended by College Admin')}
                                  title="Suspend Access"
                                  style={{
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #FECDD3',
                                    backgroundColor: '#FFF1F2',
                                    color: '#E11D48',
                                    cursor: 'pointer',
                                    fontSize: '11.5px',
                                  }}
                                >
                                  Suspend
                                </button>
                              ) : status === 'SUSPENDED' ? (
                                <button
                                  onClick={() => activateCollegeStaff(u.id)}
                                  title="Reactivate Access"
                                  style={{
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #BBF7D0',
                                    backgroundColor: '#F0FDF4',
                                    color: '#16A34A',
                                    cursor: 'pointer',
                                    fontSize: '11.5px',
                                  }}
                                >
                                  Activate
                                </button>
                              ) : null}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        collegeId={collegeId}
      />
    </div>
  );
};
