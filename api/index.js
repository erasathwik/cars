import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Client Setup ---
let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Aggressively trim to fix .env whitespace explosions
supabaseUrl = supabaseUrl ? supabaseUrl.trim() : '';
supabaseKey = supabaseKey ? supabaseKey.trim() : '';

if (!supabaseUrl || supabaseUrl.length === 0) supabaseUrl = 'https://placeholder.supabase.co';
if (!supabaseKey || supabaseKey.length === 0) supabaseKey = 'placeholder';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn("⚠️ Missing SUPABASE_URL or SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in environment");
}

console.log("[DEBUG] Supabase URL length:", supabaseUrl.length);
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

// GLOBAL LOGGER
app.use((req, res, next) => {
  console.log(`[Backend-LOG] ${req.method} Path: ${req.path} Target: ${req.originalUrl}`);
  next();
});

const apiRouter = express.Router();

// --- Health ---
apiRouter.get('/', (req, res) => res.json({ status: 'CARS API is running v2.0-Final' }));

// --- Auth ---
apiRouter.post('/signup', async (req, res) => {
  try {
    const { email, password, name, roll_number, mobile_number, branch } = req.body;
    console.log(`[Signup Start] ${email}`);
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return res.status(400).json({ error: authError.message });
    const { data: userData, error: dbError } = await supabase.from('users').insert([{ id: authData.user.id, name, roll_number, email, mobile_number, branch }]).select().single();
    if (dbError) return res.status(400).json({ error: dbError.message });
    console.log(`[Signup Success] ${email}`);
    res.status(201).json({ user: userData, session: authData.session });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

apiRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[Login Start] ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    
    // Check Admin
    const { data: adminData } = await supabase.from('admin_profiles').select('*').eq('id', data.user.id).single();
    if (adminData) {
      console.log(`[Login Success-ADMIN] ${email}`);
      return res.status(200).json({ session: data.session, user: adminData, role: 'admin' });
    }

    // Student profile
    const { data: userData } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    if (!userData) return res.status(404).json({ error: 'User profile not found.' });
    console.log(`[Login Success-STUD] ${email}`);
    res.status(200).json({ session: data.session, user: userData, role: 'student' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin Logins
apiRouter.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    const { data: adminData } = await supabase.from('admin_profiles').select('*').eq('id', data.user.id).single();
    if (!adminData) {
      await supabase.auth.signOut();
      return res.status(403).json({ error: 'Admin only access.' });
    }
    res.status(200).json({ session: data.session, user: adminData, role: 'admin' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

apiRouter.post('/admin/signup', async (req, res) => {
  try {
    const { email, password, name, adminKey } = req.body;
    if (adminKey !== process.env.ADMIN_SIGNUP_KEY) return res.status(403).json({ error: 'Invalid Admin Key' });
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return res.status(400).json({ error: authError.message });
    const { data: adminData } = await supabase.from('admin_profiles').insert([{ id: authData.user.id, name, email }]).select().single();
    res.status(201).json({ user: adminData, session: authData.session, role: 'admin' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Resources
apiRouter.get('/items', async (req, res) => {
  try {
    const { data, error } = await supabase.from('items').select('*, posted_by:users(name, roll_number)').eq('status', 'found').order('index', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

apiRouter.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [{ count: usersCount }, { count: itemsCount }, { count: claimsCount }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('items').select('*', { count: 'exact', head: true }),
      supabase.from('claims').select('*', { count: 'exact', head: true })
    ]);
    res.json({ usersCount, itemsCount, claimsCount });
  } catch (err) { res.json({ error: err.message }); }
});

// --- Dual path mounting ---
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
