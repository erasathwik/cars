import { useState } from 'react';
import { api } from '../lib/api';
import { Box } from 'lucide-react';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '', roll_number: '', email: '', password: '', mobile_number: '', branch: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await api.login({ email: formData.email, password: formData.password });
        // Auth session is handled by Supabase subscription in AuthContext
      } else {
        await api.signup(formData);
        setIsLogin(true); // Switch to login after successful signup
        alert("Signup successful! You are now logged in.");
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
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Box size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
            {isLogin ? 'Welcome Back' : 'Join CARS'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {isLogin ? 'Login to view and post items' : 'Create an account to recover lost campus assets'}
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="grid">
              <div className="form-group">
                <label>Full Name</label>
                <input required type="text" name="name" className="input-glass" placeholder="John Doe" onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Roll Number</label>
                <input required type="text" name="roll_number" className="input-glass" placeholder="2023CS101" onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input required type="text" name="mobile_number" className="input-glass" placeholder="9876543210" onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Branch</label>
                <input required type="text" name="branch" className="input-glass" placeholder="Computer Science" onChange={handleChange} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input required type="email" name="email" className="input-glass" placeholder="john@example.com" onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input required type="password" name="password" className="input-glass" placeholder="••••••••" onChange={handleChange} />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};
