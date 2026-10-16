import React, { useState, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useRouter } from '../router/Router';
import { Student } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import {
  GraduationCap,
  Search,
  Filter,
  Eye,
  Ban,
  RotateCcw,
  ExternalLink,
  Building,
  Mail,
  Phone,
  Calendar,
  X,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const { scopedStudents, colleges, revokeStudentAccess, reactivateStudentAccess } = useAdmin();
  const { navigate } = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Selected student for details drawer
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  // Revocation modal
  const [studentToRevoke, setStudentToRevoke] = useState<Student | null>(null);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return scopedStudents.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q);

      const matchesCollege = collegeFilter === 'All' || s.collegeId === collegeFilter;
      const matchesDept = departmentFilter === 'All' || s.department === departmentFilter;
      const matchesStatus = statusFilter === 'All' || s.accessStatus === statusFilter;

      return matchesSearch && matchesCollege && matchesDept && matchesStatus;
    });
  }, [scopedStudents, searchQuery, collegeFilter, departmentFilter, statusFilter]);

  // Unique departments
  const departments = Array.from(new Set(scopedStudents.map((s) => s.department)));

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <GraduationCap size={26} color="var(--bexo-blue-600)" />
            <span>Student Management</span>
          </h1>
          <p>
            Company-wide directory of students enrolled across all partner institutions.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              width: '100%',
              maxWidth: '360px',
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              id="students-search-input"
              name="searchQuery"
              type="text"
              placeholder="Search by name, roll number (22CS001), email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
            <label htmlFor="students-college-filter" style={{ cursor: 'pointer' }}>College:</label>
            <select
              id="students-college-filter"
              name="collegeFilter"
              className="form-select"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
            >
              <option value="All">All Colleges</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
            <label htmlFor="students-department-filter" style={{ cursor: 'pointer' }}>Department:</label>
            <select
              id="students-department-filter"
              name="departmentFilter"
              className="form-select"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
            <label htmlFor="students-status-filter" style={{ cursor: 'pointer' }}>Status:</label>
            <select
              id="students-status-filter"
              name="statusFilter"
              className="form-select"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Revoked">Revoked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="card">
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Student Name</th>
                <th>Institution</th>
                <th>Department</th>
                <th>Email</th>
                <th>Access Status</th>
                <th>Services Entitled</th>
                <th>Resumes</th>
                <th>Last Active</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px' }}>
                    <GraduationCap size={32} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 700 }}>No students match your search criteria</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Try resetting search filters or keywords.</div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong style={{ color: 'var(--bexo-blue-600)' }}>{s.rollNumber}</strong>
                    </td>
                    <td>
                      <div
                        style={{ fontWeight: 700, cursor: 'pointer' }}
                        onClick={() => setActiveStudent(s)}
                        className="hover-underline"
                      >
                        {s.name}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{ cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500 }}
                        onClick={() => navigate(`/admin/colleges/${s.collegeId}`)}
                      >
                        {s.collegeName}
                      </span>
                    </td>
                    <td>{s.department}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{s.email}</td>
                    <td>
                      <StatusBadge status={s.accessStatus} size="sm" />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {s.services.map((srv, idx) => (
                          <span key={idx} className="status-badge service" style={{ fontSize: '10.5px', padding: '1px 6px' }}>
                            {srv.replace('BEXO ', '')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{s.resumeCount}</td>
                    <td style={{ fontSize: '11.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(s.lastActivityAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => setActiveStudent(s)}
                        >
                          <Eye size={12} /> Inspect
                        </button>

                        {s.accessStatus === 'Active' ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--color-danger)', padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => setStudentToRevoke(s)}
                          >
                            <Ban size={12} /> Revoke
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--color-success)', padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => reactivateStudentAccess(s.id)}
                          >
                            <RotateCcw size={12} /> Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Drawer */}
      {activeStudent && (
        <div className="drawer-backdrop" onClick={() => setActiveStudent(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GraduationCap size={22} color="var(--bexo-blue-600)" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '16px' }}>{activeStudent.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Roll No: {activeStudent.rollNumber}</div>
                </div>
              </div>
              <button onClick={() => setActiveStudent(null)} style={{ color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Status Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Entitlement Status</span>
                <StatusBadge status={activeStudent.accessStatus} size="md" />
              </div>

              {/* Institution & Dept */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Academic Association
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>{activeStudent.collegeName}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Department: {activeStudent.department}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Enrolled Class of {activeStudent.enrolledYear}</div>
              </div>

              {/* Contact Info */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Contact Information
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '6px' }}>
                  <Mail size={14} color="var(--text-muted)" />
                  <span>{activeStudent.email}</span>
                </div>
                {activeStudent.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '4px' }}>
                    <Phone size={14} color="var(--text-muted)" />
                    <span>{activeStudent.phone}</span>
                  </div>
                )}
              </div>

              {/* Portfolio & ATS Resumes */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Digital Portfolio & Career Assets
                </div>
                {activeStudent.portfolioSubdomain ? (
                  <div style={{ marginTop: '6px', padding: '10px 14px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '12px', color: '#1E40AF', fontWeight: 700 }}>Live Portfolio Site</div>
                    <a
                      href={`https://${activeStudent.portfolioSubdomain}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '13px', color: 'var(--bexo-blue-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                    >
                      <span>{activeStudent.portfolioSubdomain}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ) : (
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>No public portfolio published yet.</div>
                )}

                <div style={{ marginTop: '12px', fontSize: '13px' }}>
                  Generated ATS Resumes: <strong>{activeStudent.resumeCount} documents</strong>
                </div>
              </div>

              {/* Provisioning Meta */}
              <div style={{ padding: '14px', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Provisioning Telemetry
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Entitlement Token: <code>{activeStudent.entitlementId}</code></div>
                <div style={{ fontSize: '12px', marginTop: '2px' }}>Batch Job: <code>{activeStudent.provisioningJobId || 'Manual Onboarding'}</code></div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface-subtle)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveStudent(null)}>
                Close
              </button>

              {activeStudent.accessStatus === 'Active' ? (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    setStudentToRevoke(activeStudent);
                    setActiveStudent(null);
                  }}
                >
                  <Ban size={14} /> Revoke Student Access
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    reactivateStudentAccess(activeStudent.id);
                    setActiveStudent(null);
                  }}
                >
                  <RotateCcw size={14} /> Restore Student Access
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Revoking Access */}
      {studentToRevoke && (
        <ConfirmationModal
          isOpen={true}
          title={`Revoke Access for ${studentToRevoke.name}?`}
          description={`Revoking access for student ${studentToRevoke.rollNumber} (${studentToRevoke.name}) locks their current BEXO portfolio and resume generation services.`}
          impactItems={[
            'Student mobile app features will transition to read-only mode',
            'All existing profile info, resumes, and projects remain preserved',
            'Access can be reinstated at any time by administrator approval',
          ]}
          requireReason={true}
          reasonLabel="Revocation Reason"
          confirmLabel="Confirm Revocation"
          confirmVariant="danger"
          onConfirm={(reason) => {
            revokeStudentAccess(studentToRevoke.id, reason);
            setStudentToRevoke(null);
          }}
          onClose={() => setStudentToRevoke(null)}
        />
      )}
    </div>
  );
};
