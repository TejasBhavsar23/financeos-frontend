import React, { useState } from 'react';
import { expenseService, incomeService, CATEGORY_COLORS } from '../../services/api';
import { Loading } from '../../components/common';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const monthName = new Date(year, month - 1).toLocaleString('en', { month: 'long' });

  const generateReport = async () => {
    setLoading(true);
    try {
      const [incRes, expRes] = await Promise.all([
        incomeService.getByMonth(month, year),
        expenseService.getByMonth(month, year),
      ]);
      const incomes = incRes.data.data || [];
      const expenses = expRes.data.data || [];

      const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
      const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

      // Group by category
      const catMap = {};
      expenses.forEach(e => {
        catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
      });

      setData({ incomes, expenses, totalIncome, totalExpenses, catMap });
    } catch { toast.error('Failed to generate report'); }
    finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Type', 'Category/Source', 'Amount', 'Date', 'Description/Notes'],
      ...data.incomes.map(i => ['Income', i.source, i.amount, i.date, i.notes || '']),
      ...data.expenses.map(e => ['Expense', e.category, e.amount, e.date, e.description || '']),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${monthName}-${year}.csv`;
    a.click();
    toast.success('CSV downloaded!');
  };

  const cats = data ? Object.entries(data.catMap).sort((a, b) => b[1] - a[1]) : [];
  const doughnutData = {
    labels: cats.map(([c]) => c),
    datasets: [{ data: cats.map(([, v]) => v), backgroundColor: cats.map(([c]) => CATEGORY_COLORS[c] || '#64748b'), borderWidth: 0 }],
  };
  const barData = {
    labels: cats.map(([c]) => c),
    datasets: [{ data: cats.map(([, v]) => v), backgroundColor: cats.map(([c]) => (CATEGORY_COLORS[c] || '#64748b') + 'bb'), borderRadius: 6 }],
  };

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const YEARS = [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear()];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <p>Generate detailed financial reports for any month</p>
      </div>

      {/* Controls */}
      <div className="card mb-24">
        <div className="flex items-center gap-16" style={{ flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select className="form-control" style={{ width: 'auto' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="form-control" style={{ width: 'auto' }} value={year} onChange={e => setYear(Number(e.target.value))}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={generateReport} disabled={loading}>
            {loading ? 'Generating...' : '▣ Generate Report'}
          </button>
          {data && (
            <button className="btn btn-secondary" onClick={exportCSV}>↓ Export CSV</button>
          )}
        </div>
      </div>

      {loading && <Loading text="Generating report..." />}

      {data && !loading && (
        <>
          {/* Summary */}
          <div className="grid grid-3 mb-24">
            <div className="stat-card income">
              <div className="stat-label">Total Income</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>₹{data.totalIncome.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{data.incomes.length} transactions</div>
            </div>
            <div className="stat-card expense">
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>₹{data.totalExpenses.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{data.expenses.length} transactions</div>
            </div>
            <div className="stat-card savings">
              <div className="stat-label">Net Savings</div>
              <div className="stat-value" style={{ color: (data.totalIncome - data.totalExpenses) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                ₹{(data.totalIncome - data.totalExpenses).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {data.totalIncome > 0 ? `${(((data.totalIncome - data.totalExpenses) / data.totalIncome) * 100).toFixed(1)}% rate` : '—'}
              </div>
            </div>
          </div>

          {/* Charts */}
          {cats.length > 0 && (
            <div className="grid grid-2 mb-24">
              <div className="card">
                <div className="card-title">Category Distribution</div>
                <div style={{ height: 240, marginTop: 8 }}>
                  <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#8892a4', font: { size: 11 } } } } }} />
                </div>
              </div>
              <div className="card">
                <div className="card-title">Spending by Category</div>
                <div style={{ height: 240, marginTop: 8 }}>
                  <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a4' } }, y: { grid: { display: false }, ticks: { color: '#8892a4', font: { size: 11 } } } } }} />
                </div>
              </div>
            </div>
          )}

          {/* Category table */}
          {cats.length > 0 && (
            <div className="card mb-24">
              <div className="card-title" style={{ marginBottom: 16 }}>Category Breakdown</div>
              <table className="table">
                <thead><tr><th>Category</th><th>Amount</th><th>% of Total</th><th>Transactions</th></tr></thead>
                <tbody>
                  {cats.map(([cat, amt]) => {
                    const pct = data.totalExpenses > 0 ? ((amt / data.totalExpenses) * 100).toFixed(1) : 0;
                    const txns = data.expenses.filter(e => e.category === cat).length;
                    const color = CATEGORY_COLORS[cat] || '#64748b';
                    return (
                      <tr key={cat}>
                        <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
                          {cat}
                        </span></td>
                        <td className="font-mono">₹{Number(amt).toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{pct}%</td>
                        <td style={{ color: 'var(--text-muted)' }}>{txns}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Transaction list */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>All Transactions — {monthName} {year}</div>
            <table className="table">
              <thead><tr><th>Date</th><th>Type</th><th>Category/Source</th><th>Amount</th><th>Note</th></tr></thead>
              <tbody>
                {[
                  ...data.incomes.map(i => ({ ...i, type: 'income', category: i.source, note: i.notes })),
                  ...data.expenses.map(e => ({ ...e, type: 'expense', note: e.description })),
                ].sort((a, b) => new Date(b.date) - new Date(a.date)).map((t, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td>
                      <span className={`badge ${t.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                        {t.type === 'income' ? '↑' : '↓'} {t.type}
                      </span>
                    </td>
                    <td>{t.category}</td>
                    <td className={t.type === 'income' ? 'amount-positive font-mono' : 'amount-negative font-mono'}>
                      {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!data && !loading && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">▣</div>
            <h3>Select a period and generate a report</h3>
            <p>Choose a month and year above, then click Generate Report</p>
          </div>
        </div>
      )}
    </div>
  );
}
