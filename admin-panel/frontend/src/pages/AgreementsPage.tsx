import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useRouter } from '../router/Router';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import {
  FileCheck2,
  FileText,
  AlertTriangle,
  Download,
  Calendar,
  Building,
  RotateCcw,
  Clock,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export const AgreementsPage: React.FC = () => {
  const { colleges, updateCollege } = useAdmin();
  const { navigate } = useRouter();

  const [renewingCollegeId, setRenewingCollegeId] = useState<string | null>(null);

  // Colleges with agreements
  const expiringCount = colleges.filter((c) => c.agreement.status === 'Expiring Soon').length;

  const handleRenewAgreement = (collegeId: string) => {
    const col = colleges.find((c) => c.id === collegeId);
    if (!col) return;

    // Extend end date by 1 year and set status to Active
    const currentEnd = new Date(col.agreement.endDate);
    const newEnd = new Date(currentEnd.setFullYear(currentEnd.getFullYear() + 1)).toISOString().split('T')[0];

    updateCollege(collegeId, {
      agreement: {
        ...col.agreement,
        endDate: newEnd,
        status: 'Active',
      },
    });
    setRenewingCollegeId(null);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <FileCheck2 size={26} color="var(--bexo-blue-600)" />
            <span>MOU & Legal Agreements Management</span>
          </h1>
          <p>
            Oversee institutional contracts, renewal milestones, legal documents, and validity periods across colleges.
          </p>
        </div>
      </div>

      {/* Expiry Alert Callout if any expiring soon */}
      {expiringCount > 0 && (
        <div
          className="card attention-card"
          style={{
            marginBottom: '20px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="var(--color-warning)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '13.5px' }}>
                {expiringCount} Institutional Agreements Approaching Expiry
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Kumaraguru College of Technology (KCT) expires within 16 days (24 Oct 2026). Initiate renewal workflow to prevent automatic service suspension.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agreements Table */}
      <div className="card">
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Institution</th>
                <th>Agreement Reference</th>
                <th>Contract Type</th>
                <th>Start Date</th>
                <th>Expiration Date</th>
                <th>Legal Document</th>
                <th>Agreement Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {colleges.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div
                      style={{ fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => navigate(`/admin/colleges/${c.id}?tab=agreement`)}
                    >
                      {c.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Code: {c.code}</div>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--bexo-blue-600)' }}>{c.agreement.agreementNumber}</strong>
                  </td>
                  <td style={{ fontSize: '13px' }}>{c.agreement.type}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.agreement.startDate}</td>
                  <td>
                    <strong style={{ color: c.agreement.status === 'Expiring Soon' ? 'var(--color-warning)' : 'inherit' }}>
                      {c.agreement.endDate}
                    </strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <FileText size={14} color="var(--bexo-blue-600)" />
                      <span>{c.agreement.documentName || 'MOU_Signed.pdf'}</span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={c.agreement.status} size="sm" />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        onClick={() => navigate(`/admin/colleges/${c.id}?tab=agreement`)}
                      >
                        <Eye size={12} /> Inspect
                      </button>

                      {c.agreement.status === 'Expiring Soon' && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => setRenewingCollegeId(c.id)}
                        >
                          <RotateCcw size={12} /> Renew (1 Yr)
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

      {/* Renew Modal */}
      {renewingCollegeId && (
        <ConfirmationModal
          isOpen={true}
          title="Renew Institutional MOU Agreement?"
          description={`Extending the MOU will push the contract expiry forward by 1 calendar year and reset the agreement status to Active.`}
          confirmLabel="Authorize Renewal"
          confirmVariant="primary"
          onConfirm={() => handleRenewAgreement(renewingCollegeId)}
          onClose={() => setRenewingCollegeId(null)}
        />
      )}
    </div>
  );
};
