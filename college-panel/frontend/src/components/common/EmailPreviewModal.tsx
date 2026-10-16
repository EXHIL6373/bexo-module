import React, { useState } from 'react';
import { OutboxEmail } from '../../types';
import { Mail, Check, Copy, ExternalLink, X, ShieldCheck, Clock, Send } from 'lucide-react';
import { useRouter } from '../../router/Router';

interface EmailPreviewModalProps {
  email: OutboxEmail | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({ email, isOpen, onClose }) => {
  const { navigate } = useRouter();
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !email) return null;

  const handleCopyLink = () => {
    // Generate full URL
    const fullUrl = email.actionUrl.startsWith('#')
      ? `${window.location.origin}${window.location.pathname}${email.actionUrl}`
      : email.actionUrl;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleJumpToLink = () => {
    onClose();
    if (email.actionUrl.startsWith('#/')) {
      navigate(email.actionUrl.slice(1));
    } else {
      window.location.href = email.actionUrl;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px',
        }}
      >
        {/* Email Header Bar */}
        <div
          style={{
            padding: '18px 24px',
            backgroundColor: '#0B152B',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60A5FA',
              }}
            >
              <Mail size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>BEXO Secure Email Dispatch Center</div>
              <div style={{ fontSize: '11px', color: '#93C5FD' }}>
                Delivery Status: <strong>{email.status}</strong> &bull; Transmitted via BEXO Transactional Mailer
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="icon-btn"
            style={{ color: '#94A3B8', backgroundColor: 'rgba(255,255,255,0.06)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Email Metadata Details */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid var(--border-light)',
            fontSize: '12.5px',
            lineHeight: 1.6,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>To:</span>
            <span>
              <strong>{email.toName}</strong> &lt;{email.to}&gt;
            </span>

            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Subject:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{email.subject}</span>

            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Sent At:</span>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> {new Date(email.sentAt).toLocaleString()}
            </span>
          </div>

          {/* Quick Action Links Bar */}
          <div
            style={{
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#16A34A', fontWeight: 600 }}>
              <ShieldCheck size={14} /> Single-Use Secure Cryptographic Token Embedded
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopyLink}
                style={{ fontSize: '12px', padding: '5px 12px' }}
              >
                {copiedLink ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Activation Link'}</span>
              </button>

              <button
                className="btn btn-primary btn-sm"
                onClick={handleJumpToLink}
                style={{ fontSize: '12px', padding: '5px 14px' }}
              >
                <ExternalLink size={14} />
                <span>Open in Tab</span>
              </button>
            </div>
          </div>
        </div>

        {/* Rendered HTML Email Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            backgroundColor: '#F1F5F9',
            flex: 1,
          }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
            style={{ margin: '0 auto', maxWidth: '600px' }}
          />
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'white',
          }}
        >
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Audit reference: <code>EML-{email.id.toUpperCase()}</code>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
