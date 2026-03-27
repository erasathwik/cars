import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ClipboardList, Box, Loader } from 'lucide-react';

export const Claims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const data = await api.getClaims();
      setClaims(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'approved') return '#4ade80';
    if (status === 'rejected') return '#ef4444';
    return '#facc15';
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '40px' }}><Loader size={32} className="spin" /></div>;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Your Claims</h1>
        <p style={{ color: 'var(--text-muted)' }}>Monitor the status of items you have requested to recover.</p>
      </div>

      {claims.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <ClipboardList size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h3>You haven't made any claims yet.</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {claims.map(claim => (
            <div key={claim.id} className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ width: '100px', height: '100px', backgroundImage: `url(${claim.item?.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '8px' }} />
              
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{claim.item?.title}</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Box size={14} /> Claimed on {new Date(claim.created_at).toLocaleDateString()}
                </div>
                <p style={{ color: '#fff', fontSize: '0.9rem' }}>
                  <strong>Proof Provided:</strong> {claim.proof}
                </p>
              </div>

              <div style={{ minWidth: '150px', textAlign: 'right' }}>
                <span style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${getStatusColor(claim.status)}`,
                  color: getStatusColor(claim.status)
                }}>
                  {claim.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
