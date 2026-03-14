import React from 'react';
import { useFetch } from '../../hooks/useFinance';
import { incomeService, expenseService } from '../../services/api';
import { Loading } from '../../components/common';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const chartOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a4', font: { size: 11 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a4', font: { size: 11 } } },
  },
};

export default function SavingsPage() {
  const { data: incSummary, loading: incLoading } = useFetch(incomeService.getMonthlySummary);
  const { data: expSummary, loading: expLoading } = useFetch(expenseService.getMonthlySummary);

  if (incLoading || expLoading) return <div className="page-container"><Loading /></div>;

  // Build last 12 months
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mName = d.toLocaleString('en', { month: 'short' });
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const inc = (incSummary || []).find(s => s.month === mName && s.year === y);
    const exp = (expSummary || []).find(s => s.month === mName && s.year === y);
    const income = inc?.income || 0;
    const expenses = exp?.expenses || 0;
    months.push({ label: `${mName} ${y}`, income: Number(income), expenses: Number(expenses), savings: Number(income) - Number(expenses) });
  }

  const totalSaved = months.reduce((s, m) => s + Math.max(m.savings, 0), 0);
  const avgSavings = months.length ? (months.reduce((s, m) => s + m.savings, 0) / months.length) : 0;
  const bestMonth = months.reduce((best, m) => m.savings > best.savings ? m : best, months[0] || { savings: 0, label: '—' });
  const currentSavings = months[months.length - 1]?.savings || 0;
  const savingsRate = months[months.length - 1]?.income > 0
    ? ((currentSavings / months[months.length - 1].income) * 100).toFixed(1) : 0;

  const lineData = {
    labels: months.map(m => m.label.split(' ')[0]),
    datasets: [{
      data: months.map(m => m.savings),
      borderColor: m => m.raw >= 0 ? '#22c98a' : '#f05252',
      borderColor: '#4f8ef7',
      backgroundColor: 'rgba(79,142,247,0.07)',
      borderWidth: 2, tension: 0.4, fill: true,
      pointBackgroundColor: months.map(m => m.savings >= 0 ? '#22c98a' : '#f05252'),
      pointRadius: 4,
    }],
  };

  const barData = {
    labels: months.map(m => m.label.split(' ')[0]),
    datasets: [
      { label: 'Income', data: months.map(m => m.income), backgroundColor: 'rgba(34,201,138,0.6)', borderRadius: 4 },
      { label: 'Expenses', data: months.map(m => m.expenses), backgroundColor: 'rgba(240,82,82,0.6)', borderRadius: 4 },
    ],
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Savings Overview</h1>
        <p>Your 12-month savings history and trends</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-4 mb-24">
        {[
          { label: 'This Month', value: currentSavings, color: currentSavings >= 0 ? 'var(--success)' : 'var(--danger)' },
          { label: 'Savings Rate', value: null, raw: `${savingsRate}%`, color: 'var(--accent)' },
          { label: 'Avg Monthly', value: avgSavings, color: 'var(--info)' },
          { label: 'Best Month', value: null, raw: bestMonth.label?.split(' ')[0], sub: `₹${Number(bestMonth.savings).toLocaleString('en-IN')}`, color: 'var(--warning)' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: '1.5rem' }}>
              {s.raw || `₹${Number(s.value).toLocaleString('en-IN')}`}
            </div>
            {s.sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Savings Trend */}
      <div className="card mb-24">
        <div className="card-title">Savings Trend — Monthly Net</div>
        <div style={{ height: 220, marginTop: 12 }}>
          <Line data={lineData} options={chartOpts} />
        </div>
      </div>

      {/* Income vs Expenses */}
      <div className="card mb-24">
        <div className="card-title">Income vs Expenses</div>
        <div style={{ height: 220, marginTop: 12 }}>
          <Bar data={barData} options={{ ...chartOpts, plugins: { legend: { display: true, labels: { color: '#8892a4', font: { size: 11 } } } } }} />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>Monthly Breakdown</div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>Savings</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {[...months].reverse().map((m, i) => {
                const rate = m.income > 0 ? ((m.savings / m.income) * 100).toFixed(1) : '—';
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{m.label}</td>
                    <td className="amount-positive font-mono">₹{m.income.toLocaleString('en-IN')}</td>
                    <td className="amount-negative font-mono">₹{m.expenses.toLocaleString('en-IN')}</td>
                    <td className={m.savings >= 0 ? 'amount-positive font-mono' : 'amount-negative font-mono'}>
                      {m.savings >= 0 ? '+' : ''}₹{m.savings.toLocaleString('en-IN')}
                    </td>
                    <td style={{ color: m.savings >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
                      {rate !== '—' ? `${rate}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
