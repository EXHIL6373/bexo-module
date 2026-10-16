import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Role } from '../../types';
import { UserPlus, X, Mail } from 'lucide-react';

interface AddStaffModalProps {
  collegeId?: string;
  collegeName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
  collegeId,
  collegeName,
  isOpen,
  onClose,
}) => {
  const { addStaffUser, colleges } = useAdmin();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Placement Cell');
  const [role, setRole] = useState<Role>(collegeId ? 'college_staff' : 'ops');
  const [selectedCollegeId, setSelectedCollegeId] = useState(collegeId || (colleges[0]?.id || ''));
  const [sendInvite, setSendInvite] = useState(true);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Staff member name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Valid official email address is required.');
      return;
    }

    const targetColId = collegeId || (role.startsWith('college_') ? selectedCollegeId : undefined);
    const targetCol = colleges.find((c) => c.id === targetColId);

    addStaffUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      department: department.trim() || undefined,
      role,
      collegeId: targetColId,
      collegeName: targetCol?.name,
      isActive: true,
      accountStatus: 'ACTIVE',
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <UserPlus size={20} color="var(--bexo-blue-600)" />
            <span>Add Authorized Staff User</span>
          </div>
          <button onClick={onClose} style={{ color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="staff-name-input" className="form-label">Full Name *</label>
              <input
                id="staff-name-input"
                name="name"
                type="text"
                className="form-input"
                placeholder="e.g. Dr. S. Karthikeyan"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="staff-email-input" className="form-label">Official Email *</label>
                <input
                  id="staff-email-input"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="staff@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="staff-phone-input" className="form-label">Mobile Phone</label>
                <input
                  id="staff-phone-input"
                  name="phone"
                  type="tel"
                  className="form-input"
                  placeholder="+91 98422 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="staff-role-select" className="form-label">Assign Role *</label>
                <select
                  id="staff-role-select"
                  name="role"
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  {collegeId ? (
                    <>
                      <option value="college_admin">College Admin (College Portal Only)</option>
                      <option value="college_coordinator">College Coordinator (College Portal Only)</option>
                      <option value="college_staff">College Staff (College Portal Only)</option>
                    </>
                  ) : (
                    <>
                      <option value="super_admin">👑 Super Admin (Full Platform Authority)</option>
                      <option value="admin">🛡️ Platform Admin (BEXO Admin Panel)</option>
                      <option value="ops">Company Operations</option>
                      <option value="support">Customer Support</option>
                      <option value="finance">Billing & Finance</option>
                      <option value="college_admin">College Admin (College Portal Only)</option>
                      <option value="college_coordinator">College Coordinator (College Portal Only)</option>
                      <option value="college_staff">College Staff (College Portal Only)</option>
                    </>
                  )}
                </select>
                {role.startsWith('college_') ? (
                  <div style={{ fontSize: '11px', color: '#BE123C', marginTop: '4px', fontWeight: 600 }}>
                    ⛔ College role: Restricted to institutional portal. Admin Panel access is blocked.
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
                    🛡️ Corporate role: Authorized to access BEXO Central Control Center.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="staff-department-input" className="form-label">Department / Unit</label>
                <input
                  id="staff-department-input"
                  name="department"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Computer Science / Placement"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            </div>

            {!collegeId && role.startsWith('college_') && (
              <div className="form-group">
                <label htmlFor="staff-associated-college-select" className="form-label">Associated College *</label>
                <select
                  id="staff-associated-college-select"
                  name="selectedCollegeId"
                  className="form-select"
                  value={selectedCollegeId}
                  onChange={(e) => setSelectedCollegeId(e.target.value)}
                >
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginTop: '10px',
              }}
            >
              <input
                type="checkbox"
                id="sendInviteCheck"
                name="sendInvite"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="sendInviteCheck" style={{ fontSize: '12.5px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} color="var(--bexo-blue-600)" />
                Send automated credential invite link via official email
              </label>
            </div>

            {error && (
              <div style={{ color: 'var(--color-danger)', fontSize: '12.5px', marginTop: '12px' }}>
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Create & Dispatch Access
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
