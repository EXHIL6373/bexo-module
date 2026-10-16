import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  ShieldAlert,
  Lock,
  UserCheck,
  Building2,
  AlertOctagon,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export const AccessDeniedGate: React.FC = () => {
  const { currentUser, staffUsers, setCurrentUser, switchToSuperAdmin, colleges } = useAdmin();
  const [showCollegeDemo, setShowCollegeDemo] = useState(false);

  const collegeAdmins = staffUsers.filter((u) => u.role.startsWith('college_'));
  const superAdmins = staffUsers.filter((u) => u.role === 'super_admin');
  const corporateAdmins = staffUsers.filter((u) => u.role === 'admin');

  const userCollege = colleges.find((c) => c.id === currentUser.collegeId);

  return (
    <div
      style={{
        minHeight: '78vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '820px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #FECDD3',
          boxShadow: '0 20px 40px -15px rgba(225, 29, 72, 0.12), 0 0 0 1px rgba(225, 29, 72, 0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Top Warning Strip */}
        <div
          style={{
            backgroundColor: '#BE123C',
            color: '#FFFFFF',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={20} />
            <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Security Protocol: Access Denied (HTTP 403)
            </span>
          </div>
          <span
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            Zero-Trust Isolation Active
          </span>
        </div>

        <div style={{ padding: '36px 32px' }}>
          {/* Main Headline */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: '#FFE4E6',
                color: '#E11D48',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Lock size={32} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              College Access Forbidden in Central Admin Panel
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#64748B',
                maxWidth: '620px',
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              The BEXO Central Admin Panel is restricted exclusively to <strong>Super Admins</strong> (Kavinbalaji S K & Ezhilarasan M.) and <strong>Platform Admins</strong>. College authorities, faculty, and coordinators are strictly prohibited from accessing this central dashboard.
            </p>
          </div>

          {/* Attempted Identity Information Card */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '20px',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertOctagon size={14} color="#E11D48" />
              <span>Current Blocked Session Identity</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>User Account</div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{currentUser.name}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>{currentUser.email}</div>
              </div>

              <div>
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>Assigned Role</div>
                <div style={{ marginTop: '2px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#FFE4E6',
                      color: '#BE123C',
                      fontWeight: 700,
                      fontSize: '11.5px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid #FECDD3',
                    }}
                  >
                    {currentUser.role.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>Affiliated Institution</div>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>
                  {currentUser.collegeName || userCollege?.name || 'College Scope'}
                </div>
                <div style={{ fontSize: '11.5px', color: '#E11D48', fontWeight: 600 }}>
                  Single-College Boundary Enforced
                </div>
              </div>
            </div>
          </div>

          {/* Quick Authorization Switcher (One-click Restore to Super Admin) */}
          <div style={{ marginBottom: '28px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>SWITCH TO AUTHORIZED CORPORATE SUPER ADMIN / ADMIN:</span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>Testing & Verification Controls</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {/* Kavinbalaji S K */}
              <button
                onClick={() => switchToSuperAdmin('usr-super-kavin')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#F59E0B',
                    color: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  K
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '13.5px' }}>Kavinbalaji S K</span>
                    <Sparkles size={13} color="#F59E0B" />
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Super Admin • BEXO HQ</div>
                </div>
                <ChevronRight size={16} color="#94A3B8" />
              </button>

              {/* Ezhilarasan M. */}
              <button
                onClick={() => switchToSuperAdmin('usr-admin-1')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#1E293B',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 4px 12px rgba(30, 41, 59, 0.12)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  E
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '13.5px' }}>Ezhilarasan M.</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Super Admin • BEXO HQ</div>
                </div>
                <ChevronRight size={16} color="#94A3B8" />
              </button>

              {/* Platform Admin */}
              {corporateAdmins[0] && (
                <button
                  onClick={() => {
                    setCurrentUser(corporateAdmins[0]);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#F1F5F9',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#64748B',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '14px',
                      flexShrink: 0,
                    }}
                  >
                    R
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{corporateAdmins[0].name}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Platform Admin • BEXO HQ</div>
                  </div>
                  <ChevronRight size={16} color="#64748B" />
                </button>
              )}
            </div>
          </div>

          {/* Toggle College Portal Scope Preview */}
          <div
            style={{
              paddingTop: '20px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '12.5px', color: '#64748B' }}>
              College user portals are isolated at: <code style={{ backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>https://portal.bexo.in/college</code>
            </div>

            <button
              onClick={() => setShowCollegeDemo(!showCollegeDemo)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <GraduationCap size={14} />
              <span>{showCollegeDemo ? 'Hide College Scope Preview' : 'Preview College Scope'}</span>
            </button>
          </div>

          {/* Simulated College Scope View */}
          {showCollegeDemo && (
            <div
              style={{
                marginTop: '20px',
                padding: '20px',
                borderRadius: '10px',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#92400E', marginBottom: '8px' }}>
                🎓 College Portal Boundary Demonstration: {currentUser.collegeName || 'PSG Tech'}
              </div>
              <p style={{ fontSize: '12.5px', color: '#B45309', lineHeight: 1.5, marginBottom: '12px' }}>
                In production, college personnel operate exclusively within their tenant subdomain. They can:
              </p>
              <ul style={{ fontSize: '12.5px', color: '#78350F', paddingLeft: '20px', lineHeight: 1.6 }}>
                <li>View only students enrolled in their institution ({currentUser.collegeName || 'PSG College of Technology'}).</li>
                <li>Submit department service requests and quota expansion applications.</li>
                <li>Download verification reports for campus placements.</li>
                <li><strong>CANNOT</strong> access the Admin Panel, modify pricing/agreements, view other colleges, or access company settings.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
