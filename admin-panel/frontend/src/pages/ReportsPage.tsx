import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  BarChart3,
  Download,
  Building,
  GraduationCap,
  Layers,
  Cpu,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { colleges, students, provisioningJobs, services } = useAdmin();

  const [activeReport, setActiveReport] = useState<'colleges' | 'students' | 'quota' | 'provisioning'>('colleges');

  const handleExportCSV = () => {
    let headers = '';
    let rows = '';

    if (activeReport === 'colleges') {
      headers = 'Code,Name,City,State,Status,Total_Students,Active_Students,Quota_Allocated,Quota_Used\n';
      rows = colleges
        .map((c) => `"${c.code}","${c.name}","${c.city}","${c.state}","${c.status}",${c.totalStudents},${c.activeStudents},${c.quota.allocated},${c.quota.used}`)
        .join('\n');
    } else if (activeReport === 'students') {
      headers = 'Roll_Number,Name,College,Department,Status,Email,Enrolled_Year\n';
      rows = students
        .map((s) => `"${s.rollNumber}","${s.name}","${s.collegeName}","${s.department}","${s.accessStatus}","${s.email}",${s.enrolledYear}`)
        .join('\n');
    } else {
      headers = 'Job_ID,College,Source,Total,Successful,Failed,Status,Date\n';
      rows = provisioningJobs
        .map((j) => `"${j.id}","${j.collegeName}","${j.source}",${j.totalRecords},${j.successful},${j.failed},"${j.status}","${j.createdAt}"`)
        .join('\n');
    }

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BEXO_${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <BarChart3 size={26} color="var(--bexo-blue-600)" />
            <span>Reports & Platform Analytics</span>
          </h1>
          <p>
            Centralized operational analytics, seat utilization trajectories, batch ingestion outcomes, and institutional exports.
          </p>
        </div>

        <div className="page-actions-group">
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <Download size={14} />
            <span>Export CSV Dataset</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="tabs-nav-bar">
        <button
          className={`tab-nav-item ${activeReport === 'colleges' ? 'active' : ''}`}
          onClick={() => setActiveReport('colleges')}
        >
          <Building size={15} /> Institutional Performance
        </button>
        <button
          className={`tab-nav-item ${activeReport === 'students' ? 'active' : ''}`}
          onClick={() => setActiveReport('students')}
        >
          <GraduationCap size={15} /> Student Rosters & Engagement
        </button>
        <button
          className={`tab-nav-item ${activeReport === 'quota' ? 'active' : ''}`}
          onClick={() => setActiveReport('quota')}
        >
          <Layers size={15} /> Quota Capacity & Thresholds
        </button>
        <button
          className={`tab-nav-item ${activeReport === 'provisioning' ? 'active' : ''}`}
          onClick={() => setActiveReport('provisioning')}
        >
          <Cpu size={15} /> Ingestion & Job Reliability
        </button>
      </div>

      {/* Main Report Table Preview */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <FileSpreadsheet size={16} color="var(--bexo-blue-600)" />
            <span>Data Summary Table Preview ({activeReport.toUpperCase()})</span>
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Real-time aggregate data
          </span>
        </div>

        <div className="table-container">
          {activeReport === 'colleges' && (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>College</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Enrolled</th>
                  <th>Active</th>
                  <th>Quota Capacity</th>
                  <th>Utilization Rate</th>
                </tr>
              </thead>
              <tbody>
                {colleges.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.name} ({c.code})</strong></td>
                    <td>{c.city}</td>
                    <td>{c.status}</td>
                    <td>{c.totalStudents.toLocaleString()}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{c.activeStudents.toLocaleString()}</td>
                    <td>{c.quota.allocated.toLocaleString()}</td>
                    <td>
                      <span style={{ fontWeight: 700 }}>
                        {Math.round((c.quota.used / (c.quota.allocated || 1)) * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'students' && (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Institution</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.rollNumber}</strong></td>
                    <td>{s.name}</td>
                    <td>{s.collegeName}</td>
                    <td>{s.department}</td>
                    <td>{s.email}</td>
                    <td>{s.accessStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'quota' && (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Allocated Seats</th>
                  <th>Used Seats</th>
                  <th>Remaining</th>
                  <th>Warning Cap</th>
                  <th>Critical Cap</th>
                  <th>Action State</th>
                </tr>
              </thead>
              <tbody>
                {colleges.map((c) => {
                  const pct = Math.round((c.quota.used / c.quota.allocated) * 100);
                  return (
                    <tr key={c.id}>
                      <td><strong>{c.name}</strong></td>
                      <td>{c.quota.allocated.toLocaleString()}</td>
                      <td>{c.quota.used.toLocaleString()}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                        {(c.quota.allocated - c.quota.used).toLocaleString()}
                      </td>
                      <td>{c.quota.warningThreshold}%</td>
                      <td>{c.quota.criticalThreshold}%</td>
                      <td>
                        <span style={{ color: pct >= 95 ? 'var(--color-danger)' : pct >= 80 ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 700 }}>
                          {pct >= 95 ? 'Critical Limit' : pct >= 80 ? 'Warning Level' : 'Healthy'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeReport === 'provisioning' && (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>College</th>
                  <th>Source</th>
                  <th>Total</th>
                  <th>Successful</th>
                  <th>Failed</th>
                  <th>Reliability</th>
                </tr>
              </thead>
              <tbody>
                {provisioningJobs.map((j) => (
                  <tr key={j.id}>
                    <td><strong>{j.id}</strong></td>
                    <td>{j.collegeName}</td>
                    <td>{j.source}</td>
                    <td>{j.totalRecords}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{j.successful}</td>
                    <td style={{ color: j.failed > 0 ? 'var(--color-danger)' : 'inherit', fontWeight: j.failed > 0 ? 700 : 400 }}>{j.failed}</td>
                    <td>
                      <span style={{ fontWeight: 700 }}>
                        {Math.round((j.successful / (j.totalRecords || 1)) * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
