import React, { useState } from 'react';
import { College, Role } from '../../types';
import { useAdmin } from '../../context/AdminContext';
import { Shield, UserPlus, Mail, Phone, Briefcase, X, Sparkles, Send, Copy, Check } from 'lucide-react';

interface AddCollegeAdminModalProps {
  college: College;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddCollegeAdminModal: React.FC<AddCollegeAdminModalProps> = ({
  college,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createCollegeAdminInvitation, setActiveEmailForPreview, outboxEmails } = useAdmin();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [designation, setDesignation] = useState('Head of Placement & Corporate Relations');
  const [role, setRole] = useState<Role>('college_admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Full Name and Email address are strictly required.');
      return;
    }

    // Basic email format check
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid official institutional email.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const invite = await createCollegeAdminInvitation(college.id, {
        name: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        designation: designation.trim(),
        role,
      });

      setCreatedInvite(invite);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdInvite) return;
    const fullUrl = `${window.location.origin}${window.location.pathname}#/activate-account?token=${createdInvite.token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenEmailPreview = () => {
    if (!createdInvite) return;
    const emailItem = outboxEmails.find((e) => e.to === createdInvite.email);
    if (emailItem) {
      setActiveEmailForPreview(emailItem);
    }
  };

  const handleClose = () => {
    setCreatedInvite(null);
    setFullName('');
    setEmail('');
    setMobile('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '95%', padding: '28px' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--bexo-blue-600)',
              }}
            >
              <UserPlus size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Add College Administrator</h2>
              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Authorizing institutional governance access for <strong>{college.name}</strong>
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="icon-btn">
            <X size={18} />
          </button>
        </div>

        {/* Success View after Invitation Created */}
        {createdInvite ? (
          <div>
            <div
              style={{
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#059669',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <Check size={26} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#065F46', margin: '0 0 6px' }}>
                Invitation Sent Successfully!
              </h3>
              <p style={{ fontSize: '13px', color: '#047857', margin: 0, lineHeight: 1.5 }}>
                A single-use cryptographic invitation has been generated for <strong>{createdInvite.fullName}</strong> ({createdInvite.email}).
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '22px',
                fontSize: '12.5px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Account Status:</span>
                <span className="status-badge warning" style={{ display: 'inline-block', width: 'fit-content' }}>
                  INVITED (Pending Activation)
                </span>

                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Assigned Role:</span>
                <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{createdInvite.role}</span>

                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Expires In:</span>
                <span>7 Days ({new Date(createdInvite.expiresAt).toLocaleDateString()})</span>

                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Activation Token:</span>
                <code style={{ fontSize: '11px', background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px' }}>
                  {createdInvite.token}
                </code>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCopyLink}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {copiedLink ? <Check size={15} color="#16A34A" /> : <Copy size={15} />}
                  <span>{copiedLink ? 'Activation Link Copied!' : 'Copy Invitation Link'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleOpenEmailPreview}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Mail size={15} />
                  <span>View Dispatched Email</span>
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleClose}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit}>
            {errorMsg && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  marginBottom: '16px',
                }}
              >
                {errorMsg}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '12.5px' }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dr. Raj Kumar or Prof. S. Venkat"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '12.5px' }}>
                  Official Email *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="raj@college.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '12.5px' }}>
                  Mobile Number
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 98400 12345"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '12.5px' }}>
                  Designation / Title
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Principal, Dean of Placements..."
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '12.5px' }}>
                  Authorized Role *
                </label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="college_admin">COLLEGE_ADMIN (Full Institutional Authority)</option>
                  <option value="college_coordinator">COLLEGE_COORDINATOR (Placement & Batch)</option>
                  <option value="college_staff">COLLEGE_STAFF (Department Support)</option>
                </select>
              </div>
            </div>

            {/* Zero-Trust Notice */}
            <div
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '12px',
                color: '#1E40AF',
                marginBottom: '22px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <Shield size={18} style={{ flexShrink: 0, color: '#2563EB' }} />
              <div>
                <strong>Zero-Trust Security Guarantee:</strong> Passwords are never sent via email. The recipient will establish their own credentials through an expiring, single-use activation token.
              </div>
            </div>

            {/* Form Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span>Generating Token...</span>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Create & Send Invitation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
