import React, { useState } from 'react';
import { useFetch, useModal } from '../../hooks/useFinance';
import { billService, BILL_CATEGORIES } from '../../services/api';
import { Loading, EmptyState, Modal, ConfirmDialog, CategoryBadge } from '../../components/common';
import toast from 'react-hot-toast';

const today = new Date().toISOString().split('T')[0];
const EMPTY_FORM = { billName: '', amount: '', dueDate: today, recurring: false, recurringType: '', category: 'OTHER', notes: '' };

export default function BillsPage() {
  const { data: bills, loading, refetch } = useFetch(billService.getAll);
  const modal = useModal();
  const deleteDialog = useModal();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState('upcoming'); // upcoming | all | overdue

  const allBills = bills || [];
  const unpaid = allBills.filter(b => !b.isPaid);
  const overdue = unpaid.filter(b => b.isOverdue);
  const upcoming = unpaid.filter(b => !b.isOverdue && b.daysUntilDue <= 30);
  const paid = allBills.filter(b => b.isPaid);

  const displayBills = tab === 'upcoming' ? [...overdue, ...upcoming]
    : tab === 'overdue' ? overdue
    : tab === 'paid' ? paid
    : allBills;

  const totalUpcoming = unpaid.reduce((s, b) => s + Number(b.amount), 0);

  const openAdd = () => { setForm(EMPTY_FORM); modal.open(); };
  const openEdit = item => {
    setForm({
      billName: item.billName, amount: item.amount, dueDate: item.dueDate,
      recurring: item.recurring || false, recurringType: item.recurringType || '',
      category: item.category || 'OTHER', notes: item.notes || ''
    });
    modal.open(item);
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.billName || !form.amount || !form.dueDate) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount), recurringType: form.recurringType || null };
      if (modal.editItem) {
        await billService.update(modal.editItem.id, payload);
        toast.success('Bill updated');
      } else {
        await billService.create(payload);
        toast.success('Bill added');
      }
      modal.close(); refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleMarkPaid = async (id) => {
    try {
      await billService.markPaid(id);
      toast.success('Bill marked as paid ✓');
      refetch();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await billService.delete(deleteDialog.editItem.id);
      toast.success('Bill deleted');
      deleteDialog.close(); refetch();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const getDueBadge = (bill) => {
    if (bill.isOverdue) return <span className="badge badge-expense">Overdue</span>;
    if (bill.daysUntilDue <= 3) return <span className="badge badge-warning">Due Soon</span>;
    if (bill.daysUntilDue <= 7) return <span style={{ color: 'var(--warning)', fontSize: '0.75rem' }}>{bill.daysUntilDue}d</span>;
    return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{bill.daysUntilDue}d</span>;
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-24">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Bills & EMI</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
            {overdue.length > 0 && <span style={{ color: 'var(--danger)', marginRight: 8 }}>⚠ {overdue.length} overdue</span>}
            ₹{totalUpcoming.toLocaleString('en-IN')} unpaid total
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Bill</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-20">
        {[['upcoming', 'Upcoming'], ['overdue', 'Overdue'], ['paid', 'Paid'], ['all', 'All']].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)}
            className={`btn btn-sm ${tab === val ? 'btn-primary' : 'btn-secondary'}`}
            style={val === 'overdue' && overdue.length > 0 ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : {}}>
            {label}{val === 'overdue' && overdue.length > 0 ? ` (${overdue.length})` : ''}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? <Loading /> : displayBills.length === 0 ? (
          <EmptyState icon="◷" title="No bills here" message="Manage your recurring payments and EMIs"
            action={<button className="btn btn-primary" onClick={openAdd}>Add Bill</button>} />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill Name</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayBills.map(bill => (
                  <tr key={bill.id} style={bill.isOverdue ? { background: 'rgba(240,82,82,0.04)' } : {}}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{bill.billName}</div>
                      {bill.recurring && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>↺ {bill.recurringType}</div>
                      )}
                    </td>
                    <td><span className="font-mono">₹{Number(bill.amount).toLocaleString('en-IN')}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <div>{new Date(bill.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      {!bill.isPaid && getDueBadge(bill)}
                    </td>
                    <td><CategoryBadge category={bill.category} /></td>
                    <td>
                      {bill.isPaid
                        ? <span className="badge badge-income">✓ Paid</span>
                        : bill.isOverdue
                        ? <span className="badge badge-expense">Overdue</span>
                        : <span className="badge badge-neutral">Pending</span>
                      }
                    </td>
                    <td>
                      <div className="flex gap-8">
                        {!bill.isPaid && (
                          <button className="btn btn-success btn-sm" onClick={() => handleMarkPaid(bill.id)}>✓ Pay</button>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(bill)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteDialog.open(bill)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modal.isOpen} onClose={modal.close} title={modal.editItem ? 'Edit Bill' : 'Add Bill'}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Bill Name *</label>
            <input className="form-control" name="billName" value={form.billName} onChange={handleChange} placeholder="e.g. Electricity Bill" />
          </div>
          <div className="grid grid-2" style={{ gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Amount (₹) *</label>
              <input className="form-control" type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="1000" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Due Date *</label>
              <input className="form-control" type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Category</label>
            <select className="form-control" name="category" value={form.category} onChange={handleChange}>
              {BILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" name="recurring" checked={form.recurring} onChange={handleChange} style={{ width: 16, height: 16 }} />
              <span className="form-label" style={{ margin: 0 }}>Recurring Bill</span>
            </label>
          </div>
          {form.recurring && (
            <div className="form-group">
              <label className="form-label">Recurring Type</label>
              <select className="form-control" name="recurringType" value={form.recurringType} onChange={handleChange}>
                <option value="">Select...</option>
                {['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-control" name="notes" value={form.notes} onChange={handleChange} placeholder="Additional notes..." />
          </div>
          <div className="flex gap-12 justify-end">
            <button type="button" className="btn btn-secondary" onClick={modal.close}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : modal.editItem ? 'Update' : 'Add Bill'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteDialog.isOpen} onClose={deleteDialog.close} onConfirm={handleDelete}
        title="Delete Bill" message={`Delete "${deleteDialog.editItem?.billName}"?`} loading={deleting} />
    </div>
  );
}
