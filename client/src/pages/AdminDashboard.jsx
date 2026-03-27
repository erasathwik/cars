import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Users, Package, ClipboardCheck, Loader } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({ usersCount: 0, itemsCount: 0, claimsCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getAdminStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '40px' }}><Loader size={32} className="spin" /></div>;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', color: '#ef4444' }}>Admin Overview</h1>
        <p style={{ color: 'var(--text-muted)' }}>System-wide analytics and management.</p>
      </div>

      <div className="grid">
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '50%' }}>
            <Users size={32} color="#ef4444" />
          </div>
          <div>
            <h3 style={{ fontSize: '2rem', marginBottom: '4px' }}>{stats.usersCount}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Registered Users</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '50%' }}>
            <Package size={32} color="#3b82f6" />
          </div>
          <div>
            <h3 style={{ fontSize: '2rem', marginBottom: '4px' }}>{stats.itemsCount}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Items Reported</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '50%' }}>
            <ClipboardCheck size={32} color="#10b981" />
          </div>
          <div>
            <h3 style={{ fontSize: '2rem', marginBottom: '4px' }}>{stats.claimsCount}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Claims</p>
          </div>
        </div>
      </div>
    </div>
  );
};
