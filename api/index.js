import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Client Setup ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Missing SUPABASE_URL or SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in environment");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Middleware: requireAuth ---
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// --- Middleware: requireAdmin ---
const requireAdmin = [
  requireAuth,
  async (req, res, next) => {
    try {
      const { data: adminRecord, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();

      if (error || !adminRecord) {
        return res.status(403).json({ error: 'Access denied. Administrative privileges required.' });
      }

      req.adminRecord = adminRecord;
      next();
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
];

// --- Express App ---
const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api', (req, res) => {
  res.json({ status: 'CARS API is running' });
});

// --- Auth Routes ---
app.post('/api/signup', async (req, res) => {
  try {
    const { name, roll_number, email, password, mobile_number, branch } = req.body;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) return res.status(400).json({ error: authError.message });

    const user = authData.user;
    if (!user) return res.status(400).json({ error: 'Signup failed' });

    const { data: userData, error: dbError } = await supabase
      .from('users')
      .insert([
        { id: user.id, name, roll_number, email, mobile_number, branch }
      ])
      .select()
      .single();

    if (dbError) {
      return res.status(400).json({ error: dbError.message });
    }

    res.status(201).json({ user: userData, session: authData.session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return res.status(400).json({ error: error.message });

    // Check if they are an admin first
    const { data: adminData } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (adminData) {
      return res.status(200).json({ session: data.session, user: adminData, role: 'admin' });
    }

    // Fetch extended student details
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (dbError || !userData) {
      await supabase.auth.signOut();
      return res.status(404).json({ error: 'User profile not found. Please sign up.' });
    }

    res.status(200).json({ session: data.session, user: userData, role: 'student' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/signup', async (req, res) => {
  try {
    const { name, email, password, adminKey } = req.body;

    if (!adminKey || adminKey !== process.env.ADMIN_SIGNUP_KEY) {
      return res.status(403).json({ error: 'Invalid Administration Registration Key. Access denied.' });
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) return res.status(400).json({ error: authError.message });

    const user = authData.user;
    if (!user) return res.status(400).json({ error: 'Admin signup failed at auth layer.' });

    const { data: adminData, error: dbError } = await supabase
      .from('admin_profiles')
      .insert([{ id: user.id, name, email }])
      .select()
      .single();

    if (dbError) {
      return res.status(400).json({ error: dbError.message });
    }

    res.status(201).json({ session: authData.session, user: adminData, role: 'admin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    const { data: adminData, error: dbError } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (dbError || !adminData) {
      await supabase.auth.signOut();
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }

    res.status(200).json({ session: authData.session, user: adminData, role: 'admin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- User Routes ---
app.put('/api/profile', requireAuth, async (req, res) => {
  try {
    const { mobile_number, email } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ mobile_number, email })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Items Routes ---
app.get('/api/items', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        posted_by:users(name, roll_number)
      `)
      .eq('status', 'found')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', requireAuth, async (req, res) => {
  try {
    const { title, description, category, image_url, location_found, questions } = req.body;

    const { data, error } = await supabase
      .from('items')
      .insert([
        {
          title,
          description,
          category,
          image_url,
          location_found,
          questions: questions || [],
          status: 'found',
          posted_by: req.user.id
        }
      ])
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user-items', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('posted_by', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Claims Routes ---
app.post('/api/claim', requireAuth, async (req, res) => {
  try {
    const { item_id, proof, answers } = req.body;

    const { data, error } = await supabase
      .from('claims')
      .insert([
        {
          item_id,
          claimed_by: req.user.id,
          proof,
          answers: answers || {},
          status: 'pending'
        }
      ])
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/claims', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('claims')
      .select(`
        *,
        item:items(*)
      `)
      .eq('claimed_by', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin Routes ---
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [{ count: usersCount }, { count: itemsCount }, { count: claimsCount }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('items').select('*', { count: 'exact', head: true }),
      supabase.from('claims').select('*', { count: 'exact', head: true })
    ]);
    res.status(200).json({ usersCount, itemsCount, claimsCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/items', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('items').select('*, posted_by:users(name, roll_number)').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/claims', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('claims').select('*, claimed_by:users(name, email), item:items(title)').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default app;
