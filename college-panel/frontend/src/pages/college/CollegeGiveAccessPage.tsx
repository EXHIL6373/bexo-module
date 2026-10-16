import React, { useState, useMemo } from 'react';
import { useRouter } from '../../router/Router';
import { useAdmin } from '../../context/AdminContext';
import {
  UserCheck,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Users,
  Hash,
  UploadCloud,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Award,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const CollegeGiveAccessPage: React.FC = () => {
  const { navigate } = useRouter();
  const {
    currentUser,
    colleges,
    students,
    provisionStudentAccess,
    addToast,
    currentCollege,
    isCorporateAdmin,
    getScopedStudentsForCollege,
  } = useAdmin();

  const college = currentCollege || colleges.find(
    (c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName
  ) || (isCorporateAdmin ? colleges[0] : undefined);

  const collegeId = college?.id || currentUser.collegeId || '';
  const isSuspended = college?.status === 'Suspended' || currentUser.accountStatus === 'SUSPENDED';

  // Scoped students
  const collegeStudents = useMemo(() => {
    return getScopedStudentsForCollege();
  }, [getScopedStudentsForCollege]);

  // Approved services for this college
  const assignedServices = useMemo(() => {
    if (!college?.services) return [];
    return college.services.filter((s) => s.isEnabled);
  }, [college]);

  const quotaAllocated = college?.quota.allocated || 0;
  const quotaUsed = college?.quota.used || 0;
  const quotaRemaining = Math.max(0, quotaAllocated - quotaUsed);

  // Wizard state: 1: Method, 2: Service, 3: Review, 4: Processing, 5: Results
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [method, setMethod] = useState<'individual' | 'range' | 'pending_imported'>('individual');

  // Method 1: Individual Selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Method 2: Roll range
  const [startRoll, setStartRoll] = useState('24CS001');
  const [endRoll, setEndRoll] = useState('24CS030');

  // Selected Service
  const [selectedService, setSelectedService] = useState<string>(
    assignedServices[0]?.name || 'BEXO Portfolio'
  );

  // Processing state
  const [processingStatus, setProcessingStatus] = useState('Initiating provisioning queue...');
  const [provisionResult, setProvisionResult] = useState<{
    job: any;
    successful: number;
    failed: number;
    skipped: number;
  } | null>(null);

  // Filter students for individual picker
  const filteredStudents = useMemo(() => {
    return collegeStudents.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = deptFilter === 'ALL' || s.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [collegeStudents, searchQuery, deptFilter]);

  const departments = useMemo(() => {
    return Array.from(new Set(collegeStudents.map((s) => s.department).filter(Boolean)));
  }, [collegeStudents]);

  // Determine students targeted by current method
  const targetStudentList = useMemo(() => {
    if (method === 'individual') {
      return collegeStudents.filter((s) => selectedStudentIds.includes(s.id));
    }
    if (method === 'pending_imported') {
      return collegeStudents.filter((s) => s.accessStatus === 'Pending');
    }
    if (method === 'range') {
      const startNum = parseInt(startRoll.replace(/\D/g, ''), 10);
      const endNum = parseInt(endRoll.replace(/\D/g, ''), 10);
      const prefix = startRoll.replace(/\d/g, '').toUpperCase();
      if (!isNaN(startNum) && !isNaN(endNum) && endNum >= startNum) {
        return collegeStudents.filter((s) => {
          const sNum = parseInt(s.rollNumber.replace(/\D/g, ''), 10);
          const sPrefix = s.rollNumber.replace(/\d/g, '').toUpperCase();
          return sPrefix === prefix && sNum >= startNum && sNum <= endNum;
        });
      }
      return [];
    }
    return [];
  }, [method, selectedStudentIds, collegeStudents, startRoll, endRoll]);

  // Eligibility breakdown
  const alreadyHaveService = useMemo(() => {
    return targetStudentList.filter((s) => s.services.includes(selectedService));
  }, [targetStudentList, selectedService]);

  const eligibleStudents = useMemo(() => {
    return targetStudentList.filter((s) => !s.services.includes(selectedService));
  }, [targetStudentList, selectedService]);

  const quotaImpactCount = eligibleStudents.length;
  const willExceedQuota = quotaImpactCount > quotaRemaining;
  const newQuotaUsed = quotaUsed + quotaImpactCount;
  const newQuotaPercent = quotaAllocated > 0 ? Math.min(100, Math.round((newQuotaUsed / quotaAllocated) * 100)) : 0;

  // Toggle selection
  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const ids = filteredStudents.map((s) => s.id);
    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const clearSelection = () => {
    setSelectedStudentIds([]);
  };

  // Launch Provisioning
  const handleStartProvisioning = async () => {
    if (isSuspended) {
      addToast('error', 'Operation Locked', 'College account is suspended.');
      return;
    }

    if (currentUser.role === 'college_staff') {
      addToast('error', 'Permission Denied', 'College Staff cannot provision student access.');
      return;
    }

    if (eligibleStudents.length === 0) {
      addToast('warning', 'No Eligible Students', 'All selected students already have this service active.');
      return;
    }

    setStep(4);
    setProcessingStatus('Validating student enrollment credentials...');

    setTimeout(() => {
      setProcessingStatus('Allocating cloud workspaces & subdomains...');
    }, 600);

    setTimeout(() => {
      setProcessingStatus('Generating institutional entitlement licenses...');
    }, 1200);

    try {
      const eligibleIds = eligibleStudents.map((s) => s.id);
      const res = await provisionStudentAccess(collegeId, eligibleIds, selectedService);
      setTimeout(() => {
        setProvisionResult(res);
        setStep(5);
      }, 1800);
    } catch (err: any) {
      addToast('error', 'Provisioning Failed', err.message || 'Error occurred during provisioning.');
      setStep(3);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
              Give Student Access
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
              }}
            >
              Access Provisioning
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
            Provision approved BEXO digital tools and licenses for students of {college?.name || 'Assigned College'}
          </p>
        </div>

        {/* Quota Badge */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>AVAILABLE QUOTA</div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: quotaRemaining > 100 ? '#16A34A' : '#DC2626' }}>
              {quotaRemaining.toLocaleString()} remaining
            </div>
          </div>
        </div>
      </div>

      {/* Suspension Alert */}
      {isSuspended && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECDD3',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <ShieldAlert size={22} color="#E11D48" />
          <div style={{ fontSize: '13px', color: '#9F1239' }}>
            <strong>Institutional Account Suspended:</strong> Student provisioning is strictly locked by BEXO Central Administration. Please coordinate with support to resolve account status.
          </div>
        </div>
      )}

      {/* Step Indicators */}
      {step < 4 && (
        <div
          className="stepper-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '14px 28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: step >= 1 ? '#2563EB' : '#E2E8F0',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 800,
              }}
            >
              1
            </div>
            <span style={{ fontSize: '13px', fontWeight: step === 1 ? 800 : 600, color: step === 1 ? '#0F172A' : '#64748B' }}>
              Select Students
            </span>
          </div>

          <div style={{ width: '40px', height: '1px', backgroundColor: '#CBD5E1' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: step >= 2 ? '#2563EB' : '#E2E8F0',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 800,
              }}
            >
              2
            </div>
            <span style={{ fontSize: '13px', fontWeight: step === 2 ? 800 : 600, color: step === 2 ? '#0F172A' : '#64748B' }}>
              Select Service
            </span>
          </div>

          <div style={{ width: '40px', height: '1px', backgroundColor: '#CBD5E1' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: step >= 3 ? '#2563EB' : '#E2E8F0',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 800,
              }}
            >
              3
            </div>
            <span style={{ fontSize: '13px', fontWeight: step === 3 ? 800 : 600, color: step === 3 ? '#0F172A' : '#64748B' }}>
              Review & Quota Impact
            </span>
          </div>
        </div>
      )}

      {/* STEP 1: Select Method & Students */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Method Selector Tabs */}
          <div className="cards-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div
              onClick={() => setMethod('individual')}
              style={{
                backgroundColor: method === 'individual' ? '#EFF6FF' : '#FFFFFF',
                border: method === 'individual' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <Users size={20} color={method === 'individual' ? '#2563EB' : '#64748B'} style={{ marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Select Students</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Pick students individually using roster checkboxes.
                </div>
              </div>
            </div>

            <div
              onClick={() => setMethod('range')}
              style={{
                backgroundColor: method === 'range' ? '#EFF6FF' : '#FFFFFF',
                border: method === 'range' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <Hash size={20} color={method === 'range' ? '#2563EB' : '#64748B'} style={{ marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Roll Number Range</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Specify start and end roll sequence (e.g. 24CS001 to 24CS040).
                </div>
              </div>
            </div>

            <div
              onClick={() => setMethod('pending_imported')}
              style={{
                backgroundColor: method === 'pending_imported' ? '#EFF6FF' : '#FFFFFF',
                border: method === 'pending_imported' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <UploadCloud size={20} color={method === 'pending_imported' ? '#2563EB' : '#64748B'} style={{ marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', lineHeight: 1.25 }}>
                  Pending Cohort ({collegeStudents.filter((s) => s.accessStatus === 'Pending').length})
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', lineHeight: 1.4 }}>
                  Provision all {collegeStudents.filter((s) => s.accessStatus === 'Pending').length} pending imported students.
                </div>
              </div>
            </div>
          </div>

          {/* Method Content */}
          {method === 'individual' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px' }}>
              {/* Filter bar */}
              <div className="page-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
                    <input
                      type="text"
                      placeholder="Search name or roll number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '12.5px' }}
                    />
                  </div>

                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '12.5px' }}
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={selectAllFiltered}
                    style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Select All Filtered ({filteredStudents.length})
                  </button>
                  {selectedStudentIds.length > 0 && (
                    <button
                      onClick={clearSelection}
                      style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #FECDD3', backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Clear ({selectedStudentIds.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Student selection table */}
              <div className="table-responsive-container" style={{ maxHeight: '380px', overflowY: 'auto', overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead style={{ backgroundColor: '#F8FAFC', position: 'sticky', top: 0, zIndex: 5 }}>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 14px', width: '50px', textAlign: 'center' }}>Pick</th>
                      <th style={{ padding: '10px 14px', width: '130px', color: '#475569', fontWeight: 700 }}>Roll Number</th>
                      <th style={{ padding: '10px 14px', width: '200px', color: '#475569', fontWeight: 700 }}>Student Name</th>
                      <th style={{ padding: '10px 14px', width: '180px', color: '#475569', fontWeight: 700 }}>Department</th>
                      <th style={{ padding: '10px 14px', minWidth: '220px', color: '#475569', fontWeight: 700 }}>Existing Services</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => {
                      const isSelected = selectedStudentIds.includes(s.id);
                      return (
                        <tr
                          key={s.id}
                          onClick={() => toggleStudent(s.id)}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                            cursor: 'pointer',
                          }}
                        >
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>{s.rollNumber}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>{s.name}</td>
                          <td style={{ padding: '10px 14px', color: '#475569', whiteSpace: 'nowrap' }}>{s.department}</td>
                          <td style={{ padding: '10px 14px', color: '#64748B' }}>
                            {s.services.length > 0 ? s.services.join(', ') : 'None'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748B' }}>
                Selected: <strong>{selectedStudentIds.length}</strong> students
              </div>
            </div>
          )}

          {method === 'range' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                Define Sequence Range
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '500px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Start Roll Number
                  </label>
                  <input
                    type="text"
                    value={startRoll}
                    onChange={(e) => setStartRoll(e.target.value.toUpperCase())}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    End Roll Number
                  </label>
                  <input
                    type="text"
                    value={endRoll}
                    onChange={(e) => setEndRoll(e.target.value.toUpperCase())}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: '8px', maxWidth: '500px', fontSize: '12.5px', color: '#475569' }}>
                Matching registered students in this sequence: <strong>{targetStudentList.length} students found</strong>
              </div>
            </div>
          )}

          {method === 'pending_imported' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                Pending Imported Students
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B' }}>
                There are currently <strong>{targetStudentList.length}</strong> imported student records waiting for their initial BEXO service activation.
              </p>
              {targetStudentList.length === 0 && (
                <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', fontSize: '13px', color: '#64748B' }}>
                  No pending students from import. All students already have access, or you can import a new roster file.
                </div>
              )}
            </div>
          )}

          {/* Action to proceed to Step 2 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setStep(2)}
              disabled={targetStudentList.length === 0}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                backgroundColor: targetStudentList.length === 0 ? '#94A3B8' : '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: targetStudentList.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Continue to Select Service ({targetStudentList.length} students)</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Select Service */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
              Choose Approved BEXO Service
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748B' }}>
              Only services assigned and activated by BEXO Central Administration can be provisioned.
            </p>

            <div className="cards-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {assignedServices.map((srv) => {
                const isSelected = selectedService === srv.name;
                return (
                  <div
                    key={srv.serviceId}
                    onClick={() => setSelectedService(srv.name)}
                    style={{
                      border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                      backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                      borderRadius: '12px',
                      padding: '18px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{srv.name}</span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor: '#DCFCE7',
                          color: '#166534',
                        }}
                      >
                        {srv.planLevel || 'Enterprise'}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5, marginBottom: '12px' }}>
                      Institutional license with dynamic subdomain and student analytics.
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#475569', fontWeight: 600 }}>
                      Enrolled: <strong>{srv.studentsUsing.toLocaleString()}</strong> students
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Students</span>
            </button>

            <button
              onClick={() => setStep(3)}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Review Eligibility & Quota</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review Eligibility & Quota Impact */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quota Impact Metric Box */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: willExceedQuota ? '1px solid #FECDD3' : '1px solid #E2E8F0',
              padding: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
              Quota Utilization Impact
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>APPROVED QUOTA</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                  {quotaAllocated.toLocaleString()}
                </div>
              </div>

              <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>CURRENTLY USED</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#475569', marginTop: '2px' }}>
                  {quotaUsed.toLocaleString()}
                </div>
              </div>

              <div style={{ padding: '14px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700 }}>BATCH ADDITION</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#1D4ED8', marginTop: '2px' }}>
                  +{quotaImpactCount.toLocaleString()}
                </div>
              </div>

              <div
                style={{
                  padding: '14px',
                  backgroundColor: willExceedQuota ? '#FEF2F2' : '#F0FDF4',
                  borderRadius: '8px',
                  border: willExceedQuota ? '1px solid #FECDD3' : '1px solid #BBF7D0',
                }}
              >
                <div style={{ fontSize: '11px', color: willExceedQuota ? '#991B1B' : '#166534', fontWeight: 700 }}>
                  PROJECTED REMAINING
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: willExceedQuota ? '#DC2626' : '#15803D', marginTop: '2px' }}>
                  {Math.max(0, quotaRemaining - quotaImpactCount).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Quota Warning if tight */}
            {willExceedQuota && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECDD3',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#9F1239',
                  fontSize: '13px',
                }}
              >
                <AlertTriangle size={20} color="#E11D48" />
                <div>
                  <strong>Insufficient Student Quota:</strong> This batch requires {quotaImpactCount} licenses, but only {quotaRemaining} licenses remain. Please reduce batch size or request a quota upgrade.
                </div>
              </div>
            )}
          </div>

          {/* Eligible vs Already Provisioned Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <CheckCircle2 size={16} color="#16A34A" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                  Eligible for Activation ({eligibleStudents.length})
                </h4>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '12.5px', color: '#475569' }}>
                {eligibleStudents.slice(0, 15).map((s) => (
                  <div key={s.id} style={{ padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <strong>{s.rollNumber}</strong> — {s.name} ({s.department})
                  </div>
                ))}
                {eligibleStudents.length > 15 && (
                  <div style={{ paddingTop: '8px', color: '#94A3B8', fontSize: '11.5px' }}>
                    ... and {eligibleStudents.length - 15} more students
                  </div>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <AlertTriangle size={16} color="#D97706" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                  Already Active / Skipped ({alreadyHaveService.length})
                </h4>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '12.5px', color: '#64748B' }}>
                {alreadyHaveService.length === 0 ? (
                  <div style={{ color: '#94A3B8' }}>None — all students in this batch are fresh recipients.</div>
                ) : (
                  alreadyHaveService.map((s) => (
                    <div key={s.id} style={{ padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                      <strong>{s.rollNumber}</strong> — already has {selectedService}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Action Confirmation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setStep(2)}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Back
            </button>

            <button
              onClick={handleStartProvisioning}
              disabled={willExceedQuota || eligibleStudents.length === 0 || isSuspended}
              style={{
                padding: '11px 28px',
                borderRadius: '8px',
                backgroundColor: willExceedQuota || eligibleStudents.length === 0 || isSuspended ? '#94A3B8' : '#16A34A',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: willExceedQuota || eligibleStudents.length === 0 || isSuspended ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Confirm & Grant Access to {eligibleStudents.length} Students</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Processing State */}
      {step === 4 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '54px 24px',
            textAlign: 'center',
            maxWidth: '560px',
            margin: '40px auto',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <RefreshCw size={32} className="animate-spin" />
          </div>

          <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
            Provisioning Student Access
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: '13.5px', color: '#2563EB', fontWeight: 600 }}>
            {processingStatus}
          </p>

          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#F1F5F9',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '75%',
                height: '100%',
                backgroundColor: '#2563EB',
                borderRadius: '999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* STEP 5: Results */}
      {step === 5 && provisionResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '40px 32px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
              Student Provisioning Completed!
            </h2>
            <p style={{ margin: '0 0 28px', fontSize: '13.5px', color: '#64748B' }}>
              Batch processed for <strong>{selectedService}</strong> under Job ID <strong>{provisionResult.job.id}</strong>
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '32px' }}>
              <div style={{ padding: '14px 24px', backgroundColor: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#166534' }}>Activated Students</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>
                  {provisionResult.successful}
                </div>
              </div>

              <div style={{ padding: '14px 24px', backgroundColor: '#FFFBEB', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#92400E' }}>Already Active / Skipped</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#D97706', marginTop: '2px' }}>
                  {provisionResult.skipped}
                </div>
              </div>

              {provisionResult.failed > 0 && (
                <div style={{ padding: '14px 24px', backgroundColor: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECDD3' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#991B1B' }}>Failed Records</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>
                    {provisionResult.failed}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <button
                onClick={() => navigate('/college/provisioning')}
                style={{
                  padding: '10px 20px',
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
                <Layers size={14} />
                <span>View Provisioning Jobs</span>
              </button>

              <button
                onClick={() => navigate('/college/entitlements')}
                style={{
                  padding: '10px 20px',
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
                <Award size={14} />
                <span>View Student Entitlements</span>
              </button>

              <button
                onClick={() => {
                  setStep(1);
                  setSelectedStudentIds([]);
                  setProvisionResult(null);
                }}
                style={{
                  padding: '10px 22px',
                  borderRadius: '8px',
                  backgroundColor: '#2563EB',
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
                <Sparkles size={14} />
                <span>Provision Another Batch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
