import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  email: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordForm({ email, onClose, onSuccess }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return toast.error('La nuova password deve essere almeno 8 caratteri');
    if (next !== confirm) return toast.error('Le password non coincidono');
    setLoading(true);
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (signErr) {
        toast.error('Password attuale non corretta');
        return;
      }
      const { error: updErr } = await supabase.auth.updateUser({ password: next });
      if (updErr) {
        toast.error(updErr.message || 'Errore aggiornamento password');
        return;
      }
      toast.success('Password aggiornata');
      onSuccess();
    } catch (err) {
      console.error('change password error', err);
      toast.error('Errore aggiornamento password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-2 block">
          Password attuale
        </label>
        <input
          type="password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[#E8DCC8] transition-colors text-sm"
        />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-2 block">
          Nuova password (min 8)
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[#E8DCC8] transition-colors text-sm"
        />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-2 block">
          Conferma nuova password
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[#E8DCC8] transition-colors text-sm"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full border border-white/20 px-4 py-2.5 text-xs uppercase tracking-widest hover:border-white/40 transition-colors"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-full bg-[#E8DCC8] text-[#0A0908] px-4 py-2.5 text-xs uppercase tracking-widest font-medium hover:bg-[#F5F1E8] transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvataggio…' : 'Aggiorna'}
        </button>
      </div>
    </form>
  );
}
