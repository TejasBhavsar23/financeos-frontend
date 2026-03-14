import React from 'react';
import { useFetch } from '../../hooks/useFinance';
import { dashboardService, CATEGORY_COLORS } from '../../services/api';
import { Loading, EmptyState, ProgressBar } from '../../components/common';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const chartDefaults = {
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a4', font: { family: 'DM Sans', size: 11 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a4', font: { family: 'DM Sans', size: 11 } } },
  },
  responsive: true, maintainAspectRatio: false,
};

export default function Dashboard() {
  const { data, loading, error } = useFetch(dashboardService.getSummary);

  if (loading) return <div className="page-container"><Loading text="Loading dashboard..." /></div>;
  if (error) return <div className="page-container"><EmptyState icon="⚠️" title="Failed to load" message={error} /></div>;
  if (!data) return null;

  const { totalIncomeThisMonth, totalExpensesThisMonth, totalSavingsThisMonth,
    remainingBalance, expenseByCategory, monthlySummary, upcomingBills, activeGoals } = data;

  const savingsRate = totalIncomeThisMonth > 0
    ? Math.round((totalSavingsThisMonth / totalIncomeThisMonth) * 100) : 0;

  // Bar chart – Income vs Expense
  const last6 = (monthlySummary || []).slice(-6);
  const barData = {
    labels: last6.map(m => m.month),
    datasets: [
      {
        label: 'Income',
        data: last6.map(m => m.income || 0),
        backgroundColor: 'rgba(34,201,138,0.7)',
        borderRadius: 6, borderSkipped: false,
      },
      {
        label: 'Expenses',
        data: last6.map(m => m.expenses || 0),
        backgroundColor: 'rgba(240,82,82,0.7)',
        borderRadius: 6, borderSkipped: false,
      },
    ],
  };

  // Line chart – Savings trend
  const lineData = {
    labels: last6.map(m => m.month),
    datasets: [{
      label: 'Savings',
      data: last6.map(m => m.savings || 0),
      borderColor: '#4f8ef7',
      backgroundColor: 'rgba(79,142,247,0.08)',
      borderWidth: 2,
      pointBackgroundColor: '#4f8ef7',
      pointRadius: 4,
      tension: 0.4,
      fill: true,
    }],
  };

  // Doughnut – Expense categories
  const cats = expenseByCategory || [];
  const doughnutData = {
    labels: cats.map(c => c.category),
    datasets: [{
      data: cats.map(c => c.amount),
      backgroundColor: cats.map(c => CATEGORY_COLORS[c.category] || '#64748b'),
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  return (
    <div className="page-container">
      {/* Stats */}
      <div className="grid grid-4 mb-24">
        <StatCard label="Total Income" value={totalIncomeThisMonth} type="income" icon="↑" />
        <StatCard label="Total Expenses" value={totalExpensesThisMonth} type="expense" icon="↓" />
        <StatCard label="Net Savings" value={totalSavingsThisMonth} type="savings" icon="◈" />
        <StatCard label="Savings Rate" raw={`${savingsRate}%`} type="balance" icon="%" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-2 mb-24" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <div className="card">
          <div className="card-title">Income vs Expenses — Last 6 Months</div>
          <div style={{ height: 240, marginTop: 8 }}>
            <Bar data={barData} options={{
              ...chartDefaults,
              plugins: {
                ...chartDefaults.plugins,
                legend: {
                  display: true,
                  labels: { color: '#8892a4', boxWidth: 12, font: { family: 'DM Sans', size: 11 } }
                }
              }
            }} />
          </div>
        </div>
        <div className="card">
          <div className="card-title">Expense Breakdown</div>
          {cats.length > 0 ? (
            <>
              <div style={{ height: 180, marginTop: 8 }}>
                <Doughnut data={doughnutData} options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { callbacks: {
                    label: ctx => ` ${ctx.label}: ₹${ctx.parsed.toLocaleString('en-IN')}`
                  }}}
                }} />
              </div>
              <div className="category-legend">
                {cats.slice(0, 6).map(c => (
                  <div key={c.category} className="legend-item">
                    <span className="legend-dot" style={{ background: CATEGORY_COLORS[c.category] }} />
                    <span>{c.category}</span>
                    <span className="legend-pct">{c.percentage?.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-icon">🥧</div>
              <p>No expenses this month</p>
            </div>
          )}
        </div>
      </div>

      {/* Savings trend */}
      <div className="card mb-24">
        <div className="card-title">Savings Trend</div>
        <div style={{ height: 180, marginTop: 8 }}>
          <Line data={lineData} options={chartDefaults} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-2">
        {/* Upcoming Bills */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Upcoming Bills</div>
          {upcomingBills?.length > 0 ? (
            <div className="bill-list">
              {upcomingBills.slice(0, 5).map(bill => (
                <div key={bill.id} className="bill-row">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{bill.billName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Due {new Date(bill.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {bill.daysUntilDue <= 3 && <span className="badge badge-expense" style={{ marginLeft: 6 }}>Soon</span>}
                    </div>
                  </div>
                  <span className="amount-negative" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                    ₹{bill.amount?.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <p>No upcoming bills</p>
            </div>
          )}
        </div>

        {/* Active Goals */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Active Goals</div>
          {activeGoals?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeGoals.slice(0, 4).map(goal => (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-4" style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{goal.goalName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {goal.progressPercentage?.toFixed(0)}%
                    </span>
                  </div>
                  <ProgressBar value={goal.progressPercentage || 0} max={100} variant="accent" />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    ₹{goal.savedAmount?.toLocaleString('en-IN')} of ₹{goal.targetAmount?.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <p>No active goals</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, raw, type, icon }) {
  const typeColors = { income: 'var(--success)', expense: 'var(--danger)', savings: 'var(--accent)', balance: 'var(--info)' };
  return (
    <div className={`stat-card ${type}`}>
      <div className={`stat-icon ${type}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: typeColors[type] }}>
        {raw || (value != null ? `₹${Number(value).toLocaleString('en-IN')}` : '₹0')}
      </div>
    </div>
  );
}
