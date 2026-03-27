import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Box } from 'lucide-react';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar glass-panel">
      <Link to="/" className="nav-brand">
        <Box size={24} color="var(--primary)" /> CARS
      </Link>
      
      <div style={{ position: 'relative' }}>
        <button className="hamburger-btn" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {isOpen && (
          <div className="mobile-menu glass-panel" style={{ position: 'absolute', right: 0, top: '40px' }}>
            <Link to="/profile" className="nav-link" onClick={() => setIsOpen(false)}>Profile</Link>
            <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>All Items</Link>
            <Link to="/post-item" className="nav-link" onClick={() => setIsOpen(false)}>Post Item</Link>
            <Link to="/your-posts" className="nav-link" onClick={() => setIsOpen(false)}>Your Posts</Link>
            <Link to="/claims" className="nav-link" onClick={() => setIsOpen(false)}>Claims</Link>
            {role === 'admin' && (
              <>
                <hr style={{ borderColor: 'var(--border-glass)', margin: '8px 0' }} />
                <Link to="/admin" className="nav-link" onClick={() => setIsOpen(false)} style={{ color: '#ef4444' }}>Admin Dashboard</Link>
              </>
            )}
            <hr style={{ borderColor: 'var(--border-glass)', margin: '8px 0' }} />
            <button onClick={handleSignOut} className="nav-link" style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem' }}>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
