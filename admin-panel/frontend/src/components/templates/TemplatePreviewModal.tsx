import React, { useState } from 'react';
import { AppTemplate } from '../../types';
import { useAdmin } from '../../context/AdminContext';
import {
  X,
  Smartphone,
  ExternalLink,
  Download,
  Share2,
  CheckCircle2,
  Star,
  Eye,
  Sun,
  Moon,
  Code2,
  Globe,
  Mail,
  GraduationCap,
  Sparkles,
  FileText,
} from 'lucide-react';

interface TemplatePreviewModalProps {
  template: AppTemplate | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
}) => {
  const { togglePublishTemplate, toggleFeaturedTemplate } = useAdmin();
  const [isDarkMode, setIsDarkMode] = useState(false);

  if (!isOpen || !template) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '95%',
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          borderRadius: '18px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: '#1E293B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: template.thumbnailColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Smartphone size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#FFFFFF' }}>{template.name}</span>
                <span
                  style={{
                    backgroundColor: template.status === 'Published' ? '#059669' : '#D97706',
                    color: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                  }}
                >
                  {template.status.toUpperCase()}
                </span>
                {template.isFeatured && (
                  <span
                    style={{
                      backgroundColor: '#F59E0B',
                      color: '#000000',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <Sparkles size={10} /> FEATURED
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                BEXO Mobile App Viewport Simulator • Version {template.version} • {template.category.toUpperCase()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                padding: '6px 12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {isDarkMode ? <Sun size={14} color="#FBBF24" /> : <Moon size={14} color="#93C5FD" />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body: Split view (Phone Mockup + Details Sidebar) */}
        <div style={{ display: 'flex', flexDirection: 'row', minHeight: '560px' }}>
          {/* Left / Center: Interactive Phone Mockup */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#090D16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              position: 'relative',
            }}
          >
            {/* Smartphone Chassis */}
            <div
              style={{
                width: '320px',
                height: '560px',
                backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                color: isDarkMode ? '#F8FAFC' : '#0F172A',
                borderRadius: '36px',
                border: '8px solid #2D3748',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Dynamic Island Notch */}
              <div
                style={{
                  height: '24px',
                  backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 16px',
                  fontSize: '10px',
                  fontWeight: 700,
                  zIndex: 20,
                }}
              >
                <span>9:41</span>
                <div
                  style={{
                    width: '68px',
                    height: '14px',
                    backgroundColor: '#000000',
                    borderRadius: '10px',
                  }}
                />
                <span style={{ fontSize: '9px' }}>5G 100%</span>
              </div>

              {/* Mobile App Header */}
              <div
                style={{
                  padding: '8px 14px',
                  borderBottom: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      background: template.thumbnailColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF',
                      fontSize: '9px',
                      fontWeight: 800,
                    }}
                  >
                    B
                  </div>
                  <span>BEXO App</span>
                </div>
                <span style={{ fontSize: '10px', color: '#64748B' }}>Live Preview</span>
              </div>

              {/* Dynamic Template Content */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '14px',
                  fontSize: '12px',
                }}
              >
                {/* Hero / Header based on Category */}
                {template.category === 'portfolio' && (
                  <div>
                    <div
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: template.thumbnailColor,
                        color: '#FFFFFF',
                        marginBottom: '12px',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: '#FFFFFF',
                          color: '#1E3A8A',
                          margin: '0 auto 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '18px',
                        }}
                      >
                        AV
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '14px' }}>Arun Vignesh S.</div>
                      <div style={{ fontSize: '10.5px', opacity: 0.9 }}>Computer Science • PSG Tech</div>
                      <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                        arun-vignesh.atbexo.com
                      </div>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '11px', marginBottom: '6px', color: '#64748B' }}>
                      TECHNICAL STACK
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
                      {['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Flutter'].map((s) => (
                        <span
                          key={s}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                            fontSize: '10px',
                            fontWeight: 600,
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '11px', marginBottom: '6px', color: '#64748B' }}>
                      FEATURED PROJECTS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '11.5px' }}>Automated Placement Portal</div>
                        <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                          Next.js, Supabase, Tailwind • 99.4% test coverage
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '11.5px' }}>Realtime Telemetry Engine</div>
                        <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                          FastAPI, WebSocket, Redis PubSub
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {template.category === 'resume' && (
                  <div style={{ fontFamily: 'Georgia, serif' }}>
                    <div style={{ textAlign: 'center', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px', marginBottom: '10px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800 }}>ARUN VIGNESH S.</div>
                      <div style={{ fontSize: '9px', color: '#64748B' }}>
                        arun.22cs001@psgtech.edu • +91 98765 43210 • Coimbatore, TN
                      </div>
                    </div>

                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#1E40AF', borderBottom: '1px solid #BFDBFE', marginBottom: '4px' }}>
                      EDUCATION
                    </div>
                    <div style={{ fontSize: '10px', marginBottom: '8px' }}>
                      <strong>PSG College of Technology</strong> — B.Tech Computer Science (2022 - 2026)<br />
                      CGPA: 8.92 / 10 • Dean's Honor Roll
                    </div>

                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#1E40AF', borderBottom: '1px solid #BFDBFE', marginBottom: '4px' }}>
                      WORK EXPERIENCE
                    </div>
                    <div style={{ fontSize: '9.5px', marginBottom: '8px' }}>
                      <strong>Software Engineer Intern</strong> — BEXO Technologies (Summer 2025)<br />
                      • Engineered high-throughput REST APIs reducing student roster sync latency by 45%.<br />
                      • Implemented Zero-Trust authentication and role guards.
                    </div>

                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#1E40AF', borderBottom: '1px solid #BFDBFE', marginBottom: '4px' }}>
                      CAMPUS VERIFICATION
                    </div>
                    <div style={{ fontSize: '9px', color: '#059669', fontWeight: 700 }}>
                      ✓ Verified by PSG Tech Career Guidance Cell (Stamp Ref: PSG-2026-901)
                    </div>
                  </div>
                )}

                {template.category === 'biolink' && (
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        background: template.thumbnailColor,
                        color: 'white',
                        margin: '0 auto 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '20px',
                      }}
                    >
                      K
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '13px' }}>Karthik Subramanian</div>
                    <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '14px' }}>
                      ECE Researcher & Hardware Hacker @ KCT
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { label: 'View Portfolio & Projects', icon: ExternalLink },
                        { label: 'Download ATS Verified Resume', icon: FileText },
                        { label: 'GitHub Repository Archive', icon: Code2 },
                        { label: 'Connect on Professional Network', icon: Globe },
                      ].map((link, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '24px',
                            border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                            backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                            fontWeight: 700,
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{link.label}</span>
                          <link.icon size={13} color="#64748B" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {template.category === 'showcase' && (
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '4px' }}>Creative Visual Works</div>
                    <div style={{ fontSize: '10.5px', color: '#64748B', marginBottom: '10px' }}>
                      Curated UI/UX case studies and design system components.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          style={{
                            height: '90px',
                            borderRadius: '8px',
                            background: template.thumbnailColor,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'flex-end',
                            padding: '8px',
                            fontSize: '9.5px',
                            fontWeight: 700,
                          }}
                        >
                          Case Study #{i}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Phone Home Bar */}
              <div
                style={{
                  height: '16px',
                  backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '100px',
                    height: '4px',
                    backgroundColor: isDarkMode ? '#475569' : '#CBD5E1',
                    borderRadius: '2px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right: Template Metadata & Quick Administrative Controls */}
          <div
            style={{
              width: '320px',
              backgroundColor: '#1E293B',
              padding: '24px',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px' }}>
                Template Configuration
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12.5px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Author / Maintainer</div>
                  <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{template.author}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Target App Surface</div>
                  <div style={{ fontWeight: 700, color: '#38BDF8' }}>
                    BEXO Mobile App & Web Subdomain
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Source Repository</div>
                  <code style={{ fontSize: '11px', color: '#A7F3D0', backgroundColor: '#064E3B', padding: '2px 6px', borderRadius: '4px' }}>
                    {template.sourceBundle || 'templates-source/jo-portfolio'}
                  </code>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Version Compatibility</div>
                  <div style={{ fontWeight: 600, color: '#F1F5F9' }}>
                    {template.compatibleAppVersion} (Engine {template.version})
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Tags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {template.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: '10.5px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: '#CBD5E1',
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Mobile Engagement Metrics</div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                        {template.downloadsCount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94A3B8' }}>App Downloads</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#10B981' }}>
                        {template.activeUsersCount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94A3B8' }}>Active Students</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => togglePublishTemplate(template.id)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  backgroundColor: template.status === 'Published' ? '#DC2626' : '#059669',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Eye size={14} />
                <span>{template.status === 'Published' ? 'Unpublish from App (Set Draft)' : 'Publish to Mobile App Catalog'}</span>
              </button>

              <button
                onClick={() => toggleFeaturedTemplate(template.id)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: template.isFeatured ? '#F59E0B' : '#CBD5E1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Star size={14} fill={template.isFeatured ? '#F59E0B' : 'none'} />
                <span>{template.isFeatured ? 'Remove from Hero Carousel' : 'Feature in Hero Carousel'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
