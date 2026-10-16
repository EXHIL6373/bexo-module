import React, { useState, useMemo } from 'react';
import { useRouter } from '../../router/Router';
import { useAdmin } from '../../context/AdminContext';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  ShieldAlert,
  Hash,
  Download,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  UploadCloud,
  UserPlus,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { canPerformCollegeAction } from '../../lib/collegePermissions';

export const CollegeStudentsPage: React.FC = () => {
  const { navigate } = useRouter();
  const {
    currentUser,
    colleges,
    currentCollege,
    isCorporateAdmin,
    getScopedStudentsForCollege,
    addStudent,
    revokeStudentAccess,
    reactivateStudentAccess,
    addToast,
  } = useAdmin();

  const college = currentCollege || colleges.find(
    (c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName
  ) || (isCorporateAdmin ? colleges[0] : undefined);

  const collegeId = college?.id || currentUser.collegeId || '';
  const isSuspended = college?.status === 'Suspended' || currentUser.accountStatus === 'SUSPENDED';

  const students = getScopedStudentsForCollege();

  const canCreate = canPerformCollegeAction(currentUser.role, 'CREATE_STUDENT');

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');

  // Add Student Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRoll, setNewRoll] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDept, setNewDept] = useState(
    college?.quota?.departmentLimits ? Object.keys(college.quota.departmentLimits)[0] || 'Computer Science' : 'Computer Science'
  );
  const [newCourse, setNewCourse] = useState('B.Tech');
  const [newBatch, setNewBatch] = useState('2024 - 2028');
  const [addError, setAddError] = useState('');

  const departments = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.department).filter(Boolean)));
  }, [students]);

  const batches = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.batch || `Class of ${s.enrolledYear + 4}`).filter(Boolean)));
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());
      const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
      const matchesStatus = statusFilter === 'ALL' || s.accessStatus === statusFilter;
      const matchesBatch = batchFilter === 'ALL' || (s.batch === batchFilter);
      return matchesSearch && matchesDept && matchesStatus && matchesBatch;
    });
  }, [students, search, deptFilter, statusFilter, batchFilter]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (isSuspended) {
      setAddError('Cannot add student: Institutional account is suspended.');
      return;
    }

    if (!newName.trim() || !newRoll.trim() || !newEmail.trim()) {
      setAddError('Name, Roll Number, and Email are required.');
      return;
    }

    try {
      await addStudent({
        name: newName.trim(),
        rollNumber: newRoll.trim().toUpperCase(),
        collegeId,
        collegeName: college?.name || 'Assigned College',
        department: newDept,
        course: newCourse,
        batch: newBatch,
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim(),
        accessStatus: 'Pending',
        services: [],
        entitlementId: '',
        enrolledYear: new Date().getFullYear(),
        resumeCount: 0,
      });

      setIsAddOpen(false);
      setNewName('');
      setNewRoll('');
      setNewEmail('');
      setNewPhone('');
    } catch (err: any) {
      setAddError(err.message || 'Failed to register student.');
    }
  };

  const handleExportRoster = () => {
    let csv = 'Student ID,Roll Number,Full Name,Email,Department,Course,Batch,Access Status,Services\n';
    filteredStudents.forEach((s) => {
      csv += `"${s.id}","${s.rollNumber}","${s.name}","${s.email}","${s.department}","${s.course || 'B.Tech'}","${s.batch || s.enrolledYear}","${s.accessStatus}","${s.services.join('; ')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bexo_student_roster_${college?.code || 'INST'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('success', 'Roster Exported', 'CSV roster downloaded.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-actions-bar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
              Enrolled Students
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
              {students.length} Total Records
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
            Institutional student directory for {college?.name || 'Assigned College'}
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={handleExportRoster}
            style={{
              padding: '9px 14px',
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
            <Download size={14} />
            <span>Export Roster</span>
          </button>

          <button
            onClick={() => navigate('/college/students/import')}
            disabled={isSuspended}
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              border: '1px solid #CBD5E1',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isSuspended ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <UploadCloud size={14} />
            <span>Bulk CSV Import</span>
          </button>

          {canCreate && (
            <button
              onClick={() => setIsAddOpen(true)}
              disabled={isSuspended}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                backgroundColor: isSuspended ? '#F1F5F9' : '#EFF6FF',
                color: isSuspended ? '#94A3B8' : '#1D4ED8',
                border: isSuspended ? '1px solid #CBD5E1' : '1px solid #BFDBFE',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isSuspended ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <UserPlus size={15} />
              <span>Add Student</span>
            </button>
          )}

          <button
            onClick={() => navigate('/college/give-access')}
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
              boxShadow: isSuspended ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.25)',
            }}
          >
            <UserCheck size={15} />
            <span>Give Access</span>
          </button>
        </div>
      </div>

      {/* Suspension Alert */}
      {isSuspended && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECDD3',
            borderRadius: '10px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            color: '#9F1239',
          }}
        >
          <AlertTriangle size={18} color="#E11D48" />
          <span>
            <strong>Read-Only Mode:</strong> College account is currently suspended. All student records remain preserved, but new student registration and access provisioning are locked.
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="page-filter-bar"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by roll number, student name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              fontSize: '12.5px',
              color: '#334155',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="ALL">All Departments</option>
            {departments.map((d, i) => (
              <option key={i} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              fontSize: '12.5px',
              color: '#334155',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
            <option value="Revoked">Revoked</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
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
                <th style={{ padding: '12px 18px', width: '130px' }}>Roll Number</th>
                <th style={{ padding: '12px 18px', width: '220px' }}>Student Name</th>
                <th style={{ padding: '12px 18px', width: '160px' }}>Department</th>
                <th style={{ padding: '12px 18px', width: '150px' }}>Course / Batch</th>
                <th style={{ padding: '12px 18px', minWidth: '220px' }}>Services</th>
                <th style={{ padding: '12px 18px', width: '130px' }}>Access Status</th>
                <th style={{ padding: '12px 18px', width: '160px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
                    No students match the selected search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s ease' }}
                    className="hover:bg-slate-50"
                  >
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', backgroundColor: '#F1F5F9', padding: '3px 7px', borderRadius: '4px', fontSize: '12px' }}>
                        {s.rollNumber}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <div
                        onClick={() => navigate(`/college/students/${s.id}`)}
                        style={{ fontWeight: 700, color: '#2563EB', cursor: 'pointer' }}
                      >
                        {s.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B' }}>{s.email}</div>
                    </td>
                    <td style={{ padding: '12px 18px', color: '#475569', whiteSpace: 'nowrap' }}>{s.department}</td>
                    <td style={{ padding: '12px 18px', color: '#475569', whiteSpace: 'nowrap' }}>
                      {s.course || 'B.Tech'} • {s.batch || `${s.enrolledYear}`}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      {s.services.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                          {s.services.map((srv) => (
                            <span
                              key={srv}
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#EFF6FF',
                                border: '1px solid #DBEAFE',
                                color: '#1D4ED8',
                                whiteSpace: 'nowrap',
                                lineHeight: '1.3',
                              }}
                            >
                              {srv}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>No access granted</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor:
                            s.accessStatus === 'Active'
                              ? '#DCFCE7'
                              : s.accessStatus === 'Revoked' || s.accessStatus === 'Suspended'
                              ? '#FEE2E2'
                              : '#FEF3C7',
                          color:
                            s.accessStatus === 'Active'
                              ? '#166534'
                              : s.accessStatus === 'Revoked' || s.accessStatus === 'Suspended'
                              ? '#991B1B'
                              : '#92400E',
                        }}
                      >
                        {s.accessStatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => navigate(`/college/students/${s.id}`)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #CBD5E1',
                            color: '#334155',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>

                        {!isSuspended && (
                          s.accessStatus === 'Active' ? (
                            <button
                              onClick={() => revokeStudentAccess(s.id, 'Revoked by College Admin')}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#FFF1F2',
                                border: '1px solid #FECDD3',
                                color: '#E11D48',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Revoke
                            </button>
                          ) : (
                            <button
                              onClick={() => reactivateStudentAccess(s.id)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#F0FDF4',
                                border: '1px solid #BBF7D0',
                                color: '#16A34A',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Reactivate
                            </button>
                          )
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

      {/* ADD STUDENT MODAL */}
      {isAddOpen && (
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                  Register Individual Student
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Enroll a new student to {college?.name || 'this college'}
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            {addError && (
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
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Full Student Name *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Balaji Anand"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Roll / Reg Number *
                    </label>
                    <input
                      type="text"
                      value={newRoll}
                      onChange={(e) => setNewRoll(e.target.value.toUpperCase())}
                      placeholder="e.g. 24CS150"
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="student@college.edu"
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Department
                    </label>
                    <input
                      type="text"
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      placeholder="e.g. Computer Science"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Program / Course
                    </label>
                    <input
                      type="text"
                      value={newCourse}
                      onChange={(e) => setNewCourse(e.target.value)}
                      placeholder="e.g. B.Tech"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Academic Batch
                    </label>
                    <input
                      type="text"
                      value={newBatch}
                      onChange={(e) => setNewBatch(e.target.value)}
                      placeholder="e.g. 2024 - 2028"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Phone / Mobile
                    </label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+91 98401 23456"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    style={{ padding: '9px 16px', borderRadius: '7px', backgroundColor: '#F1F5F9', border: 'none', color: '#475569', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '9px 20px', borderRadius: '7px', backgroundColor: '#2563EB', border: 'none', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <UserPlus size={14} />
                    <span>Save Student</span>
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
