import express from 'express';
import { supabase } from '../config/supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// --- Auth Routes ---
router.post('/signup', async (req, res) => {
  try {
    const { name, roll_number, email, password, mobile_number, branch } = req.body;

    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) return res.status(400).json({ error: authError.message });

    const user = authData.user;
    if (!user) return res.status(400).json({ error: 'Signup failed' });

    // 2. Insert user profile into public.users table
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

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return res.status(400).json({ error: error.message });

    // Fetch extended user details
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.status(200).json({ session: data.session, user: userData || data.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- User Routes ---
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { mobile_number, email } = req.body;
    
    // Note: Updating auth email requires separate supabase.auth.updateUser() call. 
    // Here we only update the public profile for simplicity, but if needed auth email should be synced.
    
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
router.get('/items', async (req, res) => {
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

router.post('/items', requireAuth, async (req, res) => {
  try {
    const { title, description, category, image_url, location_found } = req.body;
    
    const { data, error } = await supabase
      .from('items')
      .insert([
        {
          title,
          description,
          category,
          image_url,
          location_found,
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

router.get('/user-items', requireAuth, async (req, res) => {
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
router.post('/claim', requireAuth, async (req, res) => {
  try {
    const { item_id, proof } = req.body;

    const { data, error } = await supabase
      .from('claims')
      .insert([
        {
          item_id,
          claimed_by: req.user.id,
          proof,
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

router.get('/claims', requireAuth, async (req, res) => {
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

export default router;
