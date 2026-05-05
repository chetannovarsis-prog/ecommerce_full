import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

export const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);

  // 1) Try backend-issued JWT first (fast path)
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded?.role === 'admin') {
      req.user = decoded;
      return next();
    }
  } catch {
    // fall through to Supabase verification
  }

  // 2) If Supabase credentials are available, attempt Supabase-based auth
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseServiceKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

      // Try modern API first
      let userResp;
      if (supabase.auth && typeof supabase.auth.getUser === 'function') {
        userResp = await supabase.auth.getUser(token);
        if (userResp?.error) throw userResp.error;
      } else if (supabase.auth && supabase.auth.api && typeof supabase.auth.api.getUser === 'function') {
        userResp = await supabase.auth.api.getUser(token);
        if (userResp?.error) throw userResp.error;
      }

      const user = userResp?.data?.user || userResp?.user || null;
      if (user && user.email) {
        // Ensure admin exists in our local admin table (create if missing)
        try {
          let admin = await prisma.admin.findUnique({ where: { email: user.email } });
          if (!admin) {
            admin = await prisma.admin.create({ data: { email: user.email, is2FAEnabled: false } });
          }

          req.user = { id: admin.id, email: admin.email, role: 'admin' };
          return next();
        } catch (dbErr) {
          // If Prisma cannot connect, return a 503 so clients can retry later
          if (dbErr?.code === 'P1001') {
            return res.status(503).json({ error: 'Database unavailable' });
          }
          console.error('requireAdmin prisma error:', dbErr);
          return res.status(500).json({ error: 'Internal server error' });
        }
      }
    } catch (supErr) {
      console.error('Supabase auth error:', supErr?.message || supErr);
      // fall through to unauthorized
    }
  }

  return res.status(401).json({ error: 'Unauthorized' });
};
