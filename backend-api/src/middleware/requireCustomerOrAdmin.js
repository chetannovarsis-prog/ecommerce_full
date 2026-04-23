import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const requireCustomerOrAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.slice(7);

  // 1) Try customer JWT (store-frontend)
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded?.role === 'customer') {
      req.user = decoded;
      req.auth = { type: 'customer', id: decoded.id };
      return next();
    }
  } catch {
    // fall through to admin auth
  }

  // 2) Try admin Supabase token (admin-dashboard)
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ message: 'Unauthorized: Authentication failed' });
    }

    const profileRes = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileRes.error || !profileRes.data || profileRes.data.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin role required' });
    }

    req.user = data.user;
    req.auth = { type: 'admin', id: data.user.id };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: Authentication failed' });
  }
};

