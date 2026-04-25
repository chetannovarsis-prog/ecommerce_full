import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);

  // Preferred path: backend-issued JWT used by the current admin dashboard.
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded?.role === 'admin') {
      req.user = decoded;
      return next();
    }
  } catch {
    // Fall through to legacy Supabase-token validation.
  }

  // Legacy path: Supabase auth token + profiles role check.
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const profileRes = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profileRes.error || !profileRes.data || profileRes.data.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  req.user = data.user;
  next();
};
