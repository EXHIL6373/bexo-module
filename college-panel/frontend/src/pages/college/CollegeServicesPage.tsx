import React, { useState } from 'react';
import { useRouter } from '../../router/Router';
import { useAdmin } from '../../context/AdminContext';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Send,
  HelpCircle,
  Award,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export const CollegeServicesPage: React.FC = () => {
  const { navigate } = useRouter();
  const {
    currentUser,
    colleges,
    services,
    submitRequest,
    addToast,
    currentCollege,
    isCorporateAdmin,
  } = useAdmin();

  const college = currentCollege || colleges.find(
    (c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName
  ) || (isCorporateAdmin ? colleges[0] : undefined);

  const collegeId = college?.id || currentUser.collegeId || '';
  const isSuspended = college?.status === 'Suspended' || currentUser.accountStatus === 'SUSPENDED';

  const quotaAllocated = college?.quota.allocated || 0;
  const quotaUsed = college?.quota.used || 0;
  const quotaRemaining = Math.max(0, quotaAllocated - quotaUsed);
  const quotaPercent = quotaAllocated > 0 ? Math.min(100, Math.round((quotaUsed / quotaAllocated) * 100)) : 0;

  // Assigned services
  const assignedServices = college?.services || [];

  // Services available globally on platform but not yet assigned
  const unassignedPlatformServices = services.filter(
    (s) => !assignedServices.some((as) => as.name === s.name || as.serviceId === s.id)
  );

  // Request Quota Modal State
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [requestedQuota, setRequestedQuota] = useState('500');
  const [quotaJustification, setQuotaJustification] = useState('');

  // Request Service Activation Modal State
  const [serviceReqModal, setServiceReqModal] = useState<{ isOpen: boolean; serviceName: string }>({
    isOpen: false,
    serviceName: '',
  });
  const [serviceJustification, setServiceJustification] = useState('');

  const handleQuotaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(requestedQuota, 10);
    if (isNaN(count) || count <= 0) return;

    submitRequest({
      type: 'Quota Increase',
      collegeId,
      collegeName: college?.name || 'Assigned College',
      requester: currentUser.name,
      requesterEmail: currentUser.email,
      requesterRole: currentUser.role,
      details: {
        title: `Quota Increase Request (+${count} seats)`,
        description: quotaJustification.trim(),
        currentValue: quotaAllocated,
        requestedValue: quotaAllocated + count,
      },
      priority: 'Medium',
    });

    setIsQuotaModalOpen(false);
    setQuotaJustification('');
    addToast('success', 'Request Routed to Admin', `Quota increase request (+${count} licenses) submitted for review.`);
  };

  const handleServiceReqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceReqModal.serviceName) return;

    submitRequest({
      type: 'Service Activation',
      collegeId,
      collegeName: college?.name || 'Assigned College',
      requester: currentUser.name,
      requesterEmail: currentUser.email,
      requesterRole: currentUser.role,
      details: {
        title: `Service Activation: ${serviceReqModal.serviceName}`,
        description: serviceJustification.trim(),
        serviceName: serviceReqModal.serviceName,
      },
      priority: 'Medium',
    });

    setServiceReqModal({ isOpen: false, serviceName: '' });
    setServiceJustification('');
    addToast('success', 'Activation Request Submitted', `Request to activate ${serviceReqModal.serviceName} submitted.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-actions-bar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
            Assigned Services & Quota Usage
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
            Monitor approved platform services, student license quotas, and capacity limits for {college?.name || 'Assigned College'}
          </p>
        </div>

        <button
          onClick={() => setIsQuotaModalOpen(true)}
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
          <TrendingUp size={14} />
          <span>Request Quota Increase</span>
        </button>
      </div>

      {/* Quota Usage Meter Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px 28px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '18px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
              Student License Quota Breakdown
            </h3>
            <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
              Approved under Institutional Partnership Agreement #{college?.agreement?.agreementNumber || 'MOU-CURRENT'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '999px',
                backgroundColor: quotaPercent >= 95 ? '#FEE2E2' : quotaPercent >= 80 ? '#FEF3C7' : '#DCFCE7',
                color: quotaPercent >= 95 ? '#991B1B' : quotaPercent >= 80 ? '#B45309' : '#166534',
              }}
            >
              {quotaPercent >= 95 ? 'CRITICAL CAPACITY' : quotaPercent >= 80 ? 'WARNING THRESHOLD' : 'HEALTHY CAPACITY'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, marginBottom: '6px' }}>
            <span style={{ color: '#0F172A' }}>{quotaUsed.toLocaleString()} of {quotaAllocated.toLocaleString()} Licenses Used</span>
            <span style={{ color: quotaPercent >= 90 ? '#E11D48' : '#2563EB' }}>{quotaPercent}%</span>
          </div>
          <div style={{ height: '12px', backgroundColor: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${quotaPercent}%`,
                backgroundColor: isSuspended ? '#EF4444' : quotaPercent >= 95 ? '#E11D48' : quotaPercent >= 80 ? '#F59E0B' : '#2563EB',
                borderRadius: '6px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* 4 Stat Indicators */}
        <div className="dashboard-provisioning-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>APPROVED QUOTA</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
              {quotaAllocated.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Maximum students</div>
          </div>

          <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>USED QUOTA</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#2563EB', marginTop: '2px' }}>
              {quotaUsed.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Currently provisioned</div>
          </div>

          <div style={{ padding: '14px', backgroundColor: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
            <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700 }}>REMAINING CAPACITY</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>
              {quotaRemaining.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#166534' }}>Available for new students</div>
          </div>

          <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>WARNING THRESHOLD</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#475569', marginTop: '2px' }}>
              {college?.quota.warningThreshold || 80}%
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Critical alert at {college?.quota.criticalThreshold || 95}%</div>
          </div>
        </div>
      </div>

      {/* ASSIGNED SERVICES LIST */}
      <div>
        <h3 style={{ margin: '0 0 14px', fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
          Approved Institutional Services ({assignedServices.length})
        </h3>

        <div className="cards-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {assignedServices.map((srv) => (
            <div
              key={srv.serviceId}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={18} />
                    </div>
                    <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A', lineHeight: 1.25 }}>{srv.name}</span>
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      backgroundColor: srv.isEnabled && !isSuspended ? '#DCFCE7' : '#FEE2E2',
                      color: srv.isEnabled && !isSuspended ? '#166534' : '#991B1B',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      letterSpacing: '0.03em',
                    }}
                  >
                    {srv.isEnabled && !isSuspended ? 'ASSIGNED' : 'ON HOLD'}
                  </span>
                </div>

                <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: '#64748B', lineHeight: 1.5 }}>
                  Enterprise student license with portfolio builder, QR sharing, and recruiter connectivity.
                </p>

                <div style={{ padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748B' }}>License Tier</span>
                    <strong style={{ color: '#0F172A' }}>{srv.planLevel || 'Enterprise'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                    <span style={{ color: '#64748B' }}>Students Enrolled</span>
                    <strong style={{ color: '#2563EB' }}>{srv.studentsUsing.toLocaleString()} students</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => navigate('/college/give-access')}
                  disabled={isSuspended || !srv.isEnabled}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '7px',
                    backgroundColor: isSuspended || !srv.isEnabled ? '#94A3B8' : '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: isSuspended || !srv.isEnabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  Provision Access
                </button>
                <button
                  onClick={() => navigate('/college/entitlements')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '7px',
                    backgroundColor: '#FFFFFF',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  View Entitlements
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* UNASSIGNED PLATFORM SERVICES (Request Addition) */}
      {unassignedPlatformServices.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
            Available Platform Services (Not Yet Assigned)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {unassignedPlatformServices.map((srv) => (
              <div
                key={srv.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{srv.name}</span>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', backgroundColor: '#F1F5F9', padding: '2px 7px', borderRadius: '4px' }}>
                      {srv.category}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>
                    {srv.description}
                  </p>
                </div>

                <button
                  onClick={() => setServiceReqModal({ isOpen: true, serviceName: srv.name })}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#FFFFFF',
                    color: '#2563EB',
                    border: '1px solid #BFDBFE',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Send size={13} />
                  <span>Request Activation for College</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REQUEST QUOTA MODAL */}
      {isQuotaModalOpen && (
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
            <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
              Request Quota Expansion
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#64748B' }}>
              Submit a formal request to BEXO Central Administration. Current quota is <strong>{quotaAllocated.toLocaleString()}</strong>.
            </p>

            <form onSubmit={handleQuotaSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Additional Licenses Needed *
                  </label>
                  <input
                    type="number"
                    value={requestedQuota}
                    onChange={(e) => setRequestedQuota(e.target.value)}
                    min={50}
                    step={50}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                    Projected new quota: {(quotaAllocated + (parseInt(requestedQuota, 10) || 0)).toLocaleString()} licenses
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Academic Justification *
                  </label>
                  <textarea
                    rows={3}
                    value={quotaJustification}
                    onChange={(e) => setQuotaJustification(e.target.value)}
                    placeholder="e.g. Onboarding incoming 2026 CS and IT freshmen batches"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsQuotaModalOpen(false)}
                    style={{ padding: '8px 16px', borderRadius: '7px', backgroundColor: '#F1F5F9', border: 'none', color: '#475569', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 20px', borderRadius: '7px', backgroundColor: '#2563EB', border: 'none', color: '#FFFFFF', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Send size={13} />
                    <span>Submit Request</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST SERVICE ACTIVATION MODAL */}
      {serviceReqModal.isOpen && (
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
            <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
              Request Service Activation
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#64748B' }}>
              Request activation of <strong>{serviceReqModal.serviceName}</strong> for {college?.name || 'this college'}.
            </p>

            <form onSubmit={handleServiceReqSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Reason & Expected Student Usage *
                  </label>
                  <textarea
                    rows={3}
                    value={serviceJustification}
                    onChange={(e) => setServiceJustification(e.target.value)}
                    placeholder="e.g. Placement Cell requires ATS Resume Engine for upcoming campus placement drive"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setServiceReqModal({ isOpen: false, serviceName: '' })}
                    style={{ padding: '8px 16px', borderRadius: '7px', backgroundColor: '#F1F5F9', border: 'none', color: '#475569', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 20px', borderRadius: '7px', backgroundColor: '#2563EB', border: 'none', color: '#FFFFFF', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Send size={13} />
                    <span>Submit Request</span>
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
