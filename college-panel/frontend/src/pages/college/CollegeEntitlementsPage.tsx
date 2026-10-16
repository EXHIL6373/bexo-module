import React, { useState, useMemo } from 'react';
import { useRouter } from '../../router/Router';
import { useAdmin } from '../../context/AdminContext';
import {
  Award,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';

export const CollegeEntitlementsPage: React.FC = () => {
  const { navigate } = useRouter();
  const {
    currentUser,
    colleges,
    getScopedEntitlementsForCollege,
    students,
    requestStudentRevocation,
    addToast,
    currentCollege,
    isCorporateAdmin,
  } = useAdmin();

  const college = currentCollege || colleges.find(
    (c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName
  ) || (isCorporateAdmin ? colleges[0] : undefined);

  const collegeId = college?.id || currentUser.collegeId || '';

  // Scoped entitlements strictly enforced to authenticated college
  const scopedEntitlements = useMemo(() => {
    return getScopedEntitlementsForCollege();
  }, [getScopedEntitlementsForCollege]);

  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Revoke modal state
  const [revokeModal, setRevokeModal] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
    rollNumber: string;
    serviceName: string;
    reason: string;
  }>({
    isOpen: false,
    studentId: '',
    studentName: '',
    rollNumber: '',
    serviceName: '',
    reason: '',
  });

  // Services list
  const availableServices = useMemo(() => {
    return Array.from(new Set(scopedEntitlements.map((e) => e.serviceName).filter((s): s is string => Boolean(s))));
  }, [scopedEntitlements]);

  // Filtered entitlements
  const filteredList = useMemo(() => {
    return scopedEntitlements.filter((item) => {
      const matchSearch =
        item.studentName.toLowerCase().includes(search.toLowerCase()) ||
        item.rollNumber.toLowerCase().includes(search.toLowerCase());
      const matchService = serviceFilter === 'ALL' || item.serviceName === serviceFilter;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchSearch && matchService && matchStatus;
    });
  }, [scopedEntitlements, search, serviceFilter, statusFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    let csv = 'Entitlement ID,Student Name,Roll Number,Service,Status,Granted Date,Expiry Date\n';
    filteredList.forEach((e) => {
      csv += `"${e.id}","${e.studentName}","${e.rollNumber}","${e.serviceName}","${e.status}","${e.grantedDate}","${e.expiryDate || 'N/A'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bexo_student_entitlements_${college?.code || 'INST'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('success', 'Entitlements Exported', 'CSV file saved to your device.');
  };

  const handleRevokeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeModal.studentId || !revokeModal.serviceName) return;

    requestStudentRevocation(
      revokeModal.studentId,
      revokeModal.serviceName,
      revokeModal.reason || 'Requested by institutional administration'
    );

    setRevokeModal({ isOpen: false, studentId: '', studentName: '', rollNumber: '', serviceName: '', reason: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-actions-bar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
              Student Entitlements
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
              {scopedEntitlements.length} Active Licenses
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
            Active BEXO software entitlements and access rights for {college?.name || 'Assigned College'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
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
            <Download size={14} />
            <span>Export Entitlements CSV</span>
          </button>

          <button
            onClick={() => navigate('/college/give-access')}
            style={{
              padding: '9px 18px',
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
            <span>Grant New Access</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="page-filter-bar"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '14px 20px',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '380px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search student name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px 0 34px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            style={{
              height: '38px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '12.5px',
              backgroundColor: '#FFFFFF',
              boxSizing: 'border-box',
            }}
          >
            <option value="ALL">All Services</option>
            {availableServices.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: '38px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '12.5px',
              backgroundColor: '#FFFFFF',
              boxSizing: 'border-box',
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

      {/* Entitlements Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
      >
        <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ backgroundColor: '#F8FAFC' }}>
              <tr style={{ borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700, width: '200px' }}>Student Name</th>
                <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700, width: '130px' }}>Roll Number</th>
                <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700, width: '160px' }}>Service Granted</th>
                <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700, width: '140px' }}>Entitlement Status</th>
                <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700, width: '130px' }}>Granted Date</th>
                <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700, width: '130px' }}>License Expiry</th>
                <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700, width: '150px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                    No entitlements matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((ent) => (
                  <tr
                    key={ent.id}
                    style={{ borderBottom: '1px solid #F1F5F9' }}
                  >
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: '#0F172A' }}>
                      {ent.studentName}
                    </td>
                    <td style={{ padding: '12px 18px', fontWeight: 600, color: '#334155' }}>
                      {ent.rollNumber}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                        }}
                      >
                        {ent.serviceName}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          backgroundColor:
                            ent.status === 'Active'
                              ? '#DCFCE7'
                              : ent.status === 'Suspended'
                              ? '#FEE2E2'
                              : '#FEF3C7',
                          color:
                            ent.status === 'Active'
                              ? '#166534'
                              : ent.status === 'Suspended'
                              ? '#991B1B'
                              : '#B45309',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {ent.status === 'Active' ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                        {ent.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', color: '#64748B' }}>
                      {new Date(ent.grantedDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 18px', color: '#64748B' }}>
                      {ent.expiryDate ? new Date(ent.expiryDate).toLocaleDateString() : 'Annual MOU Term'}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          const s = students.find((st) => st.rollNumber === ent.rollNumber);
                          setRevokeModal({
                            isOpen: true,
                            studentId: s?.id || ent.studentId,
                            studentName: ent.studentName,
                            rollNumber: ent.rollNumber,
                            serviceName: ent.serviceName,
                            reason: '',
                          });
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Request Revocation
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revoke Modal */}
      {revokeModal.isOpen && (
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
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
              Request Access Revocation
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B' }}>
              Submit an administrative request to BEXO Admin to revoke <strong>{revokeModal.serviceName}</strong> for student <strong>{revokeModal.studentName} ({revokeModal.rollNumber})</strong>.
            </p>

            <form onSubmit={handleRevokeSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Justification / Reason *
                </label>
                <textarea
                  rows={3}
                  value={revokeModal.reason}
                  onChange={(e) => setRevokeModal({ ...revokeModal, reason: e.target.value })}
                  placeholder="e.g. Student transferred or course discontinued"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRevokeModal({ ...revokeModal, isOpen: false })}
                  style={{ padding: '9px 16px', borderRadius: '7px', backgroundColor: '#F1F5F9', border: 'none', color: '#475569', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: '7px', backgroundColor: '#DC2626', border: 'none', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={13} />
                  <span>Submit Revocation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
