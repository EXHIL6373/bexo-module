import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  HelpCircle,
  Mail,
  Phone,
  Clock,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  LifeBuoy,
  MessageSquare,
} from 'lucide-react';

export const CollegeSupportPage: React.FC = () => {
  const { currentUser, colleges, currentCollege, isCorporateAdmin, submitRequest, addToast } = useAdmin();

  const college = currentCollege || colleges.find(
    (c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName
  ) || (isCorporateAdmin ? colleges[0] : undefined);

  const collegeId = college?.id || currentUser.collegeId || '';

  // Ticket form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical Issue');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I request an increase in student quota?',
      a: 'Navigate to "Requests" from the sidebar and select "Quota Increase". Enter your requested count and justification. Your request will be reviewed and approved by BEXO Central Administration, after which your college quota will automatically update.',
    },
    {
      q: 'What formats are supported for bulk student onboarding?',
      a: 'We support standard comma-separated values (.CSV) and tab-delimited files (.TSV). Download the official template from the "Bulk Import" page to ensure all required fields (Full Name, Roll Number, Email) match our institutional schema.',
    },
    {
      q: 'What happens when our institutional MOU or agreement is approaching expiry?',
      a: 'When an agreement is within 30 days of expiry, a reminder appears on your Dashboard and Agreement module. You can submit a direct Renewal Request from the "MOU / Agreement" page with updated terms or commercial authorization.',
    },
    {
      q: 'Who has permission to manage and invite college staff?',
      a: 'Only authorized College Administrators (College Admin) have privileges to invite new staff members, resend invitations, or modify roles. College Coordinators and College Staff have operational and viewing access only.',
    },
    {
      q: 'Are student portfolios and ATS resumes preserved if a college account is suspended?',
      a: 'Yes. In the event of an institutional suspension, all existing student records, published web links, ATS resumes, and audit history remain permanently preserved and intact. Only new student provisioning is held.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    submitRequest({
      type: 'Other Operational Request' as any,
      collegeId,
      collegeName: college?.name || 'Assigned College',
      requester: currentUser.name,
      requesterEmail: currentUser.email,
      requesterRole: currentUser.role,
      details: {
        title: `[Support Ticket] ${subject.trim()}`,
        description: `Category: ${category}\nPriority: ${priority}\n\n${description.trim()}`,
      },
      priority,
    });

    setSubmitted(true);
    addToast('success', 'Support Ticket Dispatched', 'Your inquiry has been assigned ticket ID and routed to BEXO Engineering.');
    setSubject('');
    setDescription('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
          Help & Support Center
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
          Get assistance from BEXO Institutional Solutions, browse documentation, or submit a priority ticket
        </p>
      </div>

      {/* Support Channels Banner */}
      <div className="cards-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={20} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Institutional Helpdesk</div>
            <div style={{ fontSize: '13px', color: '#2563EB', fontWeight: 600, marginTop: '2px' }}>colleges@atbexo.com</div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>Dedicated priority queue for college admins</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Phone size={20} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Direct Partner Hotline</div>
            <div style={{ fontSize: '13px', color: '#16A34A', fontWeight: 600, marginTop: '2px' }}>+91 422 498 7700</div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>Mon - Sat • 09:00 AM - 07:00 PM IST</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Institutional SLA</div>
            <div style={{ fontSize: '13px', color: '#D97706', fontWeight: 600, marginTop: '2px' }}>2-Hour Response Window</div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>Guaranteed turnaround for portal escalations</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Submit Ticket & FAQs */}
      <div className="cards-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Ticket Form */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
            Submit a Priority Support Ticket
          </h3>

          {submitted && (
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '12px 16px', color: '#166534', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>Your support request was logged and routed to BEXO Operations.</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Issue Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                >
                  <option value="Technical Issue">Technical Issue (Login / Subdomain / Tools)</option>
                  <option value="Provisioning Discrepancy">Student Provisioning Discrepancy</option>
                  <option value="Quota & Licensing">Quota & Licensing Adjustment</option>
                  <option value="MOU / Renewal Inquiry">MOU / Renewal Inquiry</option>
                  <option value="Feature Request">Platform Feature Request</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Severity Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                >
                  <option value="Low">Low — General inquiry</option>
                  <option value="Medium">Medium — Standard operational question</option>
                  <option value="High">High — Bulk student onboarding blocked</option>
                  <option value="Critical">Critical — System inaccessible during campus drive</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. 2026 Batch Roll Range 24CS050 - 24CS090 Access Issue"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide complete details including batch year, department, error messages, or affected student roll numbers..."
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Send size={14} />
                <span>Submit Priority Ticket</span>
              </button>
            </div>
          </form>
        </div>

        {/* FAQ Accordion */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
            Frequently Asked Questions
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: isOpen ? '#F8FAFC' : '#FFFFFF',
                      border: 'none',
                      textAlign: 'left',
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#0F172A',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isOpen && (
                    <div style={{ padding: '12px 16px', fontSize: '12.5px', color: '#64748B', lineHeight: 1.6, backgroundColor: '#FFFFFF' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
