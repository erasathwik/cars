import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchExtendedProfile = async (sessionUser) => {
    if (!sessionUser) {
      setRole(null);
      return;
    }
    
    // First check if they are an admin
    const { data: adminData } = await supabase.from('admin_profiles').select('id').eq('id', sessionUser.id).single();
    if (adminData) {
      setRole('admin');
      return;
    }

    // Otherwise they are a student
    const { data: userData } = await supabase.from('users').select('id').eq('id', sessionUser.id).single();
    if (userData) {
      setRole('student');
    } else {
      setRole(null);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      await fetchExtendedProfile(session?.user);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        setSession(session);
        await fetchExtendedProfile(session?.user);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user,
    role,
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
