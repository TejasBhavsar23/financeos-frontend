import React, { useState } from 'react';
import { useFetch, useModal, useCurrentPeriod } from '../../hooks/useFinance';
import { budgetService, EXPENSE_CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../../services/api';
import { Loading, EmptyState, Modal, ConfirmDialog, MonthPicker } from '../../components/common';
import toast from 'react-hot-toast';

const EMPTY_FORM = { category: 'FOOD', monthlyLimit: '' };

export default function BudgetPage() {
  const { month, year, prevMonth, nextMonth } = useCurrentPeriod();
  const { data: budgets, loading, refetch } = useFetch(
    () => budgetService.getByMonth(month, year), [month, year]
  );
  const modal = useModal();
  const deleteDialog = useModal();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openAdd = () => {
    const existingCats = (budgets || []).map(b => b.category);
    const available = EXPENSE_CATEGORIES.filter(c => !existingCats.includes(c));
    setForm({ category: available[0] || 'OTHER', monthlyLimit: '', month, year });
    modal.open();
  };
  const openEdit = item => {
    setForm({ category: item.category, monthlyLimit: item.monthlyLimit, month, year });
    modal.open(item);
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async e => {
    e.preventDefault();
    if (!form.monthlyLimit) { toast.error('Please enter a budget limit'); return; }
    setSaving(true);
    try {
      await budgetService.createOrUpdate({ ...form, monthlyLimit: parseFloat(form.monthlyLimit), month, year });
      toast.success('Budget saved');
      modal.close(); refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await budgetService.delete(deleteDialog.editItem.id);
      toast.success('Budget deleted');
      deleteDialog.close(); refetch();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const totalBudget = (budgets || []).reduce((s, b) => s + Number(b.monthlyLimit), 0);
  const totalSpent = (budgets || []).reduce((s, b) => s + Number(b.spent || 0), 0);

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-24" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Budget</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
            ₹{totalSpent.toLocaleString('en-IN')} spent of ₹{totalBudget.toLocaleString('en-IN')} budgeted
          </p>
        </div>
        <div className="flex items-center gap-16">
          <MonthPicker month={month} year={year} onPrev={prevMonth} onNext={nextMonth} />
          <button className="btn btn-primary" onClick={openAdd}>+ Set Budget</button>
        </div>
      </div>

      {loading ? <Loading /> : (budgets || []).length === 0 ? (
        <div className="card">
          <EmptyState icon="◫" title="No budgets set"
            message="Set monthly spending limits per category"
            action={<button className="btn btn-primary" onClick={openAdd}>Set Budget</button>}
          />
        </div>
      ) : (
        <div className="grid grid-2">
          {(budgets || []).map(budget => {
            const color = CATEGORY_COLORS[budget.category] || '#64748b';
            const pct = budget.percentageUsed || 0;
            const barColor = pct >= 90 ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : 'var(--success)';
            return (
              <div key={budget.id} className="card" style={{ borderLeft: `3px solid ${color}` }}>
                <div className="flex items-center justify-between mb-16">
                  <div className="flex items-center gap-12">
                    <span style={{ fontSize: '1.4rem' }}>{CATEGORY_ICONS[budget.category]}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{budget.category}</div>
                      {budget.isExceeded && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 600 }}>
                          ⚠ Over budget by ₹{Math.abs(budget.remaining).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-8">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(budget)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteDialog.open(budget)}>✕</button>
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ₹{Number(budget.spent || 0).toLocaleString('en-IN')} spent
                    </span>
                    <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: pct >= 90 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="progress-bar-wrapper">
                    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: 100, transition: 'width 0.6s' }} />
                  </div>
                </div>

                <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Monthly limit</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.95rem' }}>
                    ₹{Number(budget.monthlyLimit).toLocaleString('en-IN')}
                  </span>
                </div>
                {!budget.isExceeded && (
                  <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Remaining</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--success)', fontSize: '0.875rem' }}>
                      ₹{Number(budget.remaining || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modal.isOpen} onClose={modal.close} title={modal.editItem ? 'Edit Budget' : 'Set Budget'}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" name="category" value={form.category} onChange={handleChange}
              disabled={!!modal.editItem}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Monthly Limit (₹)</label>
            <input className="form-control" type="number" name="monthlyLimit" value={form.monthlyLimit}
              onChange={handleChange} placeholder="5000" min="1" step="1" />
          </div>
          <div className="flex gap-12 justify-end">
            <button type="button" className="btn btn-secondary" onClick={modal.close}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteDialog.isOpen} onClose={deleteDialog.close} onConfirm={handleDelete}
        title="Delete Budget" message="Remove this budget limit?" loading={deleting} />
    </div>
  );
}
