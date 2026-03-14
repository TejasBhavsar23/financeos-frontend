import React, { useState } from 'react';
import { useFetch, useModal, useCurrentPeriod } from '../../hooks/useFinance';
import { expenseService, EXPENSE_CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../../services/api';
import { Loading, EmptyState, Modal, CategoryBadge, ConfirmDialog, MonthPicker } from '../../components/common';
import toast from 'react-hot-toast';

const EMPTY_FORM = { category: 'FOOD', amount: '', date: new Date().toISOString().split('T')[0], description: '' };

export default function ExpensesPage() {
  const { month, year, monthName, prevMonth, nextMonth } = useCurrentPeriod();
  const [filterCategory, setFilterCategory] = useState('');
  const { data: expenses, loading, refetch } = useFetch(
    () => expenseService.getByMonth(month, year), [month, year]
  );
  const modal = useModal();
  const deleteDialog = useModal();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filtered = (expenses || []).filter(e => !filterCategory || e.category === filterCategory);
  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const openAdd = () => { setForm(EMPTY_FORM); modal.open(); };
  const openEdit = item => {
    setForm({ category: item.category, amount: item.amount, date: item.date, description: item.description || '' });
    modal.open(item);
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async e => {
    e.preventDefault();
    if (!form.amount || !form.date) { toast.error('Amount and date required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (modal.editItem) {
        await expenseService.update(modal.editItem.id, payload);
        toast.success('Expense updated');
      } else {
        await expenseService.add(payload);
        toast.success('Expense added');
      }
      modal.close(); refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await expenseService.delete(deleteDialog.editItem.id);
      toast.success('Expense deleted');
      deleteDialog.close(); refetch();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-24" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Expenses</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
            Total: <span className="amount-negative" style={{ fontFamily: 'var(--font-mono)' }}>
              ₹{total.toLocaleString('en-IN')}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-12" style={{ flexWrap: 'wrap' }}>
          <MonthPicker month={month} year={year} onPrev={prevMonth} onNext={nextMonth} />
          <select className="form-control" style={{ width: 'auto', padding: '8px 12px' }}
            value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Expense</button>
        </div>
      </div>

      {/* Category summary chips */}
      {!loading && (expenses || []).length > 0 && (
        <div className="flex gap-8 mb-16" style={{ flexWrap: 'wrap' }}>
          {EXPENSE_CATEGORIES.filter(c => (expenses || []).some(e => e.category === c)).map(c => {
            const catTotal = (expenses || []).filter(e => e.category === c).reduce((s, e) => s + Number(e.amount), 0);
            const color = CATEGORY_COLORS[c];
            return (
              <button key={c} onClick={() => setFilterCategory(fc => fc === c ? '' : c)}
                style={{
                  padding: '4px 12px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600,
                  background: filterCategory === c ? color : color + '22',
                  color: filterCategory === c ? '#fff' : color,
                  border: `1px solid ${color}44`, cursor: 'pointer',
                  transition: 'all 0.15s'
                }}>
                {CATEGORY_ICONS[c]} {c} · ₹{catTotal.toLocaleString('en-IN')}
              </button>
            );
          })}
        </div>
      )}

      <div className="card">
        {loading ? <Loading /> : filtered.length === 0 ? (
          <EmptyState icon="🧾" title="No expenses found"
            message={filterCategory ? `No ${filterCategory} expenses this month` : `No expenses for ${monthName} ${year}`}
            action={<button className="btn btn-primary" onClick={openAdd}>Add Expense</button>}
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(exp => (
                  <tr key={exp.id}>
                    <td>
                      <div className="flex items-center gap-8">
                        <span style={{ fontSize: '1.1rem' }}>{CATEGORY_ICONS[exp.category]}</span>
                        <CategoryBadge category={exp.category} />
                      </div>
                    </td>
                    <td><span className="amount-negative font-mono">-₹{Number(exp.amount).toLocaleString('en-IN')}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 200 }} className="truncate">
                      {exp.description || '—'}
                    </td>
                    <td>
                      <div className="flex gap-8">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(exp)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteDialog.open(exp)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modal.isOpen} onClose={modal.close} title={modal.editItem ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" name="category" value={form.category} onChange={handleChange}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input className="form-control" type="number" name="amount" value={form.amount}
              onChange={handleChange} placeholder="0.00" min="0.01" step="0.01" />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-control" type="date" name="date" value={form.date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-control" name="description" value={form.description}
              onChange={handleChange} placeholder="What was this for?" />
          </div>
          <div className="flex gap-12 justify-end">
            <button type="button" className="btn btn-secondary" onClick={modal.close}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : modal.editItem ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteDialog.isOpen} onClose={deleteDialog.close} onConfirm={handleDelete}
        title="Delete Expense" message={`Delete this ₹${deleteDialog.editItem?.amount} expense?`} loading={deleting} />
    </div>
  );
}
