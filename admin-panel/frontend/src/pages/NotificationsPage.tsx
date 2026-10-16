import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useRouter } from '../router/Router';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Search,
  Filter,
  Check,
  Trash2,
  ArrowRight,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotification,
  } = useAdmin();

  const { navigate } = useRouter();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [filterRead, setFilterRead] = useState<'All' | 'Unread' | 'Read'>('All');
  const [search, setSearch] = useState('');

  const categories = ['All', 'Provisioning', 'Quota', 'Agreement', 'College', 'Security'];

  const filtered = notifications.filter((n) => {
    const matchesCat = activeCategory === 'All' || n.category === activeCategory;
    const matchesRead = filterRead === 'All' || (filterRead === 'Unread' ? !n.isRead : n.isRead);
    const matchesSearch =
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase());

    return matchesCat && matchesRead && matchesSearch;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>
            <Bell size={26} color="var(--bexo-blue-600)" />
            <span>Notification & Operational Alerts Center</span>
          </h1>
          <p>
            Platform event logs, automated quota threshold warnings, agreement expiry milestones, and security notices.
          </p>
        </div>

        <div className="page-actions-group">
          <button className="btn btn-secondary btn-sm" onClick={markAllNotificationsAsRead}>
            <Check size={14} /> Mark All as Read
          </button>
        </div>
      </div>

      {/* Filter and Category Pills */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveCategory(cat)}
              style={{ fontSize: '12px', padding: '4px 10px' }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            id="notifications-read-filter"
            name="readFilter"
            className="form-select"
            style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value as any)}
          >
            <option value="All">All Read States</option>
            <option value="Unread">Unread Only</option>
            <option value="Read">Read Only</option>
          </select>

          <input
            id="notifications-search-input"
            name="searchQuery"
            type="text"
            className="form-input"
            style={{ width: '200px', padding: '5px 10px', fontSize: '12px' }}
            placeholder="Search alerts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={36} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontWeight: 700, fontSize: '15px' }}>No notifications found</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>All operational alerts have been acknowledged.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((n) => {
              let Icon = Info;
              let iconColor = 'var(--bexo-blue-600)';
              let bg = '#F0F9FF';
              if (n.severity === 'error') {
                Icon = XCircle;
                iconColor = 'var(--color-danger)';
                bg = '#FEF2F2';
              } else if (n.severity === 'warning') {
                Icon = AlertTriangle;
                iconColor = 'var(--color-warning)';
                bg = '#FFFBEB';
              } else if (n.severity === 'success') {
                Icon = CheckCircle2;
                iconColor = 'var(--color-success)';
                bg = '#ECFDF5';
              }

              return (
                <div
                  key={n.id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: n.isRead ? 'transparent' : bg,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'background 120ms',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: iconColor,
                        flexShrink: 0,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      }}
                    >
                      <Icon size={18} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                          {n.title}
                        </span>
                        <span className="status-badge" style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '10.5px' }}>
                          {n.category}
                        </span>
                        {!n.isRead && (
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--bexo-blue-600)' }} />
                        )}
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {n.message}
                      </p>

                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        {new Date(n.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {n.actionUrl && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11.5px', padding: '3px 8px' }}
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          navigate(n.actionUrl!);
                        }}
                      >
                        <span>Take Action</span>
                        <ArrowRight size={12} />
                      </button>
                    )}

                    {!n.isRead && (
                      <button
                        className="icon-btn"
                        style={{ width: '28px', height: '28px' }}
                        title="Mark as Read"
                        onClick={() => markNotificationAsRead(n.id)}
                      >
                        <Check size={13} />
                      </button>
                    )}

                    <button
                      className="icon-btn"
                      style={{ width: '28px', height: '28px' }}
                      title="Clear Notification"
                      onClick={() => clearNotification(n.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
