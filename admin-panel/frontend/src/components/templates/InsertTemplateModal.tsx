import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { TemplateCategory, TemplateTier, TemplateStatus } from '../../types';
import {
  LayoutTemplate,
  X,
  Upload,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Tag,
  Palette,
  FileCode,
  ShieldAlert,
} from 'lucide-react';

interface InsertTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_GRADIENTS = [
  { name: 'Navy Blue (Core)', value: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)' },
  { name: 'Obsidian Tech (Dark)', value: 'linear-gradient(135deg, #0F172A 0%, #0284C7 100%)' },
  { name: 'Crimson Elite (ATS)', value: 'linear-gradient(135deg, #7F1D1D 0%, #DC2626 100%)' },
  { name: 'Emerald Executive', value: 'linear-gradient(135deg, #134E4A 0%, #0D9488 100%)' },
  { name: 'Cyber Violet (Bio)', value: 'linear-gradient(135deg, #581C87 0%, #9333EA 100%)' },
  { name: 'Sunset Fuchsia', value: 'linear-gradient(135deg, #701A75 0%, #D946EF 100%)' },
];

export const InsertTemplateModal: React.FC<InsertTemplateModalProps> = ({ isOpen, onClose }) => {
  const { addAppTemplate, currentUser } = useAdmin();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('portfolio');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [compatibleAppVersion, setCompatibleAppVersion] = useState('>= 2.2.0');
  const [tier, setTier] = useState<TemplateTier>('Institutional');
  const [status, setStatus] = useState<TemplateStatus>('Published');
  const [isFeatured, setIsFeatured] = useState(false);
  const [tagsInput, setTagsInput] = useState('minimal, responsive, mobile-first');
  const [sourceBundle, setSourceBundle] = useState('templates-source/jo-portfolio');
  const [selectedGradient, setSelectedGradient] = useState(PRESET_GRADIENTS[0].value);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(autoSlug);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Template name is required.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a short description for mobile app users.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addAppTemplate({
      name: name.trim(),
      slug: slug.trim() || 'tmpl-' + Date.now().toString().slice(-4),
      category,
      description: description.trim(),
      version: version.trim() || '1.0.0',
      thumbnailColor: selectedGradient,
      tier,
      status,
      isFeatured,
      tags: tags.length > 0 ? tags : ['bexo', category],
      sourceBundle: sourceBundle.trim() || 'templates-source/bundle.zip',
      compatibleAppVersion: compatibleAppVersion.trim() || '>= 2.0.0',
      author: currentUser.name + ' (' + currentUser.role.replace('_', ' ').toUpperCase() + ')',
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '95%' }}
      >
        <div className="modal-header">
          <div className="modal-title">
            <LayoutTemplate size={20} color="var(--bexo-blue-600)" />
            <span>Insert New App Template</span>
          </div>
          <button onClick={onClose} style={{ color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#FFE4E6',
                  color: '#BE123C',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Template Identity */}
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="tpl-name-input" className="form-label">Template Display Name *</label>
                <input
                  id="tpl-name-input"
                  name="templateName"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Jo Portfolio — Minimalist Pro"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tpl-slug-input" className="form-label">Template Identifier (Slug)</label>
                <input
                  id="tpl-slug-input"
                  name="templateSlug"
                  type="text"
                  className="form-input"
                  placeholder="e.g. jo-portfolio-minimal"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="tpl-category-select" className="form-label">Category *</label>
                <select
                  id="tpl-category-select"
                  name="templateCategory"
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                >
                  <option value="portfolio">Personal Portfolio (Web Subdomain)</option>
                  <option value="resume">Placement Resume (ATS Format)</option>
                  <option value="biolink">Campus BioLink (Mobile Micro-Page)</option>
                  <option value="showcase">Project Showcase / Creative Work</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tpl-tier-select" className="form-label">Access Tier *</label>
                <select
                  id="tpl-tier-select"
                  name="templateTier"
                  className="form-select"
                  value={tier}
                  onChange={(e) => setTier(e.target.value as TemplateTier)}
                >
                  <option value="Free">Free (All Registered Students)</option>
                  <option value="Pro">Pro (Student Subscription)</option>
                  <option value="Institutional">Institutional (University MOU Tier)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tpl-desc-textarea" className="form-label">Description (Shown on Mobile App Store Card) *</label>
              <textarea
                id="tpl-desc-textarea"
                name="templateDescription"
                className="form-textarea"
                rows={3}
                placeholder="Brief summary of template design, sections included, responsive layouts, and target student audience..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Versioning & Technical Package */}
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="tpl-version-input" className="form-label">Template Version</label>
                <input
                  id="tpl-version-input"
                  name="templateVersion"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 2.4.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="tpl-minapp-input" className="form-label">Min. BEXO Mobile App Version</label>
                <input
                  id="tpl-minapp-input"
                  name="compatibleAppVersion"
                  type="text"
                  className="form-input"
                  placeholder="e.g. >= 2.2.0"
                  value={compatibleAppVersion}
                  onChange={(e) => setCompatibleAppVersion(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tpl-sourcebundle-input" className="form-label">Template Source Bundle / Repository Path</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  id="tpl-sourcebundle-input"
                  name="sourceBundle"
                  type="text"
                  className="form-input"
                  placeholder="e.g. templates-source/jo-portfolio"
                  value={sourceBundle}
                  onChange={(e) => setSourceBundle(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSourceBundle('templates-source/jo-portfolio')}
                  title="Use existing BEXO template source"
                  style={{ whiteSpace: 'nowrap', fontSize: '11.5px' }}
                >
                  <FileCode size={13} />
                  <span>Jo Portfolio</span>
                </button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Connects to the source component repository inside BEXO App bundle architecture.
              </div>
            </div>

            {/* Theme & Visual Card Gradient */}
            <div className="form-group">
              <label className="form-label">Mobile Card Accent & Theme Gradient</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {PRESET_GRADIENTS.map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => setSelectedGradient(g.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: g.value,
                      color: '#FFFFFF',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      border: selectedGradient === g.value ? '2px solid #FFFFFF' : '1px solid transparent',
                      outline: selectedGradient === g.value ? '2px solid var(--bexo-blue-600)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                    }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="form-group">
              <label htmlFor="tpl-tags-input" className="form-label">Search Tags (Comma-Separated)</label>
              <input
                id="tpl-tags-input"
                name="tagsInput"
                type="text"
                className="form-input"
                placeholder="e.g. minimalist, dark-mode, ats-compliant, react"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            {/* Publishing Flags */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                padding: '14px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <label htmlFor="tpl-publish-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  id="tpl-publish-checkbox"
                  name="publishImmediately"
                  type="checkbox"
                  checked={status === 'Published'}
                  onChange={(e) => setStatus(e.target.checked ? 'Published' : 'Draft')}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Publish Immediately to BEXO Mobile App</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Makes this template discoverable to students inside the mobile app template carousel.
                  </div>
                </div>
              </label>

              <label htmlFor="tpl-featured-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  id="tpl-featured-checkbox"
                  name="featureInCarousel"
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Feature in Mobile Home Hero Carousel</span>
                    <Sparkles size={13} color="#F59E0B" />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Puts this template at the top of the mobile home tab for maximum student visibility.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Upload size={15} />
              <span>Insert & Register Template</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
