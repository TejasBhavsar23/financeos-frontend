import React from 'react';
import { formatCurrency } from '../../services/api';

// ── Modal ────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: size === 'lg' ? 640 : size === 'sm' ? 360 : 480 }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── EmptyState ───────────────────────────────────────────────
export function EmptyState({ icon = '📭', title = 'Nothing here yet', message = 'Add something to get started', action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

// ── Loading ──────────────────────────────────────────────────
export function Loading({ text = 'Loading...' }) {
  return (
    <div className="loading-spinner" style={{ flexDirection: 'column', gap: 12 }}>
      <div className="spinner" />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{text}</span>
    </div>
  );
}

// ── ProgressBar ──────────────────────────────────────────────
export function ProgressBar({ value, max = 100, variant }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = variant || (pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : 'safe');
  return (
    <div className="progress-bar-wrapper">
      <div className={`progress-bar-fill ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────
export function Badge({ label, variant = 'neutral' }) {
  return <span className={`badge badge-${variant}`}>{label}</span>;
}

// ── AmountDisplay ────────────────────────────────────────────
export function AmountDisplay({ amount, type = 'neutral', currency = 'INR' }) {
  const cls = type === 'income' ? 'amount-positive' : type === 'expense' ? 'amount-negative' : 'amount-neutral';
  const prefix = type === 'income' ? '+' : type === 'expense' ? '-' : '';
  return <span className={cls}>{prefix}{formatCurrency(Math.abs(amount || 0), currency)}</span>;
}

// ── CategoryBadge ────────────────────────────────────────────
const COLORS = {
  FOOD: '#f5a623', RENT: '#f05252', TRANSPORT: '#4f8ef7',
  SHOPPING: '#9b87f5', ENTERTAINMENT: '#22c98a', BILLS: '#fb923c',
  EMI: '#e11d48', HEALTH: '#06b6d4', EDUCATION: '#8b5cf6', OTHER: '#64748b',
  SALARY: '#22c98a', FREELANCE: '#4f8ef7', BONUS: '#f5a623',
  INVESTMENT: '#9b87f5', RENTAL: '#06b6d4', BUSINESS: '#fb923c',
};

export function CategoryBadge({ category }) {
  const color = COLORS[category] || '#64748b';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 100,
      fontSize: '0.72rem', fontWeight: 600,
      background: color + '22', color,
      border: `1px solid ${color}33`,
    }}>
      {category}
    </span>
  );
}

// ── ConfirmDialog ────────────────────────────────────────────
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{message}</p>
        <div className="flex gap-12 justify-end">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MonthPicker ──────────────────────────────────────────────
export function MonthPicker({ month, year, onPrev, onNext }) {
  const monthName = new Date(year, month - 1).toLocaleString('en', { month: 'long' });
  return (
    <div className="flex items-center gap-12">
      <button className="btn btn-secondary btn-sm btn-icon" onClick={onPrev}>‹</button>
      <span style={{ fontWeight: 600, minWidth: 120, textAlign: 'center', fontSize: '0.9rem' }}>
        {monthName} {year}
      </span>
      <button className="btn btn-secondary btn-sm btn-icon" onClick={onNext}>›</button>
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────
export function StatCard({ label, value, icon, type = '', currency = 'INR', subtitle }) {
  return (
    <div className={`stat-card ${type}`}>
      <div className={`stat-icon ${type}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{formatCurrency(value || 0, currency)}</div>
      {subtitle && <div className="stat-change">{subtitle}</div>}
    </div>
  );
}

// ── SectionHeader ────────────────────────────────────────────
export function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-16">
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
      {action}
    </div>
  );
}
