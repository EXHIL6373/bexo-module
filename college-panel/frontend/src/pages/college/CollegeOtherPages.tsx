import React, { useState, useMemo } from 'react';
import { useRouter } from '../../router/Router';
import { useAdmin } from '../../context/AdminContext';
import { canPerformCollegeAction } from '../../lib/collegePermissions';
import {
  FileQuestion,
  CreditCard,
  Bell,
  BarChart3,
  Megaphone,
  CheckSquare,
  Activity,
  Settings,
  HelpCircle,
  Award,
  Send,
  Plus,
  CheckCircle2,
  Clock,
  Download,
  AlertTriangle,
  Mail,
  Phone,
  Shield,
  Search,
  Filter,
  Check,
  Calendar,
  Building2,
  Lock,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Layers,
  FileText,
  DollarSign,
  Info,
  Trash2,
} from 'lucide-react';

/* ==========================================================================
 * 1. COLLEGE REQUESTS PAGE (Section 15)
 * ========================================================================== */
export const CollegeRequestsPage: React.FC = () => {
  const { currentUser, colleges, currentCollege, getScopedApprovalsForCollege, submitRequest, addToast } = useAdmin();
  const college = currentCollege || colleges.find((c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName);
  const collegeId = currentUser.collegeId || college?.id || '';
  const isSuspended = college?.status === 'Suspended' || currentUser.accountStatus === 'SUSPENDED';

  const canSubmit = canPerformCollegeAction(currentUser.role, 'SUBMIT_REQUESTS');

  const [reqType, setReqType] = useState('Quota Expansion');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [subject, setSubject] = useState('');
  const [relatedRecord, setRelatedRecord] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('500');
  const [attachmentNote, setAttachmentNote] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const scopedApprovals = useMemo(() => {
    return getScopedApprovalsForCollege();
  }, [getScopedApprovalsForCollege]);

  const filteredRequests = useMemo(() => {
    return scopedApprovals.filter((req) => {
      const matchesStatus = statusFilter === 'ALL' || req.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesSearch =
        (req.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.details?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.details?.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.requester || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [scopedApprovals, statusFilter, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !subject.trim()) {
      addToast('error', 'Validation Error', 'Please provide a subject and detailed justification.');
      return;
    }

    const mappedType =
      reqType === 'Quota Expansion'
        ? 'Quota Increase'
        : reqType === 'Service Activation'
        ? 'Service Activation'
        : reqType === 'Agreement Amendment'
        ? 'Agreement Request'
        : reqType.includes('Access')
        ? 'Access Request'
        : 'Other Operational Request';

    submitRequest({
      type: mappedType,
      collegeId,
      collegeName: college?.name || 'Assigned College',
      requester: currentUser.name,
      requesterEmail: currentUser.email,
      requesterRole: currentUser.role,
      details: {
        title: subject,
        description: `${description} ${relatedRecord ? `[Ref: ${relatedRecord}]` : ''} ${attachmentNote ? `[Attachment: ${attachmentNote}]` : ''}`,
        requestedValue: reqType === 'Quota Expansion' ? quantity : undefined,
      },
      priority,
    });

    setSubject('');
    setDescription('');
    setRelatedRecord('');
    setAttachmentNote('');
    addToast('success', 'Request Submitted', 'Your request has been routed to the BEXO Central Admin Approval Desk.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
          Institutional Requests Desk
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
          Submit and track administrative requests, quota expansions, and service activation proposals
        </p>
      </div>

      {isSuspended && (
        <div style={{ padding: '12px 18px', backgroundColor: '#FEF2F2', border: '1px solid #FECDD3', borderRadius: '10px', color: '#991B1B', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} color="#DC2626" />
          <span><strong>Notice:</strong> Your college account is suspended. Certain administrative requests may require direct manual intervention with BEXO Support.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Left Column: Submit Request Form */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileQuestion size={18} color="#2563EB" />
            <span>Submit New Institutional Request</span>
          </h3>

          {!canSubmit ? (
            <div style={{ padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '8px', color: '#64748B', fontSize: '13px', textAlign: 'center' }}>
              Your role ({currentUser.role.replace('_', ' ')}) has read-only access to institutional requests.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Request Category *
                  </label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="Quota Expansion">Quota Expansion</option>
                    <option value="Service Activation">Service Activation</option>
                    <option value="Student Access Issue">Student Access Issue</option>
                    <option value="Student Access Revocation">Student Access Revocation</option>
                    <option value="College Information Update">College Information Update</option>
                    <option value="Staff Permission Change">Staff Permission Change</option>
                    <option value="Agreement Amendment">Agreement / Renewal</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Other">Other Operational Request</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="Low">Low (Standard Routine)</option>
                    <option value="Medium">Medium (3-5 Days SLA)</option>
                    <option value="High">High (Urgent Academic Need)</option>
                    <option value="Critical">Critical (24h Escalation)</option>
                  </select>
                </div>
              </div>

              {reqType === 'Quota Expansion' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Requested Additional Quota (Students)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                    Current Allocated: {(college?.quota?.allocated || 0).toLocaleString()} | Remaining: {Math.max(0, (college?.quota?.allocated || 0) - (college?.quota?.used || 0)).toLocaleString()}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Additional 500 licenses for 2026 Batch CSE Freshmen"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Related Student Roll / Service / Department (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BEXO Job Portal / Roll 24CS101-24CS150"
                  value={relatedRecord}
                  onChange={(e) => setRelatedRecord(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Detailed Justification *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide comprehensive institutional rationale, expected student cohort details, and dates..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Supporting Document Link / Ref (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dean_Approval_Circular_Ref_891.pdf"
                  value={attachmentNote}
                  onChange={(e) => setAttachmentNote(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '8px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
                }}
              >
                <Send size={15} />
                <span>Submit to BEXO Central Authority</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Request Tracking & Decision History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                  Institutional Request History
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {filteredRequests.length} logged requests
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
                  <input
                    type="text"
                    placeholder="Search requests by type, title, or requester..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', height: '36px', padding: '0 10px 0 32px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', outline: 'none' }}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ height: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', backgroundColor: '#FFFFFF', color: '#334155' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                No administrative requests match your criteria.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
                {filteredRequests.map((req) => {
                  const isApproved = req.status === 'Approved';
                  const isRejected = req.status === 'Rejected';
                  const isPending = !isApproved && !isRejected;

                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#F8FAFC',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                            {req.details?.title || req.type}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                            ID: {req.id} • {req.type}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: isApproved ? '#DCFCE7' : isRejected ? '#FEE2E2' : '#FEF3C7',
                            color: isApproved ? '#166534' : isRejected ? '#991B1B' : '#92400E',
                          }}
                        >
                          {req.status}
                        </span>
                      </div>

                      <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: '#475569', lineHeight: 1.4 }}>
                        {req.details?.description}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #E2E8F0', fontSize: '11px', color: '#94A3B8' }}>
                        <span>Submitted by {req.requester}</span>
                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>

                      {req.reviewedBy && (
                        <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', fontSize: '11.5px', color: '#334155' }}>
                          <strong>BEXO Decision ({req.reviewedBy}):</strong> {req.decisionReason || 'Processed'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
 * 2. COLLEGE BILLING & INVOICES PAGE (Section 17)
 * ========================================================================== */
export const CollegeBillingPage: React.FC = () => {
  const { currentUser, colleges, currentCollege, getScopedPaymentsForCollege, addToast } = useAdmin();
  const college = currentCollege || colleges.find((c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName);
  const collegeId = currentUser.collegeId || college?.id || '';

  // Strict tenant isolation: only retrieve payments for authenticated college
  const scopedInvoices = useMemo(() => {
    return getScopedPaymentsForCollege();
  }, [getScopedPaymentsForCollege]);

  const [activeInvoice, setActiveInvoice] = useState<any | null>(null);

  const totalPaid = scopedInvoices.filter((p) => p.status === 'Paid').reduce((acc, p) => acc + p.amount, 0);
  const totalPending = scopedInvoices.filter((p) => p.status !== 'Paid').reduce((acc, p) => acc + p.amount, 0);

  const handleDownloadInvoice = (inv: any) => {
    const content = `========================================================
BEXO TECHNOLOGIES — INSTITUTIONAL TAX INVOICE & RECEIPT
========================================================
Invoice Reference: ${inv.invoiceNumber}
Date: ${inv.date}
Partner Institution: ${college?.name} (${college?.code})
Billing Address: ${college?.city}, ${college?.state}
GSTIN / Tax ID: 33AAACB1234F1Z8
Description: ${inv.description}
Service Period: Current Academic Tier-1 MOU
Amount: INR ${inv.amount.toLocaleString()}
Payment Status: ${inv.status.toUpperCase()}
Payment Method: Electronic Fund Transfer (NEFT/RTGS)

Issued by: BEXO Technologies Institutional Billing Division
Receipt verification link: https://portal.atbexo.com/billing/verify?inv=${inv.invoiceNumber}
========================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice_${inv.invoiceNumber}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Receipt Downloaded', `Invoice ${inv.invoiceNumber} downloaded.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
          Institutional Billing & Payments
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
          Official subscription invoices, fee receipts, and payment history for {college?.name || 'this college'}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Total Invoiced & Cleared</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#16A34A', marginTop: '6px' }}>
            ₹{totalPaid.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Paid against institutional MOU</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Pending / Due Balance</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: totalPending > 0 ? '#E11D48' : '#0F172A', marginTop: '6px' }}>
            ₹{totalPending.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
            {totalPending === 0 ? 'All invoices up to date' : 'Payment scheduled'}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Current Billing Cycle</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563EB', marginTop: '6px' }}>
            Annual Academic (2026-27)
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Next renewal: May 2027</div>
        </div>
      </div>

      {/* Invoices Table Card */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
            Invoices & Payment Records
          </h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            {scopedInvoices.length} invoices registered
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                <th style={{ padding: '12px 18px', width: '180px' }}>Invoice ID</th>
                <th style={{ padding: '12px 18px', minWidth: '220px' }}>Billing Item</th>
                <th style={{ padding: '12px 18px', width: '140px' }}>Amount</th>
                <th style={{ padding: '12px 18px', width: '120px' }}>Status</th>
                <th style={{ padding: '12px 18px', width: '140px' }}>Issue Date</th>
                <th style={{ padding: '12px 18px', width: '180px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scopedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                    No invoice records found for this college.
                  </td>
                </tr>
              ) : (
                scopedInvoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: '#0F172A' }}>
                      {inv.invoiceNumber}
                    </td>
                    <td style={{ padding: '12px 18px', color: '#334155' }}>
                      {inv.description}
                    </td>
                    <td style={{ padding: '12px 18px', fontWeight: 800, color: '#0F172A' }}>
                      ₹{inv.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: inv.status === 'Paid' ? '#DCFCE7' : '#FEF3C7',
                          color: inv.status === 'Paid' ? '#166534' : '#92400E',
                        }}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', color: '#64748B' }}>
                      {inv.date}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => setActiveInvoice(inv)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#FFFFFF',
                            color: '#334155',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(inv)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #BFDBFE',
                            backgroundColor: '#EFF6FF',
                            color: '#1D4ED8',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Download size={13} />
                          <span>Receipt</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {activeInvoice && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', maxWidth: '500px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                Tax Invoice {activeInvoice.invoiceNumber}
              </h3>
              <button onClick={() => setActiveInvoice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#94A3B8' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Institution:</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{college?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Description:</span>
                <span style={{ color: '#0F172A' }}>{activeInvoice.description}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Total Amount:</span>
                <span style={{ fontWeight: 800, color: '#16A34A', fontSize: '15px' }}>₹{activeInvoice.amount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Status:</span>
                <span style={{ fontWeight: 700, color: activeInvoice.status === 'Paid' ? '#16A34A' : '#D97706' }}>{activeInvoice.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Issue Date:</span>
                <span style={{ color: '#0F172A' }}>{activeInvoice.date}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setActiveInvoice(null)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '13px', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadInvoice(activeInvoice)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} />
                <span>Download Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
 * 3. COLLEGE NOTIFICATIONS PAGE (Section 18)
 * ========================================================================== */
export const CollegeNotificationsPage: React.FC = () => {
  const { currentUser, colleges, getScopedNotificationsForCollege, markNotificationAsRead, markAllNotificationsAsRead, addToast } = useAdmin();
  const college = colleges.find((c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName);
  const { navigate } = useRouter();

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [readFilter, setReadFilter] = useState('ALL');

  const scopedNotifications = useMemo(() => {
    return getScopedNotificationsForCollege();
  }, [getScopedNotificationsForCollege]);

  const filteredNotifications = useMemo(() => {
    return scopedNotifications.filter((n) => {
      const matchesRead = readFilter === 'ALL' || (readFilter === 'UNREAD' ? !n.isRead : n.isRead);
      const matchesCategory = categoryFilter === 'ALL' || n.category === categoryFilter;
      return matchesRead && matchesCategory;
    });
  }, [scopedNotifications, readFilter, categoryFilter]);

  const unreadCount = scopedNotifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
              Institutional Notifications
            </h1>
            {unreadCount > 0 && (
              <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
            System updates, student credential notifications, and SLA announcements for {college?.name || 'this college'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => {
              markAllNotificationsAsRead();
              addToast('success', 'Notifications Updated', 'All notifications marked as read.');
            }}
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
            <Check size={14} />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '14px 18px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="#94A3B8" />
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>Filter:</span>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', backgroundColor: '#FFFFFF' }}
        >
          <option value="ALL">All Categories</option>
          <option value="Student">Student Management</option>
          <option value="Provisioning">Provisioning Jobs</option>
          <option value="Quota">Quota Alerts</option>
          <option value="Agreement">Agreement Expiry</option>
          <option value="System">System Announcements</option>
        </select>

        <select
          value={readFilter}
          onChange={(e) => setReadFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', backgroundColor: '#FFFFFF' }}
        >
          <option value="ALL">All Status</option>
          <option value="UNREAD">Unread Only</option>
          <option value="READ">Read Only</option>
        </select>
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '50px 20px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: '13.5px' }}>
            No notifications match your current filters.
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                backgroundColor: n.isRead ? '#FFFFFF' : '#F0F9FF',
                border: n.isRead ? '1px solid #E2E8F0' : '1px solid #BAE6FD',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '14px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: n.isRead ? '#F1F5F9' : '#EFF6FF',
                    color: n.isRead ? '#64748B' : '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bell size={18} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{n.title}</span>
                    {!n.isRead && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }} />
                    )}
                  </div>
                  <p style={{ margin: '4px 0 6px', fontSize: '13px', color: '#475569', lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    {new Date(n.createdAt).toLocaleString()} {n.category ? `• ${n.category}` : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!n.isRead && (
                  <button
                    onClick={() => markNotificationAsRead(n.id)}
                    title="Mark as read"
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#475569',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                    }}
                  >
                    Mark Read
                  </button>
                )}
                {n.relatedEntity && (
                  <button
                    onClick={() => {
                      if (n.relatedEntity?.type === 'job') navigate('/college/provisioning');
                      else if (n.relatedEntity?.type === 'approval') navigate('/college/requests');
                      else if (n.relatedEntity?.type === 'student') navigate('/college/students');
                      else if (n.relatedEntity?.type === 'agreement') navigate('/college/agreement');
                      else navigate('/college/dashboard');
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid #BFDBFE',
                      backgroundColor: '#EFF6FF',
                      color: '#1D4ED8',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>View Record</span>
                    <ChevronRight size={13} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ==========================================================================
 * 4. COLLEGE REPORTS & ANALYTICS PAGE (Section 19)
 * ========================================================================== */
export const CollegeReportsPage: React.FC = () => {
  const { currentUser, colleges, currentCollege, getScopedStudentsForCollege, provisioningJobs, addToast } = useAdmin();
  const college = currentCollege || colleges.find((c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName);
  const collegeId = college?.id || currentUser.collegeId || '';

  const students = getScopedStudentsForCollege(collegeId);
  const jobs = provisioningJobs.filter((j) => j.collegeId === collegeId);

  const [activeReportTab, setActiveReportTab] = useState<'DIRECTORY' | 'ACCESS' | 'DEPARTMENTS' | 'QUOTA' | 'JOBS'>('DIRECTORY');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [accessFilter, setAccessFilter] = useState('ALL');

  const departments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchDept = deptFilter === 'ALL' || s.department === deptFilter;
      const matchAccess = accessFilter === 'ALL' || s.accessStatus === accessFilter;
      return matchDept && matchAccess;
    });
  }, [students, deptFilter, accessFilter]);

  // Dynamic CSV Export Generator
  const handleExportCSV = () => {
    let csvHeader = '';
    let csvRows = '';
    let reportName = 'College_Report';

    if (activeReportTab === 'DIRECTORY') {
      reportName = 'Student_Directory';
      csvHeader = 'Student ID,Full Name,Roll Number,Email,Department,Course,Batch,Access Status,Date Added\n';
      csvRows = filteredStudents
        .map(
          (s) =>
            `"${s.id}","${s.name}","${s.rollNumber}","${s.email}","${s.department || ''}","${s.course || ''}","${s.batch || ''}","${s.accessStatus}","${s.createdAt}"`
        )
        .join('\n');
    } else if (activeReportTab === 'ACCESS') {
      reportName = 'Access_Entitlements';
      csvHeader = 'Student Name,Roll Number,Email,Department,Status,Last Activity\n';
      csvRows = filteredStudents
        .filter((s) => s.accessStatus === 'Active')
        .map(
          (s) =>
            `"${s.name}","${s.rollNumber}","${s.email}","${s.department || ''}","${s.accessStatus}","${s.lastActivityAt || ''}"`
        )
        .join('\n');
    } else if (activeReportTab === 'DEPARTMENTS') {
      reportName = 'Department_Summary';
      csvHeader = 'Department,Total Enrolled,Active Access,Pending Access\n';
      const deptCounts: Record<string, { total: number; active: number; pending: number }> = {};
      students.forEach((s) => {
        const d = s.department || 'General';
        if (!deptCounts[d]) deptCounts[d] = { total: 0, active: 0, pending: 0 };
        deptCounts[d].total += 1;
        if (s.accessStatus === 'Active') deptCounts[d].active += 1;
        else deptCounts[d].pending += 1;
      });
      csvRows = Object.entries(deptCounts)
        .map(([dept, c]) => `"${dept}",${c.total},${c.active},${c.pending}`)
        .join('\n');
    } else if (activeReportTab === 'QUOTA') {
      reportName = 'Quota_Utilization';
      csvHeader = 'Metric,Value\n';
      csvRows = `Allocated Quota,${college?.quota.allocated || 2500}\nUsed Quota,${college?.quota.used || 0}\nRemaining Quota,${Math.max(0, (college?.quota.allocated || 2500) - (college?.quota.used || 0))}\nUtilization Rate,${Math.round(((college?.quota.used || 0) / (college?.quota.allocated || 2500)) * 100)}%`;
    } else if (activeReportTab === 'JOBS') {
      reportName = 'Provisioning_Jobs';
      csvHeader = 'Job ID,Source,Total,Successful,Failed,Skipped,Status,Created At\n';
      csvRows = jobs
        .map(
          (j) =>
            `"${j.id}","${j.source}",${j.totalRecords},${j.successful},${j.failed},${j.partial},"${j.status}","${j.createdAt}"`
        )
        .join('\n');
    }

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportName}_${college?.code || 'COL'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Export Complete', `${reportName} exported successfully.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
            Operational Reports & Analytics
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
            Generate institution-scoped compliance summaries, access rosters, and provisioning exports
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          style={{
            padding: '9px 16px',
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
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
          }}
        >
          <Download size={14} />
          <span>Export Report (CSV)</span>
        </button>
      </div>

      {/* Report Selection Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '2px', overflowX: 'auto' }}>
        {[
          { id: 'DIRECTORY', label: 'Student Directory' },
          { id: 'ACCESS', label: 'Access Summary' },
          { id: 'DEPARTMENTS', label: 'Department Breakdown' },
          { id: 'QUOTA', label: 'Quota Utilization' },
          { id: 'JOBS', label: 'Provisioning Jobs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeReportTab === tab.id ? '#2563EB' : '#64748B',
              borderBottom: activeReportTab === tab.id ? '2px solid #2563EB' : '2px solid transparent',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Row for Student Reports */}
      {(activeReportTab === 'DIRECTORY' || activeReportTab === 'ACCESS') && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Filter Report Data:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', backgroundColor: '#FFFFFF' }}
          >
            <option value="ALL">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', backgroundColor: '#FFFFFF' }}
          >
            <option value="ALL">All Access Statuses</option>
            <option value="Active">Active Licenses</option>
            <option value="Revoked">Revoked / Suspended</option>
            <option value="None">Pending Provisioning</option>
          </select>
        </div>
      )}

      {/* Report Data Display */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {activeReportTab === 'DIRECTORY' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  <th style={{ padding: '12px 18px', width: '220px' }}>Student</th>
                  <th style={{ padding: '12px 18px', width: '140px' }}>Roll Number</th>
                  <th style={{ padding: '12px 18px', width: '180px' }}>Department</th>
                  <th style={{ padding: '12px 18px', width: '180px' }}>Course / Batch</th>
                  <th style={{ padding: '12px 18px', width: '140px' }}>Access Status</th>
                  <th style={{ padding: '12px 18px', width: '140px' }}>Enrolled On</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.slice(0, 50).map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: '#0F172A' }}>{s.name}</td>
                    <td style={{ padding: '12px 18px', fontFamily: 'monospace' }}>{s.rollNumber}</td>
                    <td style={{ padding: '12px 18px', color: '#475569' }}>{s.department || 'General'}</td>
                    <td style={{ padding: '12px 18px', color: '#64748B' }}>{s.course || 'B.Tech'} ({s.batch || '2026'})</td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: s.accessStatus === 'Active' ? '#DCFCE7' : '#FEF3C7', color: s.accessStatus === 'Active' ? '#166534' : '#92400E' }}>
                        {s.accessStatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', color: '#94A3B8' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReportTab === 'ACCESS' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  <th style={{ padding: '12px 18px', width: '220px' }}>Student</th>
                  <th style={{ padding: '12px 18px', width: '140px' }}>Roll Number</th>
                  <th style={{ padding: '12px 18px', width: '200px' }}>Department</th>
                  <th style={{ padding: '12px 18px', width: '140px' }}>Access Status</th>
                  <th style={{ padding: '12px 18px', width: '160px' }}>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.filter((s) => s.accessStatus === 'Active').map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: '#0F172A' }}>{s.name}</td>
                    <td style={{ padding: '12px 18px', fontFamily: 'monospace' }}>{s.rollNumber}</td>
                    <td style={{ padding: '12px 18px', color: '#475569' }}>{s.department || 'General'}</td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#166534' }}>
                        Active Access
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', color: '#64748B' }}>{s.lastActivityAt ? new Date(s.lastActivityAt).toLocaleDateString() : 'Recent'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReportTab === 'DEPARTMENTS' && (
          <div style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
              Department-wise Enrollment & Access Breakdown
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {departments.map((dept) => {
                const total = students.filter((s) => s.department === dept).length;
                const active = students.filter((s) => s.department === dept && s.accessStatus === 'Active').length;
                const pct = total > 0 ? Math.round((active / total) * 100) : 0;

                return (
                  <div key={dept} style={{ padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{dept}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12.5px', color: '#64748B' }}>
                      <span>Enrolled Students:</span>
                      <strong style={{ color: '#0F172A' }}>{total}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12.5px', color: '#64748B' }}>
                      <span>Active BEXO Access:</span>
                      <strong style={{ color: '#16A34A' }}>{active} ({pct}%)</strong>
                    </div>
                    <div style={{ height: '6px', borderRadius: '999px', backgroundColor: '#E2E8F0', marginTop: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#2563EB' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeReportTab === 'QUOTA' && (
          <div style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
              Institutional Quota Utilization Analysis
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Allocated License Capacity</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
                  {(college?.quota.allocated || 2500).toLocaleString()}
                </div>
              </div>
              <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Used Quota (Active Students)</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563EB', marginTop: '4px' }}>
                  {(college?.quota.used || 0).toLocaleString()}
                </div>
              </div>
              <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Remaining Capacity</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#16A34A', marginTop: '4px' }}>
                  {Math.max(0, (college?.quota.allocated || 2500) - (college?.quota.used || 0)).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeReportTab === 'JOBS' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', fontWeight: 700 }}>
                  <th style={{ padding: '12px 18px' }}>Job ID</th>
                  <th style={{ padding: '12px 18px' }}>Method</th>
                  <th style={{ padding: '12px 18px' }}>Total Records</th>
                  <th style={{ padding: '12px 18px' }}>Success</th>
                  <th style={{ padding: '12px 18px' }}>Failed</th>
                  <th style={{ padding: '12px 18px' }}>Status</th>
                  <th style={{ padding: '12px 18px' }}>Executed</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 18px', fontWeight: 700, fontFamily: 'monospace' }}>{j.id}</td>
                    <td style={{ padding: '12px 18px' }}>{j.source}</td>
                    <td style={{ padding: '12px 18px', fontWeight: 700 }}>{j.totalRecords}</td>
                    <td style={{ padding: '12px 18px', color: '#16A34A', fontWeight: 700 }}>{j.successful}</td>
                    <td style={{ padding: '12px 18px', color: j.failed > 0 ? '#DC2626' : '#64748B' }}>{j.failed}</td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: j.status === 'Completed' ? '#DCFCE7' : '#FEF3C7', color: j.status === 'Completed' ? '#166534' : '#92400E' }}>
                        {j.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', color: '#94A3B8' }}>{new Date(j.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ==========================================================================
 * 5. COLLEGE ANNOUNCEMENTS & TASKS PAGE (Section 20)
 * ========================================================================== */
export const CollegeAnnouncementsPage: React.FC = () => {
  const { getScopedAnnouncementsForCollege } = useAdmin();
  const collegeAnnouncements = getScopedAnnouncementsForCollege();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAnnouncements = collegeAnnouncements.filter((a) => {
    return (
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.targetAudience || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
          Official Announcements
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
          Platform advisories, feature updates, and notices from BEXO Central Operations
        </p>
      </div>

      <div style={{ position: 'relative', maxWidth: '400px' }}>
        <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
        <input
          type="text"
          placeholder="Search announcements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredAnnouncements.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Megaphone size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                  {item.title}
                </h3>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: item.priority === 'Urgent' ? '#FEE2E2' : '#EFF6FF',
                  color: item.priority === 'Urgent' ? '#991B1B' : '#1D4ED8',
                }}
              >
                {item.priority} Priority
              </span>
            </div>

            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6, margin: '0 0 14px' }}>
              {item.content}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
              <span>Published by {item.author} • {new Date(item.publishedAt).toLocaleDateString()}</span>
              <span>Audience: {item.targetAudience}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==========================================================================
 * 6. COLLEGE TASKS & DEADLINES PAGE (Section 20)
 * ========================================================================== */
export const CollegeTasksPage: React.FC = () => {
  const { getScopedTasksForCollege, toggleTaskComplete, addToast } = useAdmin();
  const { navigate } = useRouter();

  const collegeTasks = getScopedTasksForCollege();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  const filteredTasks = collegeTasks.filter((t) => {
    if (filter === 'PENDING') return t.status !== 'Completed';
    if (filter === 'COMPLETED') return t.status === 'Completed';
    return true;
  });

  const completedCount = collegeTasks.filter((t) => t.status === 'Completed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
            Institutional Tasks & Deadlines
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
            Track operational milestones, roster imports, and academic compliance deadlines
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            {completedCount} of {collegeTasks.length} Completed
          </span>
          <div style={{ width: '100px', height: '8px', borderRadius: '999px', backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
            <div style={{ width: `${(completedCount / (collegeTasks.length || 1)) * 100}%`, height: '100%', backgroundColor: '#16A34A' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {(['ALL', 'PENDING', 'COMPLETED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              border: filter === tab ? '1px solid #2563EB' : '1px solid #CBD5E1',
              backgroundColor: filter === tab ? '#EFF6FF' : '#FFFFFF',
              color: filter === tab ? '#1D4ED8' : '#475569',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {tab === 'ALL' ? 'All Tasks' : tab === 'PENDING' ? 'Pending' : 'Completed'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredTasks.map((t) => {
          const isDone = t.status === 'Completed';

          return (
            <div
              key={t.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '16px 20px',
                border: isDone ? '1px solid #E2E8F0' : '1px solid #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                opacity: isDone ? 0.75 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => {
                    toggleTaskComplete(t.id);
                    addToast('info', 'Task Updated', `Task marked as ${isDone ? 'pending' : 'completed'}.`);
                  }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />

                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: isDone ? '#64748B' : '#0F172A', textDecoration: isDone ? 'line-through' : 'none' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                    {t.description}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={12} />
                    <span>Due: {t.dueDate}</span>
                    <span>• Priority: {t.priority}</span>
                  </div>
                </div>
              </div>

              {t.actionUrl && (
                <button
                  onClick={() => navigate(t.actionUrl!)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>Go to Workflow</span>
                  <ChevronRight size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ==========================================================================
 * 7. COLLEGE ACTIVITY & AUDIT LOG PAGE (Section 21)
 * ========================================================================== */
export const CollegeActivityPage: React.FC = () => {
  const { currentUser, colleges, currentCollege, getScopedAuditLogsForCollege, addToast } = useAdmin();
  const college = currentCollege || colleges.find((c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName);
  const collegeId = currentUser.collegeId || college?.id || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  // Strict tenant scoping: Only show audit events belonging to this college
  const scopedLogs = useMemo(() => {
    return getScopedAuditLogsForCollege();
  }, [getScopedAuditLogsForCollege]);

  const filteredLogs = useMemo(() => {
    return scopedLogs.filter((log) => {
      const matchSearch =
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.entityName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchAction = actionFilter === 'ALL' || log.action.includes(actionFilter);
      return matchSearch && matchAction;
    });
  }, [scopedLogs, searchTerm, actionFilter]);

  const handleExportAuditCSV = () => {
    const csvHeader = 'Timestamp,Action,Entity,Target Record,Actor Name,Actor Role\n';
    const csvRows = filteredLogs
      .map(
        (l) =>
          `"${l.timestamp}","${l.action}","${l.entity}","${l.entityName || ''}","${l.actorName}","${l.actorRole || ''}"`
      )
      .join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Audit_Log_${college?.code || 'COL'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Audit Exported', 'Activity log exported as CSV.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
            Institutional Audit Trail
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
            Authoritative, immutable event history for {college?.name || 'this college'}
          </p>
        </div>

        <button
          onClick={handleExportAuditCSV}
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
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: '14px 18px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search by action, actor, or target record..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '13px' }}
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', backgroundColor: '#FFFFFF' }}
        >
          <option value="ALL">All Actions</option>
          <option value="STUDENT">Student Actions</option>
          <option value="PROVISION">Provisioning</option>
          <option value="STAFF">Staff Management</option>
          <option value="QUOTA">Quota Requests</option>
          <option value="LOGIN">Authentication</option>
        </select>
      </div>

      {/* Table Card */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 18px', width: '180px' }}>Timestamp</th>
                <th style={{ padding: '12px 18px', width: '230px' }}>Action</th>
                <th style={{ padding: '12px 18px', width: '140px' }}>Entity Type</th>
                <th style={{ padding: '12px 18px', minWidth: '220px' }}>Target Record</th>
                <th style={{ padding: '12px 18px', width: '200px' }}>Actor</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                    No activity records found matching query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 18px', color: '#64748B', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#EFF6FF',
                          border: '1px solid #DBEAFE',
                          color: '#1D4ED8',
                          fontFamily: 'monospace',
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={log.action}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', color: '#475569', whiteSpace: 'nowrap' }}>
                      {log.entity}
                    </td>
                    <td style={{ padding: '12px 18px', fontWeight: 600, color: '#0F172A' }}>
                      {log.entityName || '-'}
                    </td>
                    <td style={{ padding: '12px 18px', color: '#334155', whiteSpace: 'nowrap' }}>
                      {log.actorName} ({log.actorRole || 'Staff'})
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
 * 8. COLLEGE SETTINGS PAGE (Section 22)
 * ========================================================================== */
export const CollegeSettingsPage: React.FC = () => {
  const { currentUser, colleges, currentCollege, updateCollegeSettings, addToast } = useAdmin();
  const college = currentCollege || colleges.find((c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName);
  const collegeId = college?.id || currentUser.collegeId || '';

  const canEditSettings = canPerformCollegeAction(currentUser.role, 'EDIT_COLLEGE_SETTINGS');

  const [contactName, setContactName] = useState(college?.primaryContact?.name || '');
  const [contactEmail, setContactEmail] = useState(college?.primaryContact?.email || '');
  const [contactMobile, setContactMobile] = useState(college?.primaryContact?.mobile || '');
  const [contactDesignation, setContactDesignation] = useState(college?.primaryContact?.designation || 'Registrar / Dean');
  const [address, setAddress] = useState(college?.address || `${college?.city || 'Chennai'}, ${college?.state || 'Tamil Nadu'}`);
  const [notifyOnProvision, setNotifyOnProvision] = useState(true);
  const [notifyOnQuota, setNotifyOnQuota] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSettings) {
      addToast('error', 'Unauthorized', 'Only College Admins can update institutional settings.');
      return;
    }

    updateCollegeSettings(collegeId, {
      address,
      primaryContact: {
        name: contactName,
        email: contactEmail,
        mobile: contactMobile,
        designation: contactDesignation,
      },
    });

    addToast('success', 'Settings Saved', 'Institutional profile and contact information updated.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
          College Settings
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
          Maintain permitted institutional contact information and notification preferences
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Editable Permitted Settings */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
            Institutional Profile & Contacts
          </h3>

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Primary Administrative Contact Person
              </label>
              <input
                type="text"
                disabled={!canEditSettings}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Official Email
                </label>
                <input
                  type="email"
                  disabled={!canEditSettings}
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Contact Mobile
                </label>
                <input
                  type="text"
                  disabled={!canEditSettings}
                  value={contactMobile}
                  onChange={(e) => setContactMobile(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Designation / Title
              </label>
              <input
                type="text"
                disabled={!canEditSettings}
                value={contactDesignation}
                onChange={(e) => setContactDesignation(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Campus Physical Address
              </label>
              <input
                type="text"
                disabled={!canEditSettings}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px', marginBottom: '18px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                Notification Preferences
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifyOnProvision}
                    onChange={(e) => setNotifyOnProvision(e.target.checked)}
                  />
                  <span>Dispatch email summary upon bulk provisioning completion</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifyOnQuota}
                    onChange={(e) => setNotifyOnQuota(e.target.checked)}
                  />
                  <span>Receive early warning when quota utilization crosses 80%</span>
                </label>
              </div>
            </div>

            {canEditSettings && (
              <button
                type="submit"
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Save Permitted Settings
              </button>
            )}
          </form>
        </div>

        {/* Company-Controlled Parameters (Locked / Read-Only) */}
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '14px', padding: '24px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Lock size={18} color="#64748B" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
              Company-Governed Parameters (Read-Only)
            </h3>
          </div>

          <p style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px' }}>
            To safeguard institutional agreements and multi-tenant integrity, the following properties are governed exclusively by BEXO Central Authority. Use the Requests Desk to propose modifications.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Institutional Identifier (ID)</div>
              <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '2px', fontFamily: 'monospace' }}>
                {college?.id}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Institutional Code</div>
              <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                {college?.code}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Approved Student Quota Capacity</div>
              <div style={{ fontWeight: 800, color: '#2563EB', marginTop: '2px' }}>
                {(college?.quota?.allocated || 0).toLocaleString()} Student Licenses
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Account & Operational Status</div>
              <div style={{ fontWeight: 800, color: college?.status === 'Active' ? '#16A34A' : '#DC2626', marginTop: '2px' }}>
                {college?.status.toUpperCase()}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Service Level Tier</div>
              <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                {college?.agreement?.type || 'Tier-1 Institutional Enterprise'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
