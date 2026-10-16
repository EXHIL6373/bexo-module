import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useRouter } from '../../router/Router';
import { Search, Building, GraduationCap, Users, Cpu, FileText, CheckSquare, ArrowRight, X, LayoutTemplate } from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, colleges, students, provisioningJobs, approvals, appTemplates } = useAdmin();
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  // Global keydown listener for Ctrl+K / Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const q = query.toLowerCase().trim();

  const matchedColleges = q
    ? colleges.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)).slice(0, 4)
    : [];

  const matchedStudents = q
    ? students.filter((s) => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)).slice(0, 5)
    : [];

  const matchedJobs = q
    ? provisioningJobs.filter((j) => j.id.toLowerCase().includes(q) || j.collegeName.toLowerCase().includes(q)).slice(0, 3)
    : [];

  const matchedApprovals = q
    ? approvals.filter((a) => a.id.toLowerCase().includes(q) || a.type.toLowerCase().includes(q) || a.collegeName.toLowerCase().includes(q)).slice(0, 3)
    : [];

  const matchedTemplates = q
    ? appTemplates.filter((t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q))).slice(0, 3)
    : [];

  const totalResults = matchedColleges.length + matchedStudents.length + matchedJobs.length + matchedApprovals.length + matchedTemplates.length;

  const handleSelect = (url: string) => {
    setIsSearchOpen(false);
    navigate(url);
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsSearchOpen(false)}>
      <div
        className="modal-dialog lg"
        style={{ maxWidth: '680px', marginTop: '-10vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-light)', gap: '12px' }}>
          <Search size={20} color="var(--bexo-blue-600)" />
          <input
            id="global-search-input"
            name="globalSearchQuery"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search colleges, roll numbers (e.g. 22CS001), students, jobs, requests..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              color: 'var(--text-primary)',
              background: 'transparent',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: '#94A3B8' }}>
              <X size={16} />
            </button>
          )}
          <span className="kbd-shortcut">ESC</span>
        </div>

        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '12px 16px' }}>
          {!q && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Quick Entity Search
              </div>
              <p style={{ fontSize: '12px' }}>
                Type to search across Colleges, Student Records, Provisioning Batches, and Approval Requests.
              </p>
            </div>
          )}

          {q && totalResults === 0 && (
            <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>No records matched "{query}"</div>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Try searching by college code (PSGCT), roll number (22CS001), or job ID.</p>
            </div>
          )}

          {matchedColleges.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px' }}>
                Colleges
              </div>
              {matchedColleges.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelect(`/admin/colleges/${c.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bexo-blue-600)' }}>
                      <Building size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>{c.name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{c.code} • {c.city}, {c.state} • {c.totalStudents} Students</div>
                    </div>
                  </div>
                  <ArrowRight size={14} color="#94A3B8" />
                </div>
              ))}
            </div>
          )}

          {matchedStudents.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px' }}>
                Students
              </div>
              {matchedStudents.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelect(`/admin/students`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>{s.name} <span style={{ fontWeight: 400, color: '#64748B' }}>({s.rollNumber})</span></div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{s.collegeName} • {s.department} • {s.accessStatus}</div>
                    </div>
                  </div>
                  <ArrowRight size={14} color="#94A3B8" />
                </div>
              ))}
            </div>
          )}

          {matchedJobs.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px' }}>
                Provisioning Jobs
              </div>
              {matchedJobs.map((j) => (
                <div
                  key={j.id}
                  onClick={() => handleSelect(`/admin/provisioning`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
                      <Cpu size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>{j.id} — {j.collegeName}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{j.totalRecords} records • Status: {j.status}</div>
                    </div>
                  </div>
                  <ArrowRight size={14} color="#94A3B8" />
                </div>
              ))}
            </div>
          )}

          {matchedApprovals.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px' }}>
                Approvals & Requests
              </div>
              {matchedApprovals.map((a) => (
                <div
                  key={a.id}
                  onClick={() => handleSelect(`/admin/approvals`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-purple)' }}>
                      <CheckSquare size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>{a.type} — {a.collegeName}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Priority: {a.priority} • Status: {a.status}</div>
                    </div>
                  </div>
                  <ArrowRight size={14} color="#94A3B8" />
                </div>
              ))}
            </div>
          )}

          {matchedTemplates.length > 0 && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px' }}>
                App Templates Studio
              </div>
              {matchedTemplates.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelect(`/admin/templates`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: t.thumbnailColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                      <LayoutTemplate size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>{t.name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{t.category.toUpperCase()} • Tier: {t.tier} • {t.downloadsCount} Downloads</div>
                    </div>
                  </div>
                  <ArrowRight size={14} color="#94A3B8" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-muted)', background: 'var(--bg-surface-subtle)' }}>
          <div>Use <kbd className="kbd-shortcut">↑</kbd> <kbd className="kbd-shortcut">↓</kbd> to navigate, <kbd className="kbd-shortcut">↵</kbd> to select</div>
          <div>BEXO Global Enterprise Index</div>
        </div>
      </div>
    </div>
  );
};
