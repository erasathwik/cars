import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader } from 'lucide-react';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchExtendedProfile = async (sessionUser) => {
    try {
      if (!sessionUser) {
        setRole(null);
        return;
      }
      
      // First check if they are an admin
      const { data: adminData, error: adminError } = await supabase.from('admin_profiles').select('id').eq('id', sessionUser.id).single();
      if (!adminError && adminData) {
        setRole('admin');
        return;
      }

      // Otherwise they are a student
      const { data: userData, error: userError } = await supabase.from('users').select('id').eq('id', sessionUser.id).single();
      if (!userError && userData) {
        setRole('student');
      } else {
        setRole(null);
      }
    } catch (err) {
      console.warn("Profile fetch failed, defaulting to student role", err);
      setRole(null);
    }
  };

  useEffect(() => {
    // Failsafe: No matter what happens, the app will unlock after 2.5 seconds
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 2500);

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        if (session?.user) {
          await fetchExtendedProfile(session.user);
        }
        setUser(session?.user ?? null);
      } catch (err) {
        console.error("Auth init error", err);
      } finally {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    initializeAuth();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchExtendedProfile(session.user);
        }
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const value = {
    session,
    user,
    role,
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#fff',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <Loader size={48} className="spin" style={{ color: 'var(--primary)', marginBottom: '24px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>CARS</h2>
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Initializing Secure System...</p>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
