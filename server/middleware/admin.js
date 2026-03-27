import { supabase } from '../config/supabaseClient.js';
import { requireAuth } from './auth.js';

export const requireAdmin = [
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
