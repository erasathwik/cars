import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { MapPin, User, Search, Loader } from 'lucide-react';

export const Dashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [answers, setAnswers] = useState({});

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

  const handleClaim = async (item) => {
    try {
      // Basic validation: ensure all questions are answered
      if (item.questions?.length > 0 && Object.keys(answers).length !== item.questions.length) {
        throw new Error("Please provide answers to all verification questions.");
      }

      await api.createClaim({ item_id: item.id, answers });
      alert("Claim submitted successfully!");
      setClaimingId(null);
      setAnswers({});
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
                    <label style={{ fontSize: '0.9rem', marginBottom: '12px', display: 'block', fontWeight: 'bold' }}>Verification Questions</label>
                    {(item.questions && item.questions.length > 0) ? item.questions.map((q, i) => (
                      <div key={i} style={{ marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.85rem', marginBottom: '4px', color: 'var(--primary)' }}>Q: {q}</p>
                        <input 
                          type="text" 
                          className="input-glass" 
                          value={answers[i] || ''} 
                          onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                          placeholder="Your answer..."
                        />
                      </div>
                    )) : (
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.85rem', marginBottom: '4px' }}>Please provide any proof of ownership.</p>
                        <textarea 
                          className="input-glass" 
                          rows={2} 
                          value={answers['proof'] || ''} 
                          onChange={(e) => setAnswers({ proof: e.target.value })}
                          placeholder="e.g. It's a black leather wallet with my ID..."
                          style={{ resize: 'none' }}
                        />
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleClaim(item)}>Submit Claim</button>
                      <button className="btn-secondary" onClick={() => { setClaimingId(null); setAnswers({}); }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn-primary" style={{ marginTop: 'auto', width: '100%' }} onClick={() => { setClaimingId(item.id); setAnswers({}); }}>
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
