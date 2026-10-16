import React, { useState } from 'react';
import { useRouter } from '../../router/Router';
import { useAdmin } from '../../context/AdminContext';
import {
  User,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  Award,
  Layers,
  Edit3,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Send,
  XCircle,
} from 'lucide-react';

interface CollegeStudentDetailPageProps {
  studentId?: string;
}

export const CollegeStudentDetailPage: React.FC<CollegeStudentDetailPageProps> = ({ studentId: propStudentId }) => {
  const { path, params, navigate } = useRouter();
  const studentId = propStudentId || params?.id || (path.startsWith('/college/students/') ? path.split('/')[3] : '');
  const {
    currentUser,
    colleges,
    getStudentById,
    updateStudent,
    studentEntitlements,
    provisioningJobs,
    auditLogs,
    requestStudentRevocation,
    addToast,
    currentCollege,
    isCorporateAdmin,
  } = useAdmin();

  const college = currentCollege || colleges.find(
    (c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName
  ) || (isCorporateAdmin ? colleges[0] : undefined);

  const collegeId = college?.id || currentUser.collegeId || '';
  const isSuspended = college?.status === 'Suspended' || currentUser.accountStatus === 'SUSPENDED';

  // Retrieve student with tenant isolation check
  const { student, isTenantViolation } = getStudentById(studentId);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editBatch, setEditBatch] = useState('');

  // Revoke Request Modal State
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [revokeService, setRevokeService] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  if (isTenantViolation) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #FECDD3',
          padding: '48px 24px',
          textAlign: 'center',
          maxWidth: '640px',
          margin: '40px auto',
          boxShadow: '0 10px 25px -5px rgba(225, 29, 72, 0.1)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#FEE2E2',
            color: '#E11D48',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <ShieldAlert size={36} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: '#9F1239' }}>
          403 Access Denied: Tenant Isolation Gate Active
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#BE123C', lineHeight: 1.6 }}>
          This student record belongs to an external institution. BEXO multi-tenant security architecture strictly prevents cross-institutional inspection. This access attempt has been logged in security audit logs.
        </p>
        <button
          onClick={() => navigate('/college/students')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Return to Enrolled Students
        </button>
      </div>
    );
  }

  if (!student) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '48px 24px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '40px auto',
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
          Student Record Not Found
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#64748B' }}>
          The requested student ID "{studentId}" could not be located in your college directory.
        </p>
        <button
          onClick={() => navigate('/college/students')}
          style={{
            padding: '9px 18px',
            borderRadius: '8px',
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Back to Students List
        </button>
      </div>
    );
  }

  // Related entitlements for this student
  const studentEnts = studentEntitlements.filter(
    (e) => e.studentId === student.id || e.rollNumber === student.rollNumber
  );

  // Related provisioning jobs
  const studentJobs = provisioningJobs.filter(
    (j) => j.id === student.provisioningJobId || j.collegeId === student.collegeId
  ).slice(0, 3);

  // Student audit history
  const studentLogs = auditLogs
    .filter((l) => l.entityId === student.id || l.entityName?.includes(student.name))
    .slice(0, 5);

  const openEdit = () => {
    setEditName(student.name);
    setEditEmail(student.email);
    setEditPhone(student.phone || '');
    setEditDepartment(student.department);
    setEditCourse(student.course || 'B.Tech');
    setEditBatch(student.batch || '2022 - 2026');
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      addToast('error', 'Validation Error', 'Name and Email are required.');
      return;
    }

    updateStudent(student.id, {
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      phone: editPhone.trim(),
      department: editDepartment.trim(),
      course: editCourse.trim(),
      batch: editBatch.trim(),
    });

    setIsEditOpen(false);
  };

  const handleRevokeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeService) return;

    requestStudentRevocation(student.id, revokeService, revokeReason || 'Standard administrative request');
    setIsRevokeOpen(false);
    setRevokeReason('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => navigate('/college/students')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#64748B',
            fontSize: '13px',
            fontWeight: 700,
            padding: '4px 0',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Students Roster</span>
        </button>
      </div>

      {/* Student Profile Header Card */}
      <div
        className="page-actions-bar"
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 800,
            }}
          >
            {student.name.charAt(0)}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
                {student.name}
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: student.accessStatus === 'Active' ? '#DCFCE7' : '#FEE2E2',
                  color: student.accessStatus === 'Active' ? '#166534' : '#991B1B',
                }}
              >
                {student.accessStatus}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '13px', color: '#64748B' }}>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Roll No: {student.rollNumber}</span>
              <span>•</span>
              <span>{student.department}</span>
              <span>•</span>
              <span>{student.collegeName}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={openEdit}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              border: '1px solid #CBD5E1',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Edit3 size={14} />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => navigate('/college/give-access')}
            disabled={isSuspended}
            style={{
              padding: '9px 18px',
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
            }}
          >
            <Sparkles size={14} />
            <span>Grant Service Access</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Details & Services */}
      <div className="cards-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Left Column: Academic & Contact Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Academic Details */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              padding: '22px',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
              Academic & Enrollment Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Roll / Enrollment Number</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{student.rollNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Department</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{student.department}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Course / Program</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{student.course || 'B.Tech / B.E'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Academic Batch</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{student.batch || '2022 - 2026'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Official Email</span>
                <span style={{ fontWeight: 600, color: '#2563EB' }}>{student.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Phone Number</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{student.phone || 'Not provided'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Date Registered</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{new Date(student.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* BEXO Digital Identity */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              padding: '22px',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
              BEXO Digital Credentials
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>Live Portfolio Subdomain</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{student.portfolioSubdomain || `${student.rollNumber.toLowerCase()}.atbexo.com`}</span>
                  <ExternalLink size={13} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>ATS Resumes Created</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                    {student.resumeCount || 1}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Entitlement ID</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginTop: '4px' }}>
                    {student.entitlementId || 'ENT-INST-PENDING'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Services & Entitlements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Services Enrolled */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              padding: '22px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                Assigned BEXO Services ({student.services.length})
              </h3>
              <button
                onClick={() => {
                  setRevokeService(student.services[0] || '');
                  setIsRevokeOpen(true);
                }}
                disabled={student.services.length === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#DC2626',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: student.services.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <XCircle size={13} />
                <span>Request Revocation</span>
              </button>
            </div>

            {student.services.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#64748B' }}>
                  No BEXO service access granted yet.
                </p>
                <button
                  onClick={() => navigate('/college/give-access')}
                  disabled={isSuspended}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Give Access Now
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {student.services.map((srv) => (
                  <div
                    key={srv}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{srv}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Enterprise Institutional License</div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: '#DCFCE7',
                        color: '#166534',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle2 size={11} /> Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Provisioning History & Timeline */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              padding: '22px',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
              Provisioning & Event Timeline
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB', marginTop: '6px' }} />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                    Student Enrolled & Registered
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                    {new Date(student.createdAt).toLocaleString()} • Profile initialized
                  </div>
                </div>
              </div>

              {student.provisioningJobId && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A', marginTop: '6px' }} />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                      Provisioned via Batch Job {student.provisioningJobId}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                      Cloud workspace generated & entitlements assigned
                    </div>
                  </div>
                </div>
              )}

              {studentLogs.map((log) => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#94A3B8', marginTop: '6px' }} />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                      {log.action.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {new Date(log.timestamp).toLocaleString()} by {log.actorName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            className="modal-card"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                Edit Student Details
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Department
                    </label>
                    <input
                      type="text"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Program / Course
                    </label>
                    <input
                      type="text"
                      value={editCourse}
                      onChange={(e) => setEditCourse(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Batch / Academic Year
                    </label>
                    <input
                      type="text"
                      value={editBatch}
                      onChange={(e) => setEditBatch(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Phone / Mobile
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    style={{ padding: '9px 16px', borderRadius: '7px', backgroundColor: '#F1F5F9', border: 'none', color: '#475569', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '9px 20px', borderRadius: '7px', backgroundColor: '#2563EB', border: 'none', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVOKE REQUEST MODAL */}
      {isRevokeOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            className="modal-card"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <AlertTriangle size={22} color="#DC2626" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                Request Access Revocation
              </h3>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B' }}>
              Direct access revocation is policy-controlled. Submit a revocation request to BEXO Central Administration.
            </p>

            <form onSubmit={handleRevokeSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Select Service
                  </label>
                  <select
                    value={revokeService}
                    onChange={(e) => setRevokeService(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  >
                    {student.services.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Reason for Revocation *
                  </label>
                  <textarea
                    rows={3}
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    placeholder="e.g. Student transferred, discontinued course, or policy lapse"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsRevokeOpen(false)}
                    style={{ padding: '9px 16px', borderRadius: '7px', backgroundColor: '#F1F5F9', border: 'none', color: '#475569', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '9px 20px', borderRadius: '7px', backgroundColor: '#DC2626', border: 'none', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Send size={13} />
                    <span>Submit Revocation Request</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
