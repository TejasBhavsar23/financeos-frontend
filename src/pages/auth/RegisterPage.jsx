import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password || !form.fullName) {
      toast.error('Please fill all required fields'); return;
    }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to FinanceOS 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <div className="auth-logo">
          <div className="logo-icon">₹</div>
          <h1>Create account</h1>
          <p>Start managing your finances with FinanceOS</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-2" style={{ gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name *</label>
              <input className="form-control" name="fullName" value={form.fullName} onChange={handleChange} placeholder="John Doe" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Username *</label>
              <input className="form-control" name="username" value={form.username} onChange={handleChange} placeholder="johndoe" />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Email *</label>
            <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@example.com" />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-control" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" />
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
