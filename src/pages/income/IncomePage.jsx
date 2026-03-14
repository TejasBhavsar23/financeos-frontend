import React, { useState } from 'react';
import { useFetch, useModal, useCurrentPeriod } from '../../hooks/useFinance';
import { incomeService, INCOME_SOURCES, SOURCE_ICONS, formatCurrency } from '../../services/api';
import { Loading, EmptyState, Modal, CategoryBadge, ConfirmDialog, MonthPicker } from '../../components/common';
import toast from 'react-hot-toast';

const EMPTY_FORM = { source: 'SALARY', amount: '', date: new Date().toISOString().split('T')[0], notes: '' };

export default function IncomePage() {
  const { month, year, monthName, prevMonth, nextMonth } = useCurrentPeriod();
  const { data: incomes, loading, refetch } = useFetch(
    () => incomeService.getByMonth(month, year), [month, year]
  );
  const modal = useModal();
  const deleteDialog = useModal();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const totalIncome = (incomes || []).reduce((s, i) => s + Number(i.amount), 0);

  const openAdd = () => { setForm(EMPTY_FORM); modal.open(); };
  const openEdit = (item) => {
    setForm({ source: item.source, amount: item.amount, date: item.date, notes: item.notes || '' });
    modal.open(item);
  };
  const openDelete = (item) => deleteDialog.open(item);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async e => {
    e.preventDefault();
    if (!form.amount || !form.date) { toast.error('Amount and date are required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (modal.editItem) {
        await incomeService.update(modal.editItem.id, payload);
        toast.success('Income updated');
      } else {
        await incomeService.add(payload);
        toast.success('Income added');
      }
      modal.close();
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await incomeService.delete(deleteDialog.editItem.id);
      toast.success('Income deleted');
      deleteDialog.close();
      refetch();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-24">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Income</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
            Total: <span className="amount-positive" style={{ fontFamily: 'var(--font-mono)' }}>
              ₹{totalIncome.toLocaleString('en-IN')}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-16">
          <MonthPicker month={month} year={year} onPrev={prevMonth} onNext={nextMonth} />
          <button className="btn btn-primary" onClick={openAdd}>+ Add Income</button>
        </div>
      </div>

      <div className="card">
        {loading ? <Loading /> : (incomes || []).length === 0 ? (
          <EmptyState icon="💰" title="No income recorded"
            message={`No income found for ${monthName} ${year}`}
            action={<button className="btn btn-primary" onClick={openAdd}>Add Income</button>}
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(incomes || []).map(inc => (
                  <tr key={inc.id}>
                    <td>
                      <div className="flex items-center gap-8">
                        <span style={{ fontSize: '1.1rem' }}>{SOURCE_ICONS[inc.source]}</span>
                        <CategoryBadge category={inc.source} />
                      </div>
                    </td>
                    <td><span className="amount-positive font-mono">+₹{Number(inc.amount).toLocaleString('en-IN')}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(inc.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 200 }} className="truncate">
                      {inc.notes || '—'}
                    </td>
                    <td>
                      <div className="flex gap-8">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(inc)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => openDelete(inc)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal.isOpen} onClose={modal.close} title={modal.editItem ? 'Edit Income' : 'Add Income'}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Source</label>
            <select className="form-control" name="source" value={form.source} onChange={handleChange}>
              {INCOME_SOURCES.map(s => (
                <option key={s} value={s}>{SOURCE_ICONS[s]} {s}</option>
              ))}
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
            <label className="form-label">Notes (Optional)</label>
            <input className="form-control" name="notes" value={form.notes} onChange={handleChange} placeholder="Any notes..." />
          </div>
          <div className="flex gap-12 justify-end">
            <button type="button" className="btn btn-secondary" onClick={modal.close}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : modal.editItem ? 'Update' : 'Add Income'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={handleDelete}
        title="Delete Income"
        message={`Delete this income entry of ₹${deleteDialog.editItem?.amount}?`}
        loading={deleting}
      />
    </div>
  );
}
