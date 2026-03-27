import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const fetchWithTimeout = async (resource, options = {}) => {
  const { timeout = 10000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  console.log(`[API-Milestone] Calling Fetch: ${resource}`);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(id);
    if (!response.ok) {
        console.error(`[API-Error] Response: ${response.status} ${response.statusText}`);
    }
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      console.error(`[API-Error] Request Timed Out (10s) for: ${resource}`);
      throw new Error('Request timed out. Please check your connection or Vercel logs.');
    }
    console.error(`[API-Error] Fetch failed for: ${resource}. Check if the monorepo is correctly built.`);
    throw error;
  }
};

const getHeaders = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        };
    } catch (err) {
        console.warn("[API-Warning] Header generation failed, session might be invalid.");
        return { 'Content-Type': 'application/json' };
    }
};

export const api = {
  signup: async (userData) => {
    const res = await fetchWithTimeout(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (data.session) {
      await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
    }
    return data;
  },
  
  login: async (credentials) => {
    const res = await fetchWithTimeout(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (data.session) {
      await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
    }
    return data;
  },

  updateProfile: async (data) => {
    const res = await fetchWithTimeout(`${API_URL}/profile`, { method: 'PUT', headers: await getHeaders(), body: JSON.stringify(data) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getItems: async () => {
    const res = await fetchWithTimeout(`${API_URL}/items`, { headers: await getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  createItem: async (itemData) => {
    const res = await fetchWithTimeout(`${API_URL}/items`, { method: 'POST', headers: await getHeaders(), body: JSON.stringify(itemData) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  getUserItems: async () => {
    const res = await fetchWithTimeout(`${API_URL}/user-items`, { headers: await getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  createClaim: async (claimData) => {
    const res = await fetchWithTimeout(`${API_URL}/claim`, { method: 'POST', headers: await getHeaders(), body: JSON.stringify(claimData) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getClaims: async () => {
    const res = await fetchWithTimeout(`${API_URL}/claims`, { headers: await getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  adminLogin: async (credentials) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (data.session) {
      await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
    }
    return data;
  },

  adminSignup: async (data) => {
    const res = await fetchWithTimeout(`${API_URL}/admin/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error(await res.text());
    const result = await res.json();
    if (result.session) {
      await supabase.auth.setSession({ access_token: result.session.access_token, refresh_token: result.session.refresh_token });
    }
    return result;
  },

  getAdminStats: async () => {
    const res = await fetchWithTimeout(`${API_URL}/admin/stats`, { headers: await getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getAdminUsers: async () => {
    const res = await fetchWithTimeout(`${API_URL}/admin/users`, { headers: await getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getAdminItems: async () => {
    const res = await fetchWithTimeout(`${API_URL}/admin/items`, { headers: await getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getAdminClaims: async () => {
    const res = await fetchWithTimeout(`${API_URL}/admin/claims`, { headers: await getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
