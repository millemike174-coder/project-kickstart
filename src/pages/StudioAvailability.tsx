import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';

type Block = {
  id: string;
  studio: 'piccolo' | 'ssg';
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
};

const STUDIOS: { id: 'ssg' | 'piccolo'; name: string }[] = [
  { id: 'ssg', name: 'Studio SSG' },
  { id: 'piccolo', name: 'Studio Piccolo' },
];

function formatDateIT(d: string) {
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
}

export default function StudioAvailability() {
  const { isAdmin, loading: authLoading, user } = useAdminAuth();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalStudio, setModalStudio] = useState<'ssg' | 'piccolo' | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('studio_blocks')
      .select('*')
      .order('start_date', { ascending: true });
    if (error) toast.error('Errore caricamento');
    setBlocks((data ?? []) as Block[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const today = new Date().toISOString().slice(0, 10);

  const activeBlockFor = (studio: 'ssg' | 'piccolo') => {
    return blocks.find(
      (b) => b.studio === studio && b.start_date <= today && b.end_date >= today
    );
  };

  const submitBlock = async () => {
    if (!modalStudio || !startDate || !endDate) {
      toast.error('Compila tutti i campi');
      return;
    }
    if (endDate < startDate) {
      toast.error('La data fine deve essere ≥ data inizio');
      return;
    }
    const { error } = await supabase.from('studio_blocks').insert({
      studio: modalStudio,
      start_date: startDate,
      end_date: endDate,
      reason: reason || null,
    });
    if (error) return toast.error('Errore salvataggio');
    toast.success('Blocco creato');
    setModalStudio(null);
    setStartDate('');
    setEndDate('');
    setReason('');
    load();
  };

  const deleteBlock = async (id: string) => {
    if (!confirm('Eliminare questo blocco?')) return;
    const { error } = await supabase.from('studio_blocks').delete().eq('id', id);
    if (error) return toast.error('Errore eliminazione');
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0A0908] text-[#F5F1E8] flex items-center justify-center">
        <p className="text-sm opacity-60">Caricamento…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#F5F1E8]">
      <header className="border-b border-white/10 px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="font-display uppercase text-lg">Disponibilità Studi</div>
        <div className="flex items-center gap-3 text-xs">
          <span className="opacity-60 hidden sm:inline">{user?.email}</span>
          <Link
            to="/admin/dashboard"
            className="px-3 py-1.5 rounded-full border border-white/30 hover:border-[#E8DCC8] transition-colors"
          >
            Dashboard
          </Link>
          <button
            onClick={signOut}
            className="px-3 py-1.5 rounded-full bg-[#E8DCC8] text-[#0A0908] hover:bg-[#F5F1E8] transition-colors"
          >
            Esci
          </button>
        </div>
      </header>

      <main className="px-5 sm:px-8 py-8 max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {STUDIOS.map((s) => {
            const blk = activeBlockFor(s.id);
            return (
              <div
                key={s.id}
                className="rounded-2xl border border-white/10 bg-[#0F0E0C] p-6"
              >
                <h3 className="font-display uppercase text-2xl mb-2">{s.name}</h3>
                <p className="text-sm mb-4">
                  Stato:{' '}
                  {blk ? (
                    <span className="text-red-300">
                      Chiuso fino al {formatDateIT(blk.end_date)}
                    </span>
                  ) : (
                    <span className="text-green-300">Aperto</span>
                  )}
                </p>
                <button
                  onClick={() => setModalStudio(s.id)}
                  className="rounded-full bg-[#E8DCC8] text-[#0A0908] px-4 py-2 text-xs uppercase tracking-widest hover:bg-[#F5F1E8] transition-colors"
                >
                  Blocca date
                </button>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 text-[10px] uppercase tracking-widest text-[#E8DCC8]">
            Blocchi attivi
          </div>
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-[#E8DCC8]">
              <tr>
                <th className="text-left px-4 py-2.5">Studio</th>
                <th className="text-left px-4 py-2.5">Da</th>
                <th className="text-left px-4 py-2.5">A</th>
                <th className="text-left px-4 py-2.5">Motivo</th>
                <th className="text-left px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 opacity-60">
                    Caricamento…
                  </td>
                </tr>
              ) : blocks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 opacity-60">
                    Nessun blocco attivo
                  </td>
                </tr>
              ) : (
                blocks.map((b, i) => (
                  <tr key={b.id} className={i % 2 ? 'bg-white/[0.02]' : ''}>
                    <td className="px-4 py-2.5 uppercase">{b.studio}</td>
                    <td className="px-4 py-2.5">{formatDateIT(b.start_date)}</td>
                    <td className="px-4 py-2.5">{formatDateIT(b.end_date)}</td>
                    <td className="px-4 py-2.5 opacity-80">{b.reason ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => deleteBlock(b.id)}
                        className="text-xs underline text-red-300/80 hover:text-red-300"
                      >
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {modalStudio && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setModalStudio(null)}
        >
          <div
            className="bg-[#0F0E0C] border border-white/15 rounded-3xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display uppercase text-xl mb-4">
              Blocca {modalStudio === 'ssg' ? 'Studio SSG' : 'Studio Piccolo'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-1.5 block">
                  Da
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-1.5 block">
                  A
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-1.5 block">
                  Motivo
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="es. Manutenzione"
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setModalStudio(null)}
                className="flex-1 rounded-full border border-white/30 px-4 py-2.5 text-xs uppercase tracking-widest"
              >
                Annulla
              </button>
              <button
                onClick={submitBlock}
                className="flex-1 rounded-full bg-[#E8DCC8] text-[#0A0908] px-4 py-2.5 text-xs uppercase tracking-widest"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
