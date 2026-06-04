import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { isAdminEmail } from '@/config/admin';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user && isAdminEmail(data.session.user.email)) {
        navigate('/admin/dashboard', { replace: true });
      }
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error || !data.user) {
      toast.error('Credenziali non valide');
      return;
    }
    if (!isAdminEmail(data.user.email)) {
      await supabase.auth.signOut();
      toast.error('Account non autorizzato');
      return;
    }
    navigate('/admin/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#F5F1E8] flex items-center justify-center px-5">
      <div className="w-full max-w-md bg-[#0F0E0C] border border-white/10 rounded-3xl p-8 sm:p-10">
        <h1 className="font-display uppercase text-3xl sm:text-4xl mb-1">Admin</h1>
        <p className="text-sm text-[#F5F1E8]/60 mb-8">
          Accesso area gestione Trenches Records
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-2 block">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[#E8DCC8] transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-2 block">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[#E8DCC8] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#E8DCC8] text-[#0A0908] px-6 py-3.5 text-sm uppercase tracking-widest font-medium hover:bg-[#F5F1E8] transition-colors disabled:opacity-50"
          >
            {loading ? 'Accesso…' : 'Accedi'}
          </button>
        </form>

        <Link
          to="/"
          className="block mt-6 text-xs text-[#F5F1E8]/60 hover:text-[#F5F1E8] underline text-center"
        >
          ← Torna al sito
        </Link>
      </div>
    </div>
  );
}
