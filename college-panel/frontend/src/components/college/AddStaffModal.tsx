import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Role, CollegeInvitation } from '../../types';
import {
  UserPlus,
  X,
  Mail,
  User,
  Phone,
  Briefcase,
  CheckCircle,
  Copy,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  collegeId: string;
}

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
  isOpen,
  onClose,
  collegeId,
}) => {
  const { createStaffInvitation, getCollegeById, outboxEmails, setActiveEmailForPreview, addToast } = useAdmin();
  const college = getCollegeById(collegeId);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('Academic Operations');
  const [role, setRole] = useState<Role>('college_coordinator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdInvitation, setCreatedInvitation] = useState<CollegeInvitation | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Full name and email are mandatory.');
      return;
    }

    if (role !== 'college_coordinator' && role !== 'college_staff') {
      setErrorMsg('Institutional administrators may only invite College Coordinator or College Staff.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const invite = await createStaffInvitation(collegeId, {
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        designation: designation.trim(),
        department: department.trim(),
        role,
      });
      setCreatedInvitation(invite);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch staff invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdInvitation) return;
    const url = `${window.location.origin}${window.location.pathname}#/activate-account?token=${createdInvitation.token}`;
    navigator.clipboard.writeText(url);
    addToast('info', 'Link Copied', 'Invitation link copied to clipboard.');
  };

  const latestEmail = createdInvitation
    ? outboxEmails.find((e) => e.to.toLowerCase() === createdInvitation.email.toLowerCase())
    : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        className="modal-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60A5FA',
              }}
            >
              <UserPlus size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Invite College Staff</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                Scope: {college?.name || 'Assigned College'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {createdInvitation ? (
            <div>
              <div
                style={{
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  marginBottom: '20px',
                }}
              >
                <CheckCircle size={40} color="#10B981" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', color: '#065F46', fontWeight: 800 }}>
                  Staff Invitation Dispatched!
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#047857' }}>
                  An invitation has been generated and dispatched to{' '}
                  <strong>{createdInvitation.email}</strong> with role{' '}
                  <strong>{createdInvitation.role.replace('_', ' ').toUpperCase()}</strong>.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    padding: '11px',
                    borderRadius: '8px',
                    backgroundColor: '#1E293B',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Copy size={15} />
                  <span>Copy Secure Invitation Link</span>
                </button>

                {latestEmail && (
                  <button
                    type="button"
                    onClick={() => setActiveEmailForPreview(latestEmail)}
                    style={{
                      padding: '11px',
                      borderRadius: '8px',
                      backgroundColor: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      color: '#1D4ED8',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <ExternalLink size={15} />
                    <span>View Dispatched Email Preview</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    color: '#475569',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errorMsg && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#991B1B',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <ShieldAlert size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Full Name */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: '7px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <User size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Official Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. priya@college.edu"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: '7px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <Mail size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              {/* Mobile */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Contact Mobile
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: '7px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <Phone size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              {/* Designation & Department */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Designation
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Asst. Professor"
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 34px',
                        borderRadius: '7px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    <Briefcase size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '7px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Institutional Role *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: role === 'college_coordinator' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                      backgroundColor: role === 'college_coordinator' ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="radio"
                        name="staffRole"
                        checked={role === 'college_coordinator'}
                        onChange={() => setRole('college_coordinator')}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                        College Coordinator
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', marginLeft: '18px' }}>
                      Can provision students, view services, and manage daily operations.
                    </span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: role === 'college_staff' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                      backgroundColor: role === 'college_staff' ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="radio"
                        name="staffRole"
                        checked={role === 'college_staff'}
                        onChange={() => setRole('college_staff')}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                        College Staff
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', marginLeft: '18px' }}>
                      Operational access for student verification and support.
                    </span>
                  </label>
                </div>
                <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#64748B' }}>
                  * College administrators can only invite Coordinators and Staff. Corporate company roles cannot be created here.
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'Sending...' : 'Create & Send Invitation'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
