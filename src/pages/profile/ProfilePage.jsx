import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    currency: user?.currency || 'INR',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileChange = e => setProfileForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handlePwChange = e => setPwForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleProfileSave = async e => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await userService.updateProfile(profileForm);
      updateUser(res.data.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSavingProfile(false); }
  };

  const handlePwSave = async e => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPw(true);
    try {
      await userService.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSavingPw(false); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage your account settings</p>
      </div>

      <div className="grid grid-2">
        {/* Profile Info */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'var(--accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 700,
            }}>
              {user?.fullName?.[0] || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.fullName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user?.email}</div>
              <span className="badge badge-info" style={{ marginTop: 6 }}>
                {user?.role}
              </span>
            </div>
          </div>

          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Personal Information
          </h3>

          <form onSubmit={handleProfileSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" name="fullName" value={profileForm.fullName} onChange={handleProfileChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-control" value={user?.username || ''} disabled style={{ opacity: 0.5 }} />
            </div>
            <div className="grid grid-2" style={{ gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone</label>
                <input className="form-control" name="phone" value={profileForm.phone} onChange={handleProfileChange} placeholder="+91 ..." />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Currency</label>
                <select className="form-control" name="currency" value={profileForm.currency} onChange={handleProfileChange}>
                  {[['INR', '₹ Indian Rupee'], ['USD', '$ US Dollar'], ['EUR', '€ Euro'], ['GBP', '£ British Pound']].map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }} disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
            Change Password
          </h3>

          <form onSubmit={handlePwSave}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-control" type="password" name="currentPassword" value={pwForm.currentPassword} onChange={handlePwChange} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-control" type="password" name="newPassword" value={pwForm.newPassword} onChange={handlePwChange} placeholder="Min. 6 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-control" type="password" name="confirmPassword" value={pwForm.confirmPassword} onChange={handlePwChange} placeholder="Repeat password" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPw}>
              {savingPw ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          {/* Account Stats */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              Account Info
            </h3>
            {[
              ['Member Since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
              ['Account Status', user?.isActive !== false ? 'Active' : 'Inactive'],
              ['Default Currency', profileForm.currency],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
