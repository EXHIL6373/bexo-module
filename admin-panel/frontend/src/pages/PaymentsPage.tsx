import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  CreditCard,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  DollarSign,
} from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const { payments } = useAdmin();

  // Financial aggregates
  const totalInvoiced = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalCollected = payments.filter((p) => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
  const totalFailed = payments.filter((p) => p.status === 'Failed').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <CreditCard size={26} color="var(--bexo-blue-600)" />
            <span>Payments & Finance Indicators</span>
          </h1>
          <p>
            Institutional billing status and licensing payment indicators aligned with active college MOUs.
          </p>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="stat-grid-4">
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL INVOICED</div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
            ₹{totalInvoiced.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>5 Institutional Billings</div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>SETTLED & COLLECTED</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)', marginTop: '4px' }}>
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '2px' }}>
            {Math.round((totalCollected / totalInvoiced) * 100)}% realization rate
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>PENDING CLEARANCE</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-warning)', marginTop: '4px' }}>
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>In negotiation</div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>OVERDUE / DEFAULT</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-danger)', marginTop: '4px' }}>
            ₹{totalFailed.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '2px' }}>CIT Coimbatore Default</div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Institutional Invoices & Payment Schedule</span>
        </div>
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Invoice Reference</th>
                <th>Institution</th>
                <th>Contract Description</th>
                <th>Amount (INR)</th>
                <th>Settlement Method</th>
                <th>Invoice Date</th>
                <th>Payment Status</th>
                <th style={{ textAlign: 'right' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong style={{ color: 'var(--bexo-blue-600)' }}>{p.invoiceNumber}</strong>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--text-primary)' }}>{p.collegeName}</strong>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {p.description}
                  </td>
                  <td>
                    <span style={{ fontWeight: 800 }}>₹{p.amount.toLocaleString('en-IN')}</span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.paymentMethod}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.date}</td>
                  <td>
                    <StatusBadge status={p.status} size="sm" />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                      onClick={() => alert(`Downloading official GST invoice ${p.invoiceNumber}...`)}
                    >
                      <Download size={12} /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
