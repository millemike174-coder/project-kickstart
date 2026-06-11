import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function AdminResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase recovery link sets a session via hash params; listen for it
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Min 8 caratteri');
    if (password !== confirm) return toast.error('Le password non coincidono');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message || 'Errore reset password');
        return;
      }
      toast.success('Password aggiornata, accedi di nuovo');
      await supabase.auth.signOut();
      navigate('/admin/login', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#F5F1E8] flex items-center justify-center px-5">
      <div className="w-full max-w-md bg-[#0F0E0C] border border-white/10 rounded-3xl p-8 sm:p-10">
        <h1 className="font-display uppercase text-3xl sm:text-4xl mb-1">Reset password</h1>
        <p className="text-sm text-[#F5F1E8]/60 mb-8">
          Imposta una nuova password per il tuo account admin
        </p>

        {!ready ? (
          <p className="text-sm opacity-70">
            Apri questa pagina dal link ricevuto via email per impostare una nuova password.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-2 block">
                Nuova password (min 8)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[#E8DCC8] transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-2 block">
                Conferma password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[#E8DCC8] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#E8DCC8] text-[#0A0908] px-6 py-3.5 text-sm uppercase tracking-widest font-medium hover:bg-[#F5F1E8] transition-colors disabled:opacity-50"
            >
              {loading ? 'Aggiorno…' : 'Imposta nuova password'}
            </button>
          </form>
        )}

        <Link
          to="/admin/login"
          className="block mt-6 text-xs text-[#F5F1E8]/60 hover:text-[#F5F1E8] underline text-center"
        >
          ← Torna al login
        </Link>
      </div>
    </div>
  );
}
