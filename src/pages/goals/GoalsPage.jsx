import React, { useState } from 'react';
import { useFetch, useModal } from '../../hooks/useFinance';
import { goalService } from '../../services/api';
import { Loading, EmptyState, Modal, ConfirmDialog } from '../../components/common';
import toast from 'react-hot-toast';

const today = new Date().toISOString().split('T')[0];
const EMPTY_FORM = { goalName: '', targetAmount: '', savedAmount: '', deadline: today, description: '' };

export default function GoalsPage() {
  const { data: goals, loading, refetch } = useFetch(goalService.getAll);
  const modal = useModal();
  const deleteDialog = useModal();
  const contributeDialog = useModal();
  const [form, setForm] = useState(EMPTY_FORM);
  const [contribution, setContribution] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const active = (goals || []).filter(g => !g.isCompleted);
  const completed = (goals || []).filter(g => g.isCompleted);

  const openAdd = () => { setForm(EMPTY_FORM); modal.open(); };
  const openEdit = item => {
    setForm({
      goalName: item.goalName, targetAmount: item.targetAmount,
      savedAmount: item.savedAmount, deadline: item.deadline, description: item.description || ''
    });
    modal.open(item);
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async e => {
    e.preventDefault();
    if (!form.goalName || !form.targetAmount || !form.deadline) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        targetAmount: parseFloat(form.targetAmount),
        savedAmount: form.savedAmount ? parseFloat(form.savedAmount) : 0,
      };
      if (modal.editItem) {
        await goalService.update(modal.editItem.id, payload);
        toast.success('Goal updated');
      } else {
        await goalService.create(payload);
        toast.success('Goal created!');
      }
      modal.close(); refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleContribute = async () => {
    if (!contribution || parseFloat(contribution) <= 0) { toast.error('Enter valid amount'); return; }
    setSaving(true);
    try {
      await goalService.contribute(contributeDialog.editItem.id, contribution);
      toast.success(`₹${contribution} added to goal!`);
      setContribution('');
      contributeDialog.close(); refetch();
    } catch { toast.error('Failed to contribute'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await goalService.delete(deleteDialog.editItem.id);
      toast.success('Goal deleted');
      deleteDialog.close(); refetch();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const daysLeft = (deadline) => {
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return <span style={{ color: 'var(--danger)' }}>Overdue</span>;
    if (diff === 0) return <span style={{ color: 'var(--warning)' }}>Today!</span>;
    return <span>{diff} days left</span>;
  };

  const GoalCard = ({ goal }) => {
    const pct = goal.progressPercentage || 0;
    const barColor = pct >= 100 ? 'var(--success)' : pct >= 60 ? 'var(--accent)' : 'var(--info)';
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-16">
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{goal.goalName}</div>
            {goal.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{goal.description}</div>}
          </div>
          {goal.isCompleted
            ? <span className="badge badge-income">✓ Completed</span>
            : <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{daysLeft(goal.deadline)}</span>
          }
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              ₹{Number(goal.savedAmount).toLocaleString('en-IN')} saved
            </span>
            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {pct.toFixed(0)}%
            </span>
          </div>
          <div className="progress-bar-wrapper">
            <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: 100, transition: 'width 0.6s' }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Target: ₹{Number(goal.targetAmount).toLocaleString('en-IN')} · Due: {new Date(goal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        <div className="flex gap-8 justify-end">
          {!goal.isCompleted && (
            <button className="btn btn-success btn-sm" onClick={() => { setContribution(''); contributeDialog.open(goal); }}>
              + Contribute
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(goal)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={() => deleteDialog.open(goal)}>Delete</button>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-24">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Financial Goals</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
            {active.length} active · {completed.length} completed
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ New Goal</button>
      </div>

      {loading ? <Loading /> : (goals || []).length === 0 ? (
        <div className="card">
          <EmptyState icon="◎" title="No goals yet" message="Set a financial goal and track your progress"
            action={<button className="btn btn-primary" onClick={openAdd}>Create Goal</button>} />
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Active Goals</h3>
              <div className="grid grid-2 mb-24">
                {active.map(g => <GoalCard key={g.id} goal={g} />)}
              </div>
            </>
          )}
          {completed.length > 0 && (
            <>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Completed</h3>
              <div className="grid grid-2">
                {completed.map(g => <GoalCard key={g.id} goal={g} />)}
              </div>
            </>
          )}
        </>
      )}

      <Modal isOpen={modal.isOpen} onClose={modal.close} title={modal.editItem ? 'Edit Goal' : 'New Goal'}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Goal Name *</label>
            <input className="form-control" name="goalName" value={form.goalName} onChange={handleChange} placeholder="e.g. Emergency Fund" />
          </div>
          <div className="grid grid-2" style={{ gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Target Amount (₹) *</label>
              <input className="form-control" type="number" name="targetAmount" value={form.targetAmount} onChange={handleChange} placeholder="100000" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Already Saved (₹)</label>
              <input className="form-control" type="number" name="savedAmount" value={form.savedAmount} onChange={handleChange} placeholder="0" />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Deadline *</label>
            <input className="form-control" type="date" name="deadline" value={form.deadline} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-control" name="description" value={form.description} onChange={handleChange} placeholder="What is this goal for?" />
          </div>
          <div className="flex gap-12 justify-end">
            <button type="button" className="btn btn-secondary" onClick={modal.close}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : modal.editItem ? 'Update' : 'Create Goal'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={contributeDialog.isOpen} onClose={contributeDialog.close} title={`Add to: ${contributeDialog.editItem?.goalName}`} size="sm">
        <div className="form-group">
          <label className="form-label">Contribution Amount (₹)</label>
          <input className="form-control" type="number" value={contribution} onChange={e => setContribution(e.target.value)} placeholder="1000" min="1" step="1" autoFocus />
        </div>
        <div className="flex gap-12 justify-end">
          <button className="btn btn-secondary" onClick={contributeDialog.close}>Cancel</button>
          <button className="btn btn-primary" onClick={handleContribute} disabled={saving}>
            {saving ? 'Adding...' : 'Add Contribution'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={deleteDialog.isOpen} onClose={deleteDialog.close} onConfirm={handleDelete}
        title="Delete Goal" message={`Delete goal "${deleteDialog.editItem?.goalName}"?`} loading={deleting} />
    </div>
  );
}
