import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { MapPin, User, Search, Loader } from 'lucide-react';

export const Dashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [proof, setProof] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await api.getItems();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (itemId) => {
    try {
      await api.createClaim({ item_id: itemId, proof });
      alert("Claim submitted successfully!");
      setClaimingId(null);
      setProof('');
    } catch (err) {
      alert("Failed to claim: " + err.message);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '40px' }}><Loader size={32} className="spin" /></div>;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Found Items</h1>
        <p style={{ color: 'var(--text-muted)' }}>Browse items that have been found on campus. Claim them if they belong to you.</p>
      </div>

      {items.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <Search size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h3>No items currently listed</h3>
        </div>
      ) : (
        <div className="grid">
          {items.map(item => (
            <div key={item.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '200px', backgroundImage: `url(${item.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="badge badge-found">{item.category}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', flex: 1 }}>
                  {item.description}
                </p>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <MapPin size={16} /> Location: {item.location_found}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <User size={16} /> Found by: {item.posted_by?.name} ({item.posted_by?.roll_number})
                  </div>
                </div>

                {claimingId === item.id ? (
                  <div style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                    <label style={{ fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Provide Proof of Ownership</label>
                    <textarea 
                      className="input-glass" 
                      rows={3} 
                      value={proof} 
                      onChange={(e) => setProof(e.target.value)}
                      placeholder="e.g. It's a black leather wallet with my ID card inside..."
                      style={{ resize: 'none', marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleClaim(item.id)}>Submit</button>
                      <button className="btn-secondary" onClick={() => setClaimingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn-primary" style={{ marginTop: 'auto', width: '100%' }} onClick={() => setClaimingId(item.id)}>
                    CLAIM ITEM
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
