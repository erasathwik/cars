import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { UserCircle } from 'lucide-react';

export const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [formData, setFormData] = useState({
    mobile_number: '', email: ''
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setProfile(data);
      setFormData({ mobile_number: data.mobile_number, email: data.email });
    }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.updateProfile(formData);
      alert("Profile updated successfully!");
      fetchProfile();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '40px' }}>Loading profile...</div>;

  return (
    <div className="auth-container" style={{ alignItems: 'flex-start', paddingTop: '40px' }}>
      <div className="auth-card glass-panel">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <UserCircle size={64} color="var(--primary)" style={{ marginBottom: '16px' }} />
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Your Profile</h1>
          <p style={{ color: 'var(--text-muted)' }}>{profile?.name} • {profile?.branch}</p>
        </div>

        <div className="grid">
          <div className="form-group">
            <label>Roll Number (Immutable)</label>
            <input type="text" className="input-glass" value={profile?.roll_number} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          </div>
          <div className="form-group">
            <label>Name (Immutable)</label>
            <input type="text" className="input-glass" value={profile?.name} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          </div>
        </div>
        
        <hr style={{ borderColor: 'var(--border-glass)', margin: '24px 0' }} />

        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              required 
              type="email" 
              className="input-glass" 
              value={formData.email} 
              onChange={e => setFormData({ ...formData, email: e.target.value })} 
            />
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <input 
              required 
              type="text" 
              className="input-glass" 
              value={formData.mobile_number} 
              onChange={e => setFormData({ ...formData, mobile_number: e.target.value })} 
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={updating}>
            {updating ? 'Saving...' : 'Update Details'}
          </button>
        </form>
      </div>
    </div>
  );
};
