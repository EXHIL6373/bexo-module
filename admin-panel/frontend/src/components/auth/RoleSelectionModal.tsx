import React from 'react';
import { RolePersona } from '../../services/authService';
import { Shield, Building2, User, ChevronRight, School } from 'lucide-react';

interface RoleSelectionModalProps {
  isOpen: boolean;
  availableRoles: RolePersona[];
  onSelectRole: (role: RolePersona) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  availableRoles,
  onSelectRole,
  onCancel,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  const getRoleIcon = (portal: string, role: string) => {
    if (portal === 'admin' || role.includes('super_admin')) {
      return <Shield size={24} color="#60A5FA" />;
    }
    if (portal === 'college' || role.includes('college')) {
      return <School size={24} color="#34D399" />;
    }
    return <User size={24} color="#A78BFA" />;
  };

  const getPortalBadge = (portal: string) => {
    if (portal === 'admin') {
      return {
        label: 'Admin Portal',
        bg: 'rgba(37, 99, 235, 0.2)',
        color: '#93C5FD',
        border: 'rgba(59, 130, 246, 0.4)',
      };
    }
    if (portal === 'college') {
      return {
        label: 'College Portal',
        bg: 'rgba(16, 185, 129, 0.2)',
        color: '#6EE7B7',
        border: 'rgba(16, 185, 129, 0.4)',
      };
    }
    return {
      label: 'Consumer Workspace',
      bg: 'rgba(139, 92, 246, 0.2)',
      color: '#C4B5FD',
      border: 'rgba(139, 92, 246, 0.4)',
    };
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(5, 11, 23, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="role-selection-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '32px 28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 50px rgba(37, 99, 235, 0.2)',
          color: '#F8FAFC',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.3) 0%, rgba(79, 70, 229, 0.3) 100%)',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Shield size={28} color="#60A5FA" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>Select Your Access Persona</h2>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
            Your verified identity holds multiple authorized roles across the BEXO ecosystem. Choose which persona to activate for this session.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {availableRoles.map((role) => {
            const badge = getPortalBadge(role.portal);
            return (
              <button
                key={role.id}
                type="button"
                disabled={isSubmitting}
                onClick={() => onSelectRole(role)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 18px',
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  color: 'inherit',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 1)';
                    e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.5)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.7)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getRoleIcon(role.portal, role.role)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600 }}>{role.label}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {role.collegeName ? `${role.collegeName}` : 'Central Corporate Authority'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '20px',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                    }}
                  >
                    {badge.label}
                  </span>
                  <ChevronRight size={18} color="#64748B" />
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={onCancel}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: '#94A3B8',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = '#F8FAFC';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#94A3B8';
          }}
        >
          Cancel and Return
        </button>
      </div>
    </div>
  );
};
