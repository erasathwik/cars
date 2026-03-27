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
      console.log("[Auth Milestone] Fetching extended profile for:", sessionUser.email);
      if (!sessionUser) {
        setRole(null);
        return;
      }
      
      // Check Admin
      const { data: adminData, error: adminError } = await supabase.from('admin_profiles').select('id').eq('id', sessionUser.id).single();
      if (!adminError && adminData) {
        console.log("[Auth Milestone] Role detected: ADMIN");
        setRole('admin');
        return;
      }

      // Check Student
      const { data: userData } = await supabase.from('users').select('id').eq('id', sessionUser.id).single();
      if (userData) {
        console.log("[Auth Milestone] Role detected: STUDENT");
        setRole('student');
      } else {
        console.log("[Auth Milestone] Role detected: GUEST (No DB profile)");
        setRole(null);
      }
    } catch (err) {
      console.warn("[Auth Warning] Profile fetch defaulted:", err);
      setRole(null);
    }
  };

  useEffect(() => {
    console.log("[Auth Milestone] App Initialization Started");
    
    // GUARANTEED UNLOCK: The app will reveal itself after 2.5 seconds no matter what.
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.log("[Auth Milestone] Safety timeout reached! Forcing unlock.");
        setLoading(false);
      }
    }, 2500);

    const initializeAuth = async () => {
      try {
        console.log("[Auth Milestone] Requesting session from Supabase...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[Auth Milestone] Session request failed:", error.message);
          throw error;
        }
        
        setSession(session);
        if (session?.user) {
          console.log("[Auth Milestone] Session found. User:", session.user.email);
          await fetchExtendedProfile(session.user);
        } else {
          console.log("[Auth Milestone] No active session found.");
        }
        setUser(session?.user ?? null);
      } catch (err) {
        console.error("[Auth Error] Critical failure during init:", err);
      } finally {
        console.log("[Auth Milestone] Initialization Complete (finally)");
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    initializeAuth();

    // Listener for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[Auth Milestone] Auth State Changed Event: ${event}`);
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
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Initializing Secure System... (Failsafe Active)</p>
          <p style={{ opacity: 0.5, fontSize: '0.75rem', marginTop: '20px' }}>Waiting for database response...</p>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
