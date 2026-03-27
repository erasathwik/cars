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
const apiRouter = express.Router();

app.use(cors());
app.use(express.json());

// Logger
app.use((req, res, next) => {
  console.log(`[Backend] ${req.method} ${req.url}`);
  next();
});

// --- Health Check ---
apiRouter.get('/', (req, res) => {
  res.json({ status: 'CARS API is running' });
});

// --- Auth Routes ---
apiRouter.post('/signup', async (req, res) => {
  try {
    const { name, roll_number, email, password, mobile_number, branch } = req.body;
    console.log(`[Signup] Attempting signup for ${email}`);
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return res.status(400).json({ error: authError.message });
    const user = authData.user;
    if (!user) return res.status(400).json({ error: 'Signup failed' });
    const { data: userData, error: dbError } = await supabase.from('users').insert([{ id: user.id, name, roll_number, email, mobile_number, branch }]).select().single();
    if (dbError) return res.status(400).json({ error: dbError.message });
    res.status(201).json({ user: userData, session: authData.session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[Login] Attempting login for ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error(`[Login Fail] ${error.message}`);
      return res.status(400).json({ error: error.message });
    }
    
    // Check if they are an admin first
    const { data: adminData } = await supabase.from('admin_profiles').select('*').eq('id', data.user.id).single();
    if (adminData) return res.status(200).json({ session: data.session, user: adminData, role: 'admin' });

    // Fetch student profile
    const { data: userData, error: dbError } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    if (dbError || !userData) {
      await supabase.auth.signOut();
      return res.status(404).json({ error: 'User profile not found. Please sign up.' });
    }
    res.status(200).json({ session: data.session, user: userData, role: 'student' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/signup', async (req, res) => {
  try {
    const { name, email, password, adminKey } = req.body;
    if (!adminKey || adminKey !== process.env.ADMIN_SIGNUP_KEY) return res.status(403).json({ error: 'Invalid Administration Registration Key.' });
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return res.status(400).json({ error: authError.message });
    const { data: adminData, error: dbError } = await supabase.from('admin_profiles').insert([{ id: authData.user.id, name, email }]).select().single();
    if (dbError) return res.status(400).json({ error: dbError.message });
    res.status(201).json({ session: authData.session, user: adminData, role: 'admin' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

apiRouter.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    const { data: adminData, error: dbError } = await supabase.from('admin_profiles').select('*').eq('id', authData.user.id).single();
    if (dbError || !adminData) {
      await supabase.auth.signOut();
      return res.status(403).json({ error: 'Access denied. Privileges required.' });
    }
    res.status(200).json({ session: authData.session, user: adminData, role: 'admin' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

apiRouter.get('/items', async (req, res) => {
  try {
    const { data, error } = await supabase.from('items').select('*, posted_by:users(name, roll_number)').eq('status', 'found').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

apiRouter.post('/items', requireAuth, async (req, res) => {
  try {
    const { title, description, category, image_url, location_found, questions } = req.body;
    const { data, error } = await supabase.from('items').insert([{ title, description, category, image_url, location_found, questions: questions || [], status: 'found', posted_by: req.user.id }]).select();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

apiRouter.get('/user-items', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('items').select('*').eq('posted_by', req.user.id).order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

apiRouter.post('/claim', requireAuth, async (req, res) => {
  try {
    const { item_id, proof, answers } = req.body;
    const { data, error } = await supabase.from('claims').insert([{ item_id, claimed_by: req.user.id, proof, answers: answers || {}, status: 'pending' }]).select();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin Routes inside the router
apiRouter.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [{ count: usersCount }, { count: itemsCount }, { count: claimsCount }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('items').select('*', { count: 'exact', head: true }),
      supabase.from('claims').select('*', { count: 'exact', head: true })
    ]);
    res.status(200).json({ usersCount, itemsCount, claimsCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Final Mounting ---
// This ensures that requests to /api/login AND /login both hit our router
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
