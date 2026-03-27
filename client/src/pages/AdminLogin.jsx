import { useState } from 'react';
import { api } from '../lib/api';
import { ShieldAlert } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminLogin = () => {
  const { role } = useAuth();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', adminKey: '' });

  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSigningUp) {
        await api.adminSignup(formData);
      } else {
        await api.adminLogin({ email: formData.email, password: formData.password });
      }
    } catch (err) {
      try {
        const parsed = JSON.parse(err.message);
        setError(parsed.error || 'Authentication failed');
      } catch {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ alignItems: 'flex-start', paddingTop: '80px' }}>
      <div className="auth-card glass-panel" style={{ maxWidth: '400px', width: '100%', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
          <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Admin Portal</h1>
          <p style={{ color: 'var(--text-muted)' }}>Authorized personnel only.</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSigningUp && (
            <div className="form-group">
              <label>Full Name</label>
              <input required type="text" name="name" className="input-glass" placeholder="Admin Name" value={formData.name} onChange={handleChange} />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input required type="email" name="email" className="input-glass" placeholder="admin@cars.edu" value={formData.email} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input required type="password" name="password" className="input-glass" placeholder="••••••••" value={formData.password} onChange={handleChange} />
          </div>

          {isSigningUp && (
            <div className="form-group">
              <label>Admin Registration Key</label>
              <input required type="password" name="adminKey" className="input-glass" placeholder="Secret Key" value={formData.adminKey} onChange={handleChange} />
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px', background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', border: 'none' }} disabled={loading}>
            {loading ? 'Processing...' : (isSigningUp ? 'Create Admin Account' : 'Secure Login')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button 
            onClick={() => { setIsSigningUp(!isSigningUp); setError(''); }} 
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            {isSigningUp ? 'Already an admin? Log in' : 'Need an account? Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
};
