import { useState } from 'react';
import { api } from '../lib/api';
import { ShieldAlert } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminLogin = () => {
  const { role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.adminLogin(formData);
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
          <div className="form-group">
            <label>Email Address</label>
            <input required type="email" name="email" className="input-glass" placeholder="admin@cars.edu" onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input required type="password" name="password" className="input-glass" placeholder="••••••••" onChange={handleChange} />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px', background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', border: 'none' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
};
