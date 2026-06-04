import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isAdminEmail } from '@/config/admin';

export function useAdminAuth(opts: { redirectIfUnauthed?: boolean } = {}) {
  const { redirectIfUnauthed = true } = opts;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = !!user && isAdminEmail(user.email);

  useEffect(() => {
    if (!loading && redirectIfUnauthed && !isAdmin) {
      navigate('/admin/login', { replace: true });
    }
  }, [loading, isAdmin, redirectIfUnauthed, navigate]);

  return { user, loading, isAdmin };
}
