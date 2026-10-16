import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { AppTemplate, TemplateCategory, TemplateTier } from '../types';
import { InsertTemplateModal } from '../components/templates/InsertTemplateModal';
import { TemplatePreviewModal } from '../components/templates/TemplatePreviewModal';
import {
  LayoutTemplate,
  Plus,
  Search,
  Smartphone,
  Eye,
  Star,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  Download,
  Users,
  Grid,
  List,
  Sparkles,
  ExternalLink,
  Tag,
  FileCode,
} from 'lucide-react';

export const TemplatesPage: React.FC = () => {
  const {
    appTemplates,
    deleteAppTemplate,
    togglePublishTemplate,
    toggleFeaturedTemplate,
    currentUser,
  } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | TemplateCategory>('all');
  const [selectedTier, setSelectedTier] = useState<'all' | TemplateTier>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'Published' | 'Draft'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<AppTemplate | null>(null);

  // Filtered Templates
  const filteredTemplates = appTemplates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesTier = selectedTier === 'all' || t.tier === selectedTier;
    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesTier && matchesStatus;
  });

  // KPI Calculations
  const totalDownloads = appTemplates.reduce((sum, t) => sum + t.downloadsCount, 0);
  const publishedCount = appTemplates.filter((t) => t.status === 'Published').length;
  const featuredCount = appTemplates.filter((t) => t.isFeatured).length;
  const portfolioCount = appTemplates.filter((t) => t.category === 'portfolio').length;
  const resumeCount = appTemplates.filter((t) => t.category === 'resume').length;
  const biolinkCount = appTemplates.filter((t) => t.category === 'biolink').length;
  const showcaseCount = appTemplates.filter((t) => t.category === 'showcase').length;

  // Render authentic visual thumbnail mockup for template cards
  const renderTemplateThumbnail = (template: AppTemplate) => {
    return (
      <div
        style={{
          height: '150px',
          background: template.thumbnailColor,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '12px 14px',
        }}
      >
        {/* Category-Specific Visual Wireframe Layout Mockup */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.35,
            pointerEvents: 'none',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: template.category === 'biolink' ? 'center' : 'stretch',
            justifyContent: 'center',
            transform: 'scale(0.95)',
          }}
        >
          {template.category === 'portfolio' && (
            <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.18)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.3)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'white' }} />
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'white' }} />
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'white' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                  <div style={{ height: '6px', width: '50%', background: 'white', borderRadius: '2px' }} />
                  <div style={{ height: '4px', width: '30%', background: 'rgba(255,255,255,0.7)', borderRadius: '2px' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                <div style={{ height: '28px', background: 'rgba(255,255,255,0.22)', borderRadius: 'var(--radius-sm)' }} />
                <div style={{ height: '28px', background: 'rgba(255,255,255,0.22)', borderRadius: 'var(--radius-sm)' }} />
              </div>
            </div>
          )}

          {template.category === 'resume' && (
            <div style={{ width: '85%', height: '100%', margin: '0 auto', background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.35)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ height: '7px', width: '45%', background: 'white', borderRadius: '2px' }} />
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.4)', margin: '2px 0' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ height: '4px', width: '80%', background: 'rgba(255,255,255,0.85)', borderRadius: '2px' }} />
                  <div style={{ height: '4px', width: '60%', background: 'rgba(255,255,255,0.65)', borderRadius: '2px' }} />
                  <div style={{ height: '4px', width: '70%', background: 'rgba(255,255,255,0.65)', borderRadius: '2px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ height: '5px', width: '90%', background: 'white', borderRadius: '2px' }} />
                  <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.7)', borderRadius: '2px' }} />
                  <div style={{ height: '4px', width: '75%', background: 'rgba(255,255,255,0.7)', borderRadius: '2px' }} />
                </div>
              </div>
            </div>
          )}

          {template.category === 'biolink' && (
            <div style={{ width: '110px', height: '100%', background: 'rgba(255,255,255,0.18)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.35)', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white' }} />
              <div style={{ height: '4px', width: '36px', background: 'rgba(255,255,255,0.85)', borderRadius: '2px' }} />
              <div style={{ height: '11px', width: '100%', background: 'rgba(255,255,255,0.25)', borderRadius: 'var(--radius-pill)', marginTop: '2px' }} />
              <div style={{ height: '11px', width: '100%', background: 'rgba(255,255,255,0.25)', borderRadius: 'var(--radius-pill)' }} />
            </div>
          )}

          {template.category === 'showcase' && (
            <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <div style={{ background: 'rgba(255,255,255,0.28)', borderRadius: 'var(--radius-sm)' }} />
              <div style={{ background: 'rgba(255,255,255,0.35)', borderRadius: 'var(--radius-sm)' }} />
              <div style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 'var(--radius-sm)' }} />
              <div style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 'var(--radius-sm)' }} />
              <div style={{ background: 'rgba(255,255,255,0.38)', borderRadius: 'var(--radius-sm)' }} />
              <div style={{ background: 'rgba(255,255,255,0.28)', borderRadius: 'var(--radius-sm)' }} />
            </div>
          )}
        </div>

        {/* Top Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <span
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              color: 'var(--text-inverse)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              backdropFilter: 'blur(6px)',
            }}
          >
            {template.category}
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            <span
              style={{
                backgroundColor: template.status === 'Published' ? 'var(--color-success)' : 'var(--color-warning)',
                color: 'var(--text-inverse)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '10.5px',
                fontWeight: 800,
              }}
            >
              {template.status}
            </span>
            {template.isFeatured && (
              <span
                style={{
                  backgroundColor: 'var(--color-warning)',
                  color: '#000000',
                  padding: '3px 6px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '10px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
                title="Featured Template"
              >
                <Star size={10} fill="#000" />
              </span>
            )}
          </div>
        </div>

        {/* Bottom Identity Scrim */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-inverse)', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
            {template.name}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
            Tier: {template.tier} • Engine v{template.version}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <LayoutTemplate size={26} color="var(--bexo-blue-600)" />
            <span>App Templates Studio</span>
          </h1>
          <p>
            Manage, configure, and publish portfolio, resume, and showcase templates distributed to students via the BEXO Mobile App.
          </p>
        </div>

        <div className="page-actions-group">
          <button className="btn btn-primary" onClick={() => setIsInsertModalOpen(true)}>
            <Plus size={16} />
            <span>Insert New Template</span>
          </button>
        </div>
      </div>

      {/* Condensed KPI Stats Strip (Compact single row, eliminates faux progress bars) */}
      <div className="kpi-strip">
        <div className="kpi-compact-card">
          <div className="kpi-compact-info">
            <span className="kpi-compact-title">Total Templates</span>
            <div className="kpi-compact-value-row">
              <span className="kpi-compact-value">{appTemplates.length}</span>
              <span className="kpi-compact-badge" style={{ backgroundColor: 'var(--bexo-blue-50)', color: 'var(--bexo-blue-600)' }}>
                {portfolioCount}P • {resumeCount}R
              </span>
            </div>
          </div>
          <div className="icon-btn" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bexo-blue-50)', color: 'var(--bexo-blue-600)', border: 'none' }}>
            <LayoutTemplate size={16} />
          </div>
        </div>

        <div className="kpi-compact-card">
          <div className="kpi-compact-info">
            <span className="kpi-compact-title">Live on Mobile App</span>
            <div className="kpi-compact-value-row">
              <span className="kpi-compact-value">{publishedCount}</span>
              <span className="kpi-compact-badge" style={{ backgroundColor: 'var(--bg-success)', color: 'var(--color-success)' }}>
                {Math.round((publishedCount / (appTemplates.length || 1)) * 100)}% Published
              </span>
            </div>
          </div>
          <div className="icon-btn" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-success)', color: 'var(--color-success)', border: 'none' }}>
            <CheckCircle2 size={16} />
          </div>
        </div>

        <div className="kpi-compact-card">
          <div className="kpi-compact-info">
            <span className="kpi-compact-title">Student App Downloads</span>
            <div className="kpi-compact-value-row">
              <span className="kpi-compact-value">{totalDownloads.toLocaleString()}</span>
              <span className="kpi-compact-badge" style={{ backgroundColor: 'var(--bexo-blue-50)', color: 'var(--bexo-blue-600)' }}>
                All Unis
              </span>
            </div>
          </div>
          <div className="icon-btn" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bexo-blue-50)', color: 'var(--bexo-blue-600)', border: 'none' }}>
            <Download size={16} />
          </div>
        </div>

        <div className="kpi-compact-card">
          <div className="kpi-compact-info">
            <span className="kpi-compact-title">Hero Featured</span>
            <div className="kpi-compact-value-row">
              <span className="kpi-compact-value">{featuredCount}</span>
              <span className="kpi-compact-badge" style={{ backgroundColor: 'var(--bg-warning)', color: 'var(--color-warning)' }}>
                Discovery Tab
              </span>
            </div>
          </div>
          <div className="icon-btn" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-warning)', color: 'var(--color-warning)', border: 'none' }}>
            <Sparkles size={16} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 300px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              id="template-search-input"
              name="searchQuery"
              type="text"
              className="form-input"
              placeholder="Search by template name, tag, author, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Category Segmented Tabs */}
          <div className="segmented-tab-group">
            {[
              { id: 'all', label: 'All', count: appTemplates.length },
              { id: 'portfolio', label: 'Portfolios', count: portfolioCount },
              { id: 'resume', label: 'Resumes', count: resumeCount },
              { id: 'biolink', label: 'BioLinks', count: biolinkCount },
              { id: 'showcase', label: 'Showcase', count: showcaseCount },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`segmented-tab-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          {/* Tier & Status Selectors */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              id="template-tier-select"
              name="tierFilter"
              className="form-select"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value as any)}
              style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }}
            >
              <option value="all">All Tiers</option>
              <option value="Free">Free</option>
              <option value="Pro">Pro</option>
              <option value="Institutional">Institutional</option>
            </select>

            <select
              id="template-status-select"
              name="statusFilter"
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }}
            >
              <option value="all">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>

            {/* View Mode Switcher */}
            <div className="view-toggle-group">
              <button
                onClick={() => setViewMode('grid')}
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                title="Grid View"
                aria-label="Grid View"
              >
                <Grid size={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                title="Table View"
                aria-label="Table View"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main View: Grid vs Table */}
      {viewMode === 'grid' ? (
        filteredTemplates.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  padding: 0,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                {/* Visual Layout Thumbnail Mockup Banner */}
                {renderTemplateThumbnail(template)}

                {/* Card Details Body */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                      {template.description}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
                      {template.tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: '11px',
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-surface-subtle)',
                            color: 'var(--text-muted)',
                            fontWeight: 500,
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div
                      style={{
                        padding: '10px 12px',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11.5px',
                        marginBottom: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Source:</span>
                        <code style={{ fontSize: '11px', color: 'var(--bexo-blue-600)' }}>
                          {template.sourceBundle || 'jo-portfolio'}
                        </code>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>App Compatibility:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{template.compatibleAppVersion}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Downloads / Users:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {template.downloadsCount.toLocaleString()} / {template.activeUsersCount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div style={{ display: 'flex', gap: '6px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setPreviewTemplate(template)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Smartphone size={13} />
                      <span>Preview in App</span>
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => togglePublishTemplate(template.id)}
                      title={template.status === 'Published' ? 'Unpublish to Draft' : 'Publish to App'}
                      style={{ padding: '6px 10px' }}
                    >
                      <Eye size={14} color={template.status === 'Published' ? 'var(--color-success)' : 'var(--text-muted)'} />
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleFeaturedTemplate(template.id)}
                      title={template.isFeatured ? 'Remove from Hero' : 'Feature in Hero'}
                      style={{ padding: '6px 10px' }}
                    >
                      <Star size={14} color={template.isFeatured ? 'var(--color-warning)' : 'var(--text-muted)'} fill={template.isFeatured ? 'var(--color-warning)' : 'none'} />
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => deleteAppTemplate(template.id)}
                      title="Delete Template"
                      style={{ padding: '6px 10px', color: 'var(--color-danger)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <LayoutTemplate size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, fontSize: '15px' }}>No Templates Found</div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              No templates match your search filter "{searchQuery}". Try selecting another category or click "Insert New Template".
            </p>
          </div>
        )
      ) : (
        /* Table View */
        <div className="card">
          <div className="table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Template Name & Category</th>
                  <th>Version</th>
                  <th>Tier</th>
                  <th>Source Bundle</th>
                  <th>App Version</th>
                  <th>App Downloads</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map((template) => (
                  <tr key={template.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            background: template.thumbnailColor,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Smartphone size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {template.name}
                            {template.isFeatured && <span title="Featured">⭐</span>}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {template.category.toUpperCase()} • By {template.author}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ fontSize: '12px', fontWeight: 600 }}>v{template.version}</td>

                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: template.tier === 'Institutional' ? '#EFF6FF' : template.tier === 'Pro' ? '#FEF3C7' : '#F1F5F9',
                          color: template.tier === 'Institutional' ? '#1E40AF' : template.tier === 'Pro' ? '#92400E' : '#334155',
                          fontSize: '11px',
                        }}
                      >
                        {template.tier}
                      </span>
                    </td>

                    <td>
                      <code style={{ fontSize: '11px', backgroundColor: 'var(--bg-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                        {template.sourceBundle || 'jo-portfolio'}
                      </code>
                    </td>

                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{template.compatibleAppVersion}</td>

                    <td>
                      <div><strong>{template.downloadsCount.toLocaleString()}</strong></div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{template.activeUsersCount.toLocaleString()} active</div>
                    </td>

                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: template.status === 'Published' ? '#ECFDF5' : '#FEF3C7',
                          color: template.status === 'Published' ? '#065F46' : '#92400E',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {template.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setPreviewTemplate(template)}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          <Smartphone size={13} />
                          <span>Preview</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => togglePublishTemplate(template.id)}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          {template.status === 'Published' ? 'Draft' : 'Publish'}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => deleteAppTemplate(template.id)}
                          style={{ color: 'var(--color-danger)', padding: '4px 8px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insert Template Modal */}
      <InsertTemplateModal
        isOpen={isInsertModalOpen}
        onClose={() => setIsInsertModalOpen(false)}
      />

      {/* Phone Simulator Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </div>
  );
};
