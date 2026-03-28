import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { getAdminProfile } from '../services/adminAuth';

export const useAdminAuth = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let hasResolvedInitialCheck = false;

    async function check(showLoader = false) {
      if (showLoader && isMounted) {
        setLoading(true);
      }

      try {
        const data = await getAdminProfile();
        if (!isMounted) return;

        if (data?.profile?.role === 'admin') {
          setIsAdmin(true);
          setEmail(data.profile.email);
          localStorage.setItem('adminAuth', 'true');
          localStorage.setItem('adminEmail', data.profile.email);
        } else {
          setIsAdmin(false);
          setEmail(null);
          localStorage.removeItem('adminAuth');
          localStorage.removeItem('adminEmail');
        }
      } catch {
        if (!isMounted) return;
        setIsAdmin(false);
        setEmail(null);
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminEmail');
      } finally {
        if (isMounted) {
          setLoading(false);
          hasResolvedInitialCheck = true;
        }
      }
    }

    check(true);

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
        setEmail(null);
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminEmail');
        setLoading(false);
        return;
      }

      if (!['INITIAL_SESSION', 'SIGNED_IN', 'USER_UPDATED'].includes(event)) {
        return;
      }

      void check(!hasResolvedInitialCheck);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return { loading, isAdmin, email };
};
