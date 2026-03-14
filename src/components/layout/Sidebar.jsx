import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { path: '/income', icon: '↑', label: 'Income' },
  { path: '/expenses', icon: '↓', label: 'Expenses' },
  { path: '/budget', icon: '◫', label: 'Budget' },
  { path: '/savings', icon: '◈', label: 'Savings' },
  { path: '/goals', icon: '◎', label: 'Goals' },
  { path: '/bills', icon: '◷', label: 'Bills & EMI' },
  { path: '/reports', icon: '▣', label: 'Reports' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark">₹</div>
          <div>
            <div className="logo-name">FinanceOS</div>
            <div className="logo-tagline">Personal Finance</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">MAIN MENU</div>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {location.pathname === item.path && <span className="nav-indicator" />}
            </NavLink>
          ))}

          <div className="nav-section-label" style={{ marginTop: '16px' }}>ACCOUNT</div>
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <span className="nav-icon">◉</span>
            <span className="nav-label">Profile</span>
          </NavLink>
        </nav>

        {/* User card */}
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{user?.fullName?.[0] || 'U'}</div>
            <div className="user-info">
              <div className="user-name">{user?.fullName || 'User'}</div>
              <div className="user-email">{user?.email || ''}</div>
            </div>
            <button className="logout-btn" onClick={logout} title="Logout">⏻</button>
          </div>
        </div>
      </aside>
    </>
  );
}
