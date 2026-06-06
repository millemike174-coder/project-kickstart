import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { checkIsAdmin } from '@/config/admin';

const AUTH_TIMEOUT_MS = 8000;

export function useAdminAuth(opts: { redirectIfUnauthed?: boolean } = {}) {
  const { redirectIfUnauthed = true } = opts;
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const timeout = window.setTimeout(() => {
      if (!mounted) return;
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
    }, AUTH_TIMEOUT_MS);

    const resolveRole = async (u: User | null) => {
      const admin = u ? await checkIsAdmin(u.id) : false;
      if (!mounted) return;
      setIsAdmin(admin);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      // Defer DB call to avoid deadlocks inside the auth callback.
      setTimeout(() => {
        resolveRole(u).finally(() => {
          if (mounted) setLoading(false);
        });
      }, 0);
    });

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        const u = data.session?.user ?? null;
        setUser(u);
        await resolveRole(u);
      })
      .catch((error) => {
        console.error('Admin auth session error', error);
        if (!mounted) return;
        setUser(null);
        setIsAdmin(false);
      })
      .finally(() => {
        if (!mounted) return;
        window.clearTimeout(timeout);
        setLoading(false);
      });

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading && redirectIfUnauthed && !isAdmin) {
      navigate('/admin/login', { replace: true });
    }
  }, [loading, isAdmin, redirectIfUnauthed, navigate]);

  return { user, loading, isAdmin };
}
