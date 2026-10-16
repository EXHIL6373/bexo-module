import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useRouter } from '../../router/Router';
import {
  Building2,
  Phone,
  UserCheck,
  FileText,
  Layers,
  BarChart,
  Lock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  UploadCloud,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { CollegeStatus } from '../../types';

interface CollegeOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CollegeOnboardingWizard: React.FC<CollegeOnboardingWizardProps> = ({ isOpen, onClose }) => {
  const { addCollege, services: platformServices } = useAdmin();
  const { navigate } = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [createdCollegeId, setCreatedCollegeId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic
    name: '',
    code: '',
    slug: '',
    type: 'Autonomous University' as const,
    affiliation: 'Anna University',
    establishedYear: 2000,
    address: '',
    city: '',
    district: '',
    state: 'Tamil Nadu',
    pincode: '',
    country: 'India',

    // Step 2: Contact
    primaryContactName: '',
    primaryDesignation: 'Principal',
    primaryEmail: '',
    primaryMobile: '',
    alternateContact: '',

    // Step 3: Admin
    adminName: '',
    adminEmail: '',
    adminMobile: '',

    // Step 4: Agreement
    agreementNumber: `BEXO-MOU-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    agreementType: 'Annual MOU' as const,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    agreementStatus: 'Active' as const,
    documentName: 'Signed_Institutional_MOU.pdf',

    // Step 5: Services
    selectedServiceIds: ['srv-1', 'srv-2', 'srv-3'],

    // Step 6: Quota
    quotaAllocated: 3000,
    warningThreshold: 80,
    criticalThreshold: 95,

    // Step 7: Access
    status: 'Active' as CollegeStatus,
    dashboardAccess: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateStep = (step: number) => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!formData.name.trim()) errs.name = 'College Name is required.';
      if (!formData.code.trim()) errs.code = 'College Code is required.';
      if (!formData.city.trim()) errs.city = 'City is required.';
    } else if (step === 2) {
      if (!formData.primaryContactName.trim()) errs.primaryContactName = 'Primary contact name is required.';
      if (!formData.primaryEmail.trim() || !formData.primaryEmail.includes('@')) errs.primaryEmail = 'Valid contact email is required.';
      if (!formData.primaryMobile.trim()) errs.primaryMobile = 'Mobile number is required.';
    } else if (step === 3) {
      if (!formData.adminName.trim()) errs.adminName = 'College Administrator name is required.';
      if (!formData.adminEmail.trim() || !formData.adminEmail.includes('@')) errs.adminEmail = 'Valid administrator email is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(8, prev + 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinalSubmit = () => {
    const newId = addCollege({
      name: formData.name,
      code: formData.code.toUpperCase(),
      slug: (formData.slug || formData.code).toLowerCase(),
      type: formData.type,
      affiliation: formData.affiliation,
      establishedYear: Number(formData.establishedYear),
      address: formData.address || `${formData.city}, ${formData.state}`,
      city: formData.city,
      district: formData.district || formData.city,
      state: formData.state,
      pincode: formData.pincode || '641001',
      country: formData.country,
      primaryContact: {
        name: formData.primaryContactName,
        designation: formData.primaryDesignation,
        email: formData.primaryEmail,
        mobile: formData.primaryMobile,
        alternateContact: formData.alternateContact,
      },
      adminContact: {
        name: formData.adminName,
        email: formData.adminEmail,
        mobile: formData.adminMobile,
      },
      coordinators: [],
      status: formData.status,
      dashboardAccess: formData.dashboardAccess,
      totalStudents: 0,
      activeStudents: 0,
      quota: {
        allocated: Number(formData.quotaAllocated),
        used: 0,
        warningThreshold: Number(formData.warningThreshold),
        criticalThreshold: Number(formData.criticalThreshold),
      },
      services: platformServices.map((ps) => ({
        serviceId: ps.id,
        name: ps.name,
        isEnabled: formData.selectedServiceIds.includes(ps.id),
        activatedAt: new Date().toISOString().split('T')[0],
        studentsUsing: 0,
        planLevel: 'Enterprise',
      })),
      agreement: {
        agreementNumber: formData.agreementNumber,
        type: formData.agreementType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.agreementStatus,
        documentName: formData.documentName,
      },
    });

    setCreatedCollegeId(newId);
  };

  const stepsList = [
    { num: 1, title: 'Basic Info', icon: Building2 },
    { num: 2, title: 'Contact', icon: Phone },
    { num: 3, title: 'Admin', icon: UserCheck },
    { num: 4, title: 'MOU', icon: FileText },
    { num: 5, title: 'Services', icon: Layers },
    { num: 6, title: 'Quota', icon: BarChart },
    { num: 7, title: 'Access', icon: Lock },
    { num: 8, title: 'Review', icon: CheckCircle2 },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog lg"
        style={{ maxWidth: '880px', maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Building2 size={22} color="var(--bexo-blue-600)" />
            <span>Institutional Onboarding Wizard</span>
          </div>
          <button onClick={onClose} style={{ color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        {/* Wizard Step Progression Bar */}
        {!createdCollegeId && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 24px',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderBottom: '1px solid var(--border-light)',
              overflowX: 'auto',
            }}
          >
            {stepsList.map((s, idx) => {
              const isPast = currentStep > s.num;
              const isCurr = currentStep === s.num;
              const Icon = s.icon;

              return (
                <div
                  key={s.num}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: isCurr ? 1 : isPast ? 0.8 : 0.45,
                    cursor: isPast ? 'pointer' : 'default',
                  }}
                  onClick={() => isPast && setCurrentStep(s.num)}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: isCurr ? 'var(--bexo-blue-600)' : isPast ? 'var(--color-success)' : '#CBD5E1',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {isPast ? <CheckCircle2 size={14} /> : s.num}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: isCurr ? 700 : 500, color: isCurr ? 'var(--bexo-blue-600)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {s.title}
                  </span>
                  {idx < stepsList.length - 1 && (
                    <div style={{ width: '16px', height: '1px', backgroundColor: '#CBD5E1', margin: '0 4px' }} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Wizard Body */}
        <div className="modal-body">
          {createdCollegeId ? (
            /* Success confirmation screen */
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#ECFDF5',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Sparkles size={32} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {formData.name} Successfully Onboarded!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', maxWidth: '480px', margin: '0 auto 24px' }}>
                The college is now registered in BEXO with {formData.quotaAllocated.toLocaleString()} allocated seats.
                Administrator invitation will be dispatched to <strong>{formData.adminEmail}</strong>.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    navigate(`/admin/colleges/${createdCollegeId}`);
                  }}
                >
                  <Building2 size={16} /> Open College 360° Profile
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    onClose();
                    navigate(`/admin/students`);
                  }}
                >
                  Manage Students
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: Basic Information */}
              {currentStep === 1 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    Step 1: Institutional Information
                  </h3>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="wizard-college-name-input" className="form-label">College Name *</label>
                      <input
                        id="wizard-college-name-input"
                        name="collegeName"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Sri Krishna College of Technology"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                      {errors.name && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{errors.name}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="wizard-college-code-input" className="form-label">College Code *</label>
                      <input
                        id="wizard-college-code-input"
                        name="collegeCode"
                        type="text"
                        className="form-input"
                        placeholder="e.g. SKCT"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      />
                      {errors.code && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{errors.code}</span>}
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="wizard-college-type-select" className="form-label">Institution Type</label>
                      <select
                        id="wizard-college-type-select"
                        name="institutionType"
                        className="form-select"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      >
                        <option value="Autonomous University">Autonomous University</option>
                        <option value="Engineering">Engineering College</option>
                        <option value="Arts & Science">Arts & Science</option>
                        <option value="Polytechnic">Polytechnic</option>
                        <option value="Medical">Medical / Healthcare</option>
                        <option value="Management">Management Institute</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="wizard-college-affiliation-input" className="form-label">Affiliation / Board</label>
                      <input
                        id="wizard-college-affiliation-input"
                        name="affiliationBoard"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Anna University"
                        value={formData.affiliation}
                        onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="wizard-college-city-input" className="form-label">City *</label>
                      <input
                        id="wizard-college-city-input"
                        name="city"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Coimbatore"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                      {errors.city && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{errors.city}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="wizard-college-state-input" className="form-label">State</label>
                      <input
                        id="wizard-college-state-input"
                        name="state"
                        type="text"
                        className="form-input"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="wizard-college-address-input" className="form-label">Campus Address</label>
                    <input
                      id="wizard-college-address-input"
                      name="address"
                      type="text"
                      className="form-input"
                      placeholder="Street address, campus locality"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Contact Information */}
              {currentStep === 2 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    Step 2: Primary Institutional Contact
                  </h3>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="wizard-contact-name-input" className="form-label">Primary Contact Name *</label>
                      <input
                        id="wizard-contact-name-input"
                        name="primaryContactName"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Dr. K. Prakasan"
                        value={formData.primaryContactName}
                        onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })}
                      />
                      {errors.primaryContactName && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{errors.primaryContactName}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="wizard-contact-designation-input" className="form-label">Designation</label>
                      <input
                        id="wizard-contact-designation-input"
                        name="primaryDesignation"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Principal / Director"
                        value={formData.primaryDesignation}
                        onChange={(e) => setFormData({ ...formData, primaryDesignation: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="wizard-contact-email-input" className="form-label">Official Email *</label>
                      <input
                        id="wizard-contact-email-input"
                        name="primaryEmail"
                        type="email"
                        className="form-input"
                        placeholder="principal@college.edu"
                        value={formData.primaryEmail}
                        onChange={(e) => setFormData({ ...formData, primaryEmail: e.target.value })}
                      />
                      {errors.primaryEmail && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{errors.primaryEmail}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="wizard-contact-mobile-input" className="form-label">Mobile Contact *</label>
                      <input
                        id="wizard-contact-mobile-input"
                        name="primaryMobile"
                        type="tel"
                        className="form-input"
                        placeholder="+91 98422 00000"
                        value={formData.primaryMobile}
                        onChange={(e) => setFormData({ ...formData, primaryMobile: e.target.value })}
                      />
                      {errors.primaryMobile && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{errors.primaryMobile}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: College Administration */}
              {currentStep === 3 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    Step 3: Portal College Administrator
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    This designated staff member will receive initial College Admin access to provision students and view college analytics.
                  </p>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="wizard-admin-name-input" className="form-label">College Admin Name *</label>
                      <input
                        id="wizard-admin-name-input"
                        name="adminName"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Prof. R. Venkatesh"
                        value={formData.adminName}
                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      />
                      {errors.adminName && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{errors.adminName}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="wizard-admin-email-input" className="form-label">Admin Email *</label>
                      <input
                        id="wizard-admin-email-input"
                        name="adminEmail"
                        type="email"
                        className="form-input"
                        placeholder="admin@college.edu"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      />
                      {errors.adminEmail && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{errors.adminEmail}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="wizard-admin-mobile-input" className="form-label">Admin Mobile Phone</label>
                    <input
                      id="wizard-admin-mobile-input"
                      name="adminMobile"
                      type="tel"
                      className="form-input"
                      placeholder="+91 94433 11223"
                      value={formData.adminMobile}
                      onChange={(e) => setFormData({ ...formData, adminMobile: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: Agreement / MOU */}
              {currentStep === 4 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    Step 4: MOU & Legal Agreement
                  </h3>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="wizard-agreement-number-input" className="form-label">MOU Reference Number</label>
                      <input
                        id="wizard-agreement-number-input"
                        name="agreementNumber"
                        type="text"
                        className="form-input"
                        value={formData.agreementNumber}
                        onChange={(e) => setFormData({ ...formData, agreementNumber: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="wizard-agreement-type-select" className="form-label">Contract Type</label>
                      <select
                        id="wizard-agreement-type-select"
                        name="agreementType"
                        className="form-select"
                        value={formData.agreementType}
                        onChange={(e) => setFormData({ ...formData, agreementType: e.target.value as any })}
                      >
                        <option value="Annual MOU">Annual MOU (1 Year)</option>
                        <option value="Multi-Year Enterprise">Multi-Year Enterprise (2-3 Years)</option>
                        <option value="Pilot Contract">Pilot Contract (6 Months)</option>
                        <option value="Trial Agreement">Trial Agreement (90 Days)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="wizard-agreement-startdate-input" className="form-label">Start Date</label>
                      <input
                        id="wizard-agreement-startdate-input"
                        name="startDate"
                        type="date"
                        className="form-input"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="wizard-agreement-enddate-input" className="form-label">End Date</label>
                      <input
                        id="wizard-agreement-enddate-input"
                        name="endDate"
                        type="date"
                        className="form-input"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      border: '2px dashed var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '24px',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    <UploadCloud size={30} color="var(--bexo-blue-600)" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>Upload Signed MOU Document (PDF)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Attached: {formData.documentName}</div>
                  </div>
                </div>
              )}

              {/* STEP 5: Services */}
              {currentStep === 5 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Step 5: Assign Platform Services
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Select services authorized under the commercial agreement. College staff cannot independently activate services.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {platformServices.map((srv) => {
                      const isSelected = formData.selectedServiceIds.includes(srv.id);
                      return (
                        <div
                          key={srv.id}
                          onClick={() => {
                            const next = isSelected
                              ? formData.selectedServiceIds.filter((id) => id !== srv.id)
                              : [...formData.selectedServiceIds, srv.id];
                            setFormData({ ...formData, selectedServiceIds: next });
                          }}
                          style={{
                            padding: '14px 18px',
                            borderRadius: 'var(--radius-md)',
                            border: `1.5px solid ${isSelected ? 'var(--bexo-blue-600)' : 'var(--border-light)'}`,
                            backgroundColor: isSelected ? 'var(--bexo-blue-50)' : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 150ms',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                              {srv.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {srv.description}
                            </div>
                          </div>
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '4px',
                              border: `1.5px solid ${isSelected ? 'var(--bexo-blue-600)' : '#CBD5E1'}`,
                              backgroundColor: isSelected ? 'var(--bexo-blue-600)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                            }}
                          >
                            {isSelected && <CheckCircle2 size={14} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 6: Quota */}
              {currentStep === 6 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    Step 6: Student Quota Capacity
                  </h3>

                  <div className="form-group">
                    <label htmlFor="wizard-quota-allocated-input" className="form-label">Total Allocated Student Quota (Seats) *</label>
                    <input
                      id="wizard-quota-allocated-input"
                      name="quotaAllocated"
                      type="number"
                      step="100"
                      className="form-input"
                      value={formData.quotaAllocated}
                      onChange={(e) => setFormData({ ...formData, quotaAllocated: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="wizard-warning-threshold-input" className="form-label">Warning Threshold (%)</label>
                      <input
                        id="wizard-warning-threshold-input"
                        name="warningThreshold"
                        type="number"
                        className="form-input"
                        value={formData.warningThreshold}
                        onChange={(e) => setFormData({ ...formData, warningThreshold: Number(e.target.value) })}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Alerts operations at this usage level (default 80%)</span>
                    </div>

                    <div className="form-group">
                      <label htmlFor="wizard-critical-threshold-input" className="form-label">Critical Threshold (%)</label>
                      <input
                        id="wizard-critical-threshold-input"
                        name="criticalThreshold"
                        type="number"
                        className="form-input"
                        value={formData.criticalThreshold}
                        onChange={(e) => setFormData({ ...formData, criticalThreshold: Number(e.target.value) })}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Flags provisioning stop warning (default 95%)</span>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      borderRadius: 'var(--radius-md)',
                      marginTop: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                      <span>Allocated: {formData.quotaAllocated.toLocaleString()}</span>
                      <span>Used: 0</span>
                      <span style={{ color: 'var(--color-success)' }}>Remaining: {formData.quotaAllocated.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: Access */}
              {currentStep === 7 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    Step 7: Lifecycle State & Dashboard Access
                  </h3>

                  <div className="form-group">
                    <label htmlFor="wizard-status-select" className="form-label">Initial College Status</label>
                    <select
                      id="wizard-status-select"
                      name="initialStatus"
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <option value="Active">Active (Immediately Operational)</option>
                      <option value="Pending">Pending (Draft / Legal Clearance)</option>
                      <option value="Suspended">Suspended (Restricted Access)</option>
                    </select>
                  </div>

                  <div
                    style={{
                      padding: '16px',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '16px',
                    }}
                  >
                    <label htmlFor="wizard-dashboard-access-checkbox" style={{ cursor: 'pointer' }}>
                      <div style={{ fontWeight: 700, fontSize: '13.5px' }}>Enable College Dashboard Access</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Allows college staff to log in and submit student roll ranges.
                      </div>
                    </label>
                    <input
                      id="wizard-dashboard-access-checkbox"
                      name="dashboardAccess"
                      type="checkbox"
                      checked={formData.dashboardAccess}
                      onChange={(e) => setFormData({ ...formData, dashboardAccess: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 8: Review & Approve */}
              {currentStep === 8 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    Step 8: Final Onboarding Review
                  </h3>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '14px',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      padding: '18px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                    }}
                  >
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Institution</div>
                      <div style={{ fontWeight: 700 }}>{formData.name} ({formData.code})</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{formData.city}, {formData.state}</div>
                    </div>

                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Primary Admin</div>
                      <div style={{ fontWeight: 700 }}>{formData.adminName}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{formData.adminEmail}</div>
                    </div>

                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Agreement</div>
                      <div style={{ fontWeight: 700 }}>{formData.agreementNumber}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{formData.agreementType} ({formData.startDate} to {formData.endDate})</div>
                    </div>

                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Quota & Access</div>
                      <div style={{ fontWeight: 700 }}>{formData.quotaAllocated.toLocaleString()} Seats</div>
                      <div style={{ color: 'var(--text-secondary)' }}>Status: {formData.status} • Portal: {formData.dashboardAccess ? 'Enabled' : 'Disabled'}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      ASSIGNED SERVICES ({formData.selectedServiceIds.length})
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {formData.selectedServiceIds.map((id) => {
                        const s = platformServices.find((p) => p.id === id);
                        return (
                          <span key={id} className="status-badge service">
                            {s?.name || id}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        {!createdCollegeId && (
          <div className="modal-footer">
            <button
              className="btn btn-secondary btn-sm"
              onClick={currentStep === 1 ? onClose : handlePrev}
            >
              {currentStep === 1 ? 'Cancel' : <><ArrowLeft size={14} /> Back</>}
            </button>

            {currentStep < 8 ? (
              <button className="btn btn-primary btn-sm" onClick={handleNext}>
                <span>Next</span> <ArrowRight size={14} />
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={handleFinalSubmit}>
                <ShieldCheck size={15} /> Approve & Create College
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
