import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
  };
};

export const api = {
  // Auth is somewhat bypassed here if we use Supabase Auth directly on client, 
  // but we can call our custom backend endpoints if needed.
  signup: async (userData) => {
    const res = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
    }
    return data;
  },
  
  login: async (credentials) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
    }
    return data;
  },

  updateProfile: async (data) => {
    const res = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getItems: async () => {
    const res = await fetch(`${API_URL}/items`, {
      headers: await getHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  createItem: async (itemData) => {
    const res = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(itemData)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  getUserItems: async () => {
    const res = await fetch(`${API_URL}/user-items`, {
      headers: await getHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  createClaim: async (claimData) => {
    const res = await fetch(`${API_URL}/claim`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(claimData)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getClaims: async () => {
    const res = await fetch(`${API_URL}/claims`, {
      headers: await getHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // --- Admin Routes ---
  adminLogin: async (credentials) => {
    const res = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
    }
    return data;
  },

  adminSignup: async (data) => {
    const res = await fetch(`${API_URL}/admin/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    const result = await res.json();
    if (result.session) {
      await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token
      });
    }
    return result;
  },

  getAdminStats: async () => {
    const res = await fetch(`${API_URL}/admin/stats`, {
      headers: await getHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getAdminUsers: async () => {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: await getHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getAdminItems: async () => {
    const res = await fetch(`${API_URL}/admin/items`, {
      headers: await getHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getAdminClaims: async () => {
    const res = await fetch(`${API_URL}/admin/claims`, {
      headers: await getHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
