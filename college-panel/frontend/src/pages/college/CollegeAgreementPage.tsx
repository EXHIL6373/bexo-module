import React, { useState } from 'react';
import { useRouter } from '../../router/Router';
import { useAdmin } from '../../context/AdminContext';
import { canPerformCollegeAction } from '../../lib/collegePermissions';
import {
  FileCheck2,
  Calendar,
  Building2,
  ShieldCheck,
  Download,
  AlertTriangle,
  Award,
  Layers,
  CheckCircle,
  Clock,
  Send,
  FileText,
  HelpCircle,
} from 'lucide-react';

export const CollegeAgreementPage: React.FC = () => {
  const { currentUser, colleges, currentCollege, isCorporateAdmin, submitRequest, addToast } = useAdmin();

  const college = currentCollege || colleges.find(
    (c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName
  ) || (isCorporateAdmin ? colleges[0] : undefined);

  const collegeId = college?.id || currentUser.collegeId || '';
  const isSuspended = college?.status === 'Suspended' || currentUser.accountStatus === 'SUSPENDED';

  const canRequestRenewal = canPerformCollegeAction(currentUser.role, 'SUBMIT_REQUESTS');

  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [renewalPeriod, setRenewalPeriod] = useState('12 Months');
  const [renewalJustification, setRenewalJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute days remaining
  const endDateStr = college?.agreement?.endDate || '2027-05-31';
  const endDate = new Date(endDateStr);
  const today = new Date();
  const diffTime = endDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const handleRenewalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewalJustification.trim()) {
      addToast('error', 'Validation Error', 'Please provide a justification for agreement extension.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      submitRequest({
        type: 'Agreement Request',
        collegeId,
        collegeName: college?.name || 'Assigned College',
        requester: currentUser.name,
        requesterEmail: currentUser.email,
        requesterRole: currentUser.role,
        details: {
          title: `Agreement Renewal Request (${renewalPeriod})`,
          description: `${renewalJustification}. Requested Period: ${renewalPeriod}. Current End Date: ${endDateStr}`,
          requestedValue: renewalPeriod,
        },
        priority: 'High',
      });

      setIsSubmitting(false);
      setIsRenewalModalOpen(false);
      setRenewalJustification('');
      addToast('success', 'Renewal Request Dispatched', 'Your agreement renewal application has been routed to BEXO Institutional Legal & Operations.');
    }, 400);
  };

  const handleDownloadMOU = () => {
    const content = `========================================================
BEXO TECHNOLOGIES INSTITUTIONAL MASTER SERVICE AGREEMENT (MOU)
========================================================
Agreement ID: MOU-BEXO-${college?.code || 'INST'}-2026
Partner Institution: ${college?.name} (${college?.code})
Location: ${college?.city}, ${college?.state}
Effective Period: ${college?.agreement?.startDate || '2024-06-01'} to ${endDateStr}
Authorized Quota: ${college?.quota.allocated || 2500} Student Licenses
Agreement Tier: ${college?.agreement?.type || 'Tier-1 Institutional Enterprise'}
Agreement Status: ${isSuspended ? 'SUSPENDED' : 'EXECUTED & ACTIVE'}

CORE TERMS & OPERATIONAL CONDITIONS:
1. Multi-Tenant Data Protection: Student data remains strictly isolated.
2. Service Level Uptime: 99.9% availability for student services and APIs.
3. Access Provisioning: Institutional coordinators may grant access up to allocated quota.
4. Support: Dedicated priority institutional helpdesk and escalations.

Generated for verification by: ${currentUser.name} (${currentUser.role})
Timestamp: ${new Date().toISOString()}
========================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MOU_BEXO_${college?.code || 'INST'}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Document Exported', 'Institutional agreement summary downloaded.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
            Institutional Agreement & MOU
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
            Master Service Level Agreement between BEXO Technologies and {college?.name || 'College'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleDownloadMOU}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Download size={14} />
            <span>Download Summary</span>
          </button>

          {canRequestRenewal && (
            <button
              onClick={() => setIsRenewalModalOpen(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Send size={14} />
              <span>Request Renewal / Extension</span>
            </button>
          )}
        </div>
      </div>

      {isSuspended && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECDD3',
            borderRadius: '10px',
            padding: '14px 18px',
            fontSize: '13px',
            color: '#9F1239',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
          <div>
            <strong>Administrative Suspension Notice:</strong> Agreement privileges, active student provisioning, and platform API integrations are currently placed on suspension by BEXO Central Authority. Contact BEXO Legal & Compliance.
          </div>
        </div>
      )}

      {/* Agreement Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          padding: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileCheck2 size={26} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                MOU-BEXO-{college?.code || 'INST'}-2026
              </div>
              <div style={{ fontSize: '13px', color: '#64748B' }}>
                Executed Institutional Master Services Agreement & Technology License
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '999px',
                backgroundColor: isSuspended ? '#FEE2E2' : '#DCFCE7',
                color: isSuspended ? '#991B1B' : '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isSuspended ? '#DC2626' : '#16A34A',
                }}
              />
              {isSuspended ? 'SUSPENDED' : 'EXECUTED & ACTIVE'}
            </span>

            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '999px',
                backgroundColor: daysRemaining < 90 ? '#FEF3C7' : '#EFF6FF',
                color: daysRemaining < 90 ? '#92400E' : '#1D4ED8',
              }}
            >
              <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {daysRemaining} Days Remaining
            </span>
          </div>
        </div>

        {/* Agreement Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Partner Institution</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
              {college?.name}
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>Code: {college?.code} • {college?.city}, {college?.state}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Agreement Tier</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#2563EB', marginTop: '4px' }}>
              {college?.agreement?.type || 'Tier-1 Institutional Enterprise'}
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>99.9% Uptime Guarantee • Platinum SLA</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Effective Period</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
              {college?.agreement?.startDate || '2024-06-01'} to {endDateStr}
            </div>
            <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>Valid & Compliant</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Approved Student Quota</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
              {(college?.quota.allocated || 2500).toLocaleString()} Student Licenses
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              {(college?.quota.used || 0).toLocaleString()} provisioned ({(college?.quota.allocated ? Math.round((college.quota.used / college.quota.allocated) * 100) : 0)}% used)
            </div>
          </div>
        </div>

        {/* Included SLA Clauses */}
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '20px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
            Core Service Level Commitments & Compliance Terms
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
              <CheckCircle size={16} color="#10B981" />
              <span>Full Identity Verification & Roll Number Mapping</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
              <CheckCircle size={16} color="#10B981" />
              <span>24/7 Academic Support & Helpdesk Escalation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
              <CheckCircle size={16} color="#10B981" />
              <span>Encrypted Student Data & Zero-Trust Tenant Isolation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
              <CheckCircle size={16} color="#10B981" />
              <span>Automated Daily Database Backups & Audit Trail</span>
            </div>
          </div>
        </div>

        {/* Renewal & Amendment Policy Notice */}
        <div style={{ borderLeft: '4px solid #2563EB', padding: '12px 18px', backgroundColor: '#EFF6FF', borderRadius: '0 8px 8px 0', fontSize: '12.5px', color: '#1E40AF' }}>
          <strong>Institutional Governance Note:</strong> Agreement terms, license allocations, and validity periods are governed directly by BEXO Central Operations. College Administrators may submit renewal or amendment proposals, which are reviewed by the BEXO Legal & Commercial Approval Desk.
        </div>
      </div>

      {/* Renewal Request Modal */}
      {isRenewalModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                Request Agreement Renewal / Extension
              </h3>
              <button
                onClick={() => setIsRenewalModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
              Submit an official request to extend the institutional partnership agreement for <strong>{college?.name}</strong>.
            </p>

            <form onSubmit={handleRenewalSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Requested Extension Period
                </label>
                <select
                  value={renewalPeriod}
                  onChange={(e) => setRenewalPeriod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                  }}
                >
                  <option value="6 Months">6 Months Extension</option>
                  <option value="12 Months">12 Months (1 Academic Year)</option>
                  <option value="24 Months">24 Months (2 Academic Years)</option>
                  <option value="36 Months">36 Months (3-Year Master SLA)</option>
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Institutional Justification *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Outline expected student intake, upcoming batches, and desired term revisions..."
                  value={renewalJustification}
                  onChange={(e) => setRenewalJustification(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsRenewalModalOpen(false)}
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
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit to BEXO Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
