import React, { useState, useRef } from 'react';
import { useRouter } from '../../router/Router';
import { useAdmin } from '../../context/AdminContext';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Eye,
  ShieldAlert,
  ArrowLeft,
  Users,
  FileCheck2,
} from 'lucide-react';

interface ParsedStudentRow {
  rowNum: number;
  name: string;
  rollNumber: string;
  email: string;
  department: string;
  course: string;
  batch: string;
  phone: string;
  status: 'valid' | 'invalid' | 'duplicate_file' | 'duplicate_db';
  issues: string[];
}

export const CollegeStudentImportPage: React.FC = () => {
  const { navigate } = useRouter();
  const {
    currentUser,
    colleges,
    students,
    bulkImportStudents,
    addToast,
    currentCollege,
    isCorporateAdmin,
  } = useAdmin();

  const college = currentCollege || colleges.find(
    (c) => c.id === currentUser.collegeId || c.name === currentUser.collegeName
  ) || (isCorporateAdmin ? colleges[0] : undefined);

  const collegeId = college?.id || currentUser.collegeId || '';
  const isSuspended = college?.status === 'Suspended' || currentUser.accountStatus === 'SUSPENDED';

  const quotaRemaining = college ? Math.max(0, college.quota.allocated - college.quota.used) : 0;

  // Wizard state: 1 = Upload, 2 = Validate & Preview, 3 = Results
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [filterView, setFilterView] = useState<'all' | 'valid' | 'issues'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    skippedCount: number;
    errors: Array<{ rollNumber: string; reason: string }>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Existing roll numbers for this college
  const existingRolls = new Set(
    students.filter((s) => s.collegeId === collegeId).map((s) => s.rollNumber.toLowerCase())
  );

  // Generate and download sample CSV template
  const handleDownloadTemplate = () => {
    const csvContent =
      'Full Name,Roll Number,Email,Department,Course,Batch,Phone\n' +
      'Vikram Anand,24CS101,vikram.24cs101@psgtech.edu,Computer Science,B.Tech,2024 - 2028,+91 98401 23456\n' +
      'Ananya Sundaram,24IT102,ananya.24it102@psgtech.edu,Information Technology,B.Tech,2024 - 2028,+91 98402 34567\n' +
      'Manojkumar P.,24EC103,manoj.24ec103@psgtech.edu,Electronics & Comm,B.E,2024 - 2028,+91 98403 45678\n' +
      'Sneha Radhakrishnan,24ME104,sneha.24me104@psgtech.edu,Mechanical Engineering,B.E,2024 - 2028,+91 98404 56789\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bexo_student_import_template_${college?.code || 'INST'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('info', 'Template Downloaded', 'Use this format to prepare your student records.');
  };

  // CSV parser and validator
  const parseCSVText = (text: string, filename: string) => {
    const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      addToast('error', 'Empty or Invalid File', 'The file contains no data rows.');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    const rows = lines.slice(1);

    const nameIdx = headers.findIndex((h) => h.includes('name'));
    const rollIdx = headers.findIndex((h) => h.includes('roll') || h.includes('enroll') || h.includes('reg'));
    const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
    const deptIdx = headers.findIndex((h) => h.includes('dept') || h.includes('department'));
    const courseIdx = headers.findIndex((h) => h.includes('course') || h.includes('degree') || h.includes('program'));
    const batchIdx = headers.findIndex((h) => h.includes('batch') || h.includes('year'));
    const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile'));

    const parsed: ParsedStudentRow[] = [];
    const seenRollsInFile = new Set<string>();

    rows.forEach((line, index) => {
      // Split preserving simple commas
      const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length === 0 || cols.every((c) => c === '')) return;

      const name = nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx] : cols[0] || '';
      const roll = rollIdx !== -1 && cols[rollIdx] ? cols[rollIdx].toUpperCase() : cols[1] ? cols[1].toUpperCase() : '';
      const email = emailIdx !== -1 && cols[emailIdx] ? cols[emailIdx].toLowerCase() : cols[2] ? cols[2].toLowerCase() : '';
      const department = deptIdx !== -1 && cols[deptIdx] ? cols[deptIdx] : cols[3] || 'General Engineering';
      const course = courseIdx !== -1 && cols[courseIdx] ? cols[courseIdx] : 'B.Tech';
      const batch = batchIdx !== -1 && cols[batchIdx] ? cols[batchIdx] : '2024 - 2028';
      const phone = phoneIdx !== -1 && cols[phoneIdx] ? cols[phoneIdx] : '';

      const issues: string[] = [];
      let status: ParsedStudentRow['status'] = 'valid';

      if (!name) issues.push('Missing Student Full Name');
      if (!roll) issues.push('Missing Roll Number');
      if (!email) {
        issues.push('Missing Student Email');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        issues.push('Invalid email format');
      }

      if (roll) {
        if (seenRollsInFile.has(roll.toLowerCase())) {
          issues.push(`Duplicate roll number within this file`);
          status = 'duplicate_file';
        } else {
          seenRollsInFile.add(roll.toLowerCase());
        }

        if (existingRolls.has(roll.toLowerCase())) {
          issues.push(`Already registered in ${college?.name || 'this college'}`);
          status = 'duplicate_db';
        }
      }

      if (issues.length > 0 && status === 'valid') {
        status = 'invalid';
      }

      parsed.push({
        rowNum: index + 2, // 1-indexed, line 1 is header
        name,
        rollNumber: roll,
        email,
        department,
        course,
        batch,
        phone,
        status,
        issues,
      });
    });

    setFileName(filename);
    setParsedRows(parsed);
    setStep(2);
    addToast('success', 'File Parsed', `Analyzed ${parsed.length} student records from ${filename}.`);
  };

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(csv|txt|tsv|xlsx)$/i)) {
      addToast('error', 'Unsupported File', 'Please upload a CSV or XLSX file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSVText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Metrics
  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const duplicateFileCount = parsedRows.filter((r) => r.status === 'duplicate_file').length;
  const duplicateDbCount = parsedRows.filter((r) => r.status === 'duplicate_db').length;
  const invalidCount = parsedRows.filter((r) => r.status === 'invalid').length;
  const totalDuplicates = duplicateFileCount + duplicateDbCount;

  const filteredDisplayRows = parsedRows.filter((r) => {
    if (filterView === 'valid') return r.status === 'valid';
    if (filterView === 'issues') return r.status !== 'valid';
    return true;
  });

  // Confirm import execution
  const handleConfirmImport = async () => {
    if (isSuspended) {
      addToast('error', 'Operation Blocked', 'Institutional account is currently suspended.');
      return;
    }

    if (validCount === 0) {
      addToast('warning', 'No Valid Records', 'No valid rows available to import.');
      return;
    }

    setIsProcessing(true);
    try {
      const validPayload = parsedRows
        .filter((r) => r.status === 'valid')
        .map((r) => ({
          name: r.name,
          rollNumber: r.rollNumber,
          email: r.email,
          department: r.department,
          course: r.course,
          batch: r.batch,
          phone: r.phone,
        }));

      const res = await bulkImportStudents(collegeId, validPayload);
      setImportResult(res);
      setStep(3);
    } catch (err: any) {
      addToast('error', 'Import Failed', err.message || 'An unexpected error occurred during import.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download error report
  const handleDownloadErrorReport = () => {
    const errorRows = parsedRows.filter((r) => r.status !== 'valid');
    if (errorRows.length === 0) {
      addToast('info', 'No Errors', 'All records in this batch were valid.');
      return;
    }

    let csv = 'Row Number,Student Name,Roll Number,Email,Department,Error Reasons\n';
    errorRows.forEach((r) => {
      csv += `"${r.rowNum}","${r.name}","${r.rollNumber}","${r.email}","${r.department}","${r.issues.join('; ')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bexo_import_errors_${college?.code || 'INST'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('success', 'Error Report Downloaded', 'File saved to your downloads.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-actions-bar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate('/college/students')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#64748B',
                padding: '4px',
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
              Bulk Student Import
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
              CSV & XLSX
            </span>
          </div>
          <p style={{ margin: '4px 0 0 28px', fontSize: '13px', color: '#64748B' }}>
            Upload, validate, and enroll batches of students for {college?.name || 'Assigned College'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDownloadTemplate}
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
            <Download size={15} />
            <span>Download CSV Template</span>
          </button>
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
            <strong>Institutional Account Suspended:</strong> New student imports and additions are blocked by BEXO Central Administration.
          </div>
        </div>
      )}

      {/* Step Indicators */}
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
            Upload File
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
            Validate & Preview
          </span>
        </div>

        <div style={{ width: '40px', height: '1px', backgroundColor: '#CBD5E1' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: step === 3 ? '#16A34A' : '#E2E8F0',
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
            Import Results
          </span>
        </div>
      </div>

      {/* STEP 1: Upload */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? '#2563EB' : '#CBD5E1'}`,
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center',
              backgroundColor: dragActive ? '#EFF6FF' : '#FFFFFF',
              cursor: isSuspended ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={() => !isSuspended && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
              accept=".csv,.txt,.tsv"
              style={{ display: 'none' }}
              disabled={isSuspended}
            />

            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <UploadCloud size={32} />
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
              Drag & Drop your student file here
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B' }}>
              Supports .CSV, .TSV, or text files up to 10MB
            </p>

            <button
              type="button"
              disabled={isSuspended}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                backgroundColor: isSuspended ? '#94A3B8' : '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isSuspended ? 'not-allowed' : 'pointer',
              }}
            >
              Select File from Computer
            </button>
          </div>

          {/* Quick instructions & format card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '20px 24px',
            }}
          >
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
              Import Requirements & Column Headers
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#2563EB', marginBottom: '4px' }}>Full Name *</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Student legal name for digital portfolio & resume.</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#2563EB', marginBottom: '4px' }}>Roll Number *</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Unique student ID / register enrollment number.</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#2563EB', marginBottom: '4px' }}>Email *</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Institute or personal email for activation link.</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Department / Batch</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Academic stream (e.g. Computer Science, 2024-2028).</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Validate & Preview */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Summary KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Total Parsed</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>{parsedRows.length}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>File: {fileName}</div>
            </div>

            <div style={{ backgroundColor: '#F0FDF4', padding: '16px', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#166534' }}>Valid for Import</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#15803D', marginTop: '4px' }}>{validCount}</div>
              <div style={{ fontSize: '11px', color: '#166534' }}>Ready to enroll</div>
            </div>

            <div style={{ backgroundColor: '#FEF2F2', padding: '16px', borderRadius: '10px', border: '1px solid #FECDD3' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#991B1B' }}>Invalid / Format Error</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#DC2626', marginTop: '4px' }}>{invalidCount}</div>
              <div style={{ fontSize: '11px', color: '#991B1B' }}>Missing fields or bad email</div>
            </div>

            <div style={{ backgroundColor: '#FFFBEB', padding: '16px', borderRadius: '10px', border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400E' }}>Duplicates Detected</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#D97706', marginTop: '4px' }}>{totalDuplicates}</div>
              <div style={{ fontSize: '11px', color: '#92400E' }}>{duplicateDbCount} in DB • {duplicateFileCount} in file</div>
            </div>
          </div>

          {/* Table Toolbar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '12px 18px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setFilterView('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: filterView === 'all' ? '1px solid #2563EB' : '1px solid #E2E8F0',
                  backgroundColor: filterView === 'all' ? '#EFF6FF' : '#FFFFFF',
                  color: filterView === 'all' ? '#2563EB' : '#475569',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                All Rows ({parsedRows.length})
              </button>
              <button
                onClick={() => setFilterView('valid')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: filterView === 'valid' ? '1px solid #16A34A' : '1px solid #E2E8F0',
                  backgroundColor: filterView === 'valid' ? '#F0FDF4' : '#FFFFFF',
                  color: filterView === 'valid' ? '#15803D' : '#475569',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Valid Only ({validCount})
              </button>
              <button
                onClick={() => setFilterView('issues')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: filterView === 'issues' ? '1px solid #DC2626' : '1px solid #E2E8F0',
                  backgroundColor: filterView === 'issues' ? '#FEF2F2' : '#FFFFFF',
                  color: filterView === 'issues' ? '#DC2626' : '#475569',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Errors / Duplicates ({invalidCount + totalDuplicates})
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDownloadErrorReport}
                disabled={invalidCount + totalDuplicates === 0}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: invalidCount + totalDuplicates === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Download size={13} />
                <span>Download Error Report</span>
              </button>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={13} />
                <span>Upload Another File</span>
              </button>
            </div>
          </div>

          {/* Preview Table */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
            }}
          >
            <div className="table-responsive-container" style={{ overflowX: 'auto', maxHeight: '420px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                <thead style={{ backgroundColor: '#F8FAFC', position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                    <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, width: '60px' }}>Row</th>
                    <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, width: '160px' }}>Status</th>
                    <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, width: '130px' }}>Roll Number</th>
                    <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, width: '180px' }}>Student Name</th>
                    <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, width: '220px' }}>Email Address</th>
                    <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, width: '160px' }}>Department</th>
                    <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, minWidth: '220px' }}>Issues / Reasons</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDisplayRows.map((row) => (
                    <tr
                      key={row.rowNum}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor:
                          row.status === 'valid'
                            ? '#FFFFFF'
                            : row.status === 'duplicate_db' || row.status === 'duplicate_file'
                            ? '#FFFBEB'
                            : '#FEF2F2',
                      }}
                    >
                      <td style={{ padding: '10px 14px', color: '#64748B', fontWeight: 600 }}>#{row.rowNum}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {row.status === 'valid' ? (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#15803D',
                              backgroundColor: '#DCFCE7',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <CheckCircle2 size={11} /> Valid
                          </span>
                        ) : row.status === 'duplicate_db' ? (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#B45309',
                              backgroundColor: '#FEF3C7',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <AlertTriangle size={11} /> Duplicate in College
                          </span>
                        ) : row.status === 'duplicate_file' ? (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#B45309',
                              backgroundColor: '#FEF3C7',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <AlertTriangle size={11} /> Duplicate in File
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#B91C1C',
                              backgroundColor: '#FEE2E2',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <XCircle size={11} /> Invalid
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>
                        {row.rollNumber || <span style={{ color: '#DC2626' }}>[Missing]</span>}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>
                        {row.name || <span style={{ color: '#DC2626' }}>[Missing]</span>}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>
                        {row.email || <span style={{ color: '#DC2626' }}>[Missing]</span>}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{row.department}</td>
                      <td style={{ padding: '10px 14px', color: row.issues.length ? '#B91C1C' : '#15803D' }}>
                        {row.issues.length ? row.issues.join(', ') : 'None — Verified'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confirm Action Bar */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '20px 24px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                Ready to Enroll {validCount} Verified Students
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                Records will be permanently enrolled into {college?.name || 'this college'}. Duplicate or invalid rows will be skipped safely.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={validCount === 0 || isProcessing || isSuspended}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  backgroundColor: validCount === 0 || isSuspended ? '#94A3B8' : '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: validCount === 0 || isSuspended ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Processing Import...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Confirm & Import {validCount} Students</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Results */}
      {step === 3 && importResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '36px',
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
              Student Import Successfully Completed!
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '13.5px', color: '#64748B' }}>
              {importResult.importedCount} new student records have been enrolled into {college?.name || 'your college'}.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                marginBottom: '32px',
              }}
            >
              <div style={{ padding: '14px 24px', backgroundColor: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#166534' }}>Successfully Enrolled</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>
                  {importResult.importedCount}
                </div>
              </div>
              <div style={{ padding: '14px 24px', backgroundColor: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECDD3' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#991B1B' }}>Skipped / Duplicates</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>
                  {importResult.skippedCount}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <button
                onClick={() => navigate('/college/students')}
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
                <Users size={15} />
                <span>View Enrolled Students</span>
              </button>

              <button
                onClick={() => navigate('/college/give-access')}
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
                <FileCheck2 size={15} />
                <span>Provision BEXO Access for Imported Students</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
