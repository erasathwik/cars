import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Archive, MapPin, Loader } from 'lucide-react';

export const YourPosts = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyItems();
  }, []);

  const fetchMyItems = async () => {
    try {
      const data = await api.getUserItems();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '40px' }}><Loader size={32} className="spin" /></div>;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Your Posted Items</h1>
        <p style={{ color: 'var(--text-muted)' }}>Items you have found and posted on CARS.</p>
      </div>

      {items.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <Archive size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h3>You haven't posted any items yet.</h3>
        </div>
      ) : (
        <div className="grid">
          {items.map(item => (
            <div key={item.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '200px', backgroundImage: `url(${item.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className={`badge badge-${item.status}`}>{item.status.toUpperCase()}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', flex: 1 }}>
                  {item.description}
                </p>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <MapPin size={16} /> Location: {item.location_found}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
