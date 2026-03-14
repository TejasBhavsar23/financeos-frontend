import React from 'react';
import { useLocation } from 'react-router-dom';
import './Topbar.css';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your financial overview' },
  '/income': { title: 'Income', subtitle: 'Track your earnings' },
  '/expenses': { title: 'Expenses', subtitle: 'Monitor your spending' },
  '/budget': { title: 'Budget', subtitle: 'Manage monthly limits' },
  '/savings': { title: 'Savings', subtitle: 'Track your savings' },
  '/goals': { title: 'Goals', subtitle: 'Financial goals progress' },
  '/bills': { title: 'Bills & EMI', subtitle: 'Upcoming payments' },
  '/reports': { title: 'Reports', subtitle: 'Analytics & insights' },
  '/profile': { title: 'Profile', subtitle: 'Manage your account' },
};

export default function Topbar({ onMenuToggle }) {
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: 'FinanceOS', subtitle: '' };
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          <span /><span /><span />
        </button>
        <div className="page-title-block">
          <h2 className="topbar-title">{page.title}</h2>
          <span className="topbar-subtitle">{page.subtitle}</span>
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-date">{dateStr}</div>
      </div>
    </header>
  );
}
