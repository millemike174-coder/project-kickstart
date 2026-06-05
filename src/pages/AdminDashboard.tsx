import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';

type Booking = {
  id: string;
  studio: 'piccolo' | 'ssg' | 'videomaker';
  date: string;
  start_time: string;
  end_time: string;
  total: number;
  addons: string[];
  email: string | null;
  status: 'confirmed' | 'cancelled' | 'pending';
  videomaker: boolean;
  videomaker_days: number;
  vfx_ai_seconds: number;
  deposit_paid: boolean;
  final_paid: boolean;
  created_at: string;
};

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}
function formatDateIT(d: string) {
  if (!d || !d.includes('-')) return d || '—';
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
}

function normalizeBooking(row: Record<string, unknown>): Booking {
  const rawStudio = row.studio;
  const studio: Booking['studio'] =
    rawStudio === 'ssg' || rawStudio === 'videomaker' ? rawStudio : 'piccolo';
  return {
    id: String(row.id ?? crypto.randomUUID()),
    studio,
    date: String(row.date ?? ''),
    start_time: String(row.start_time ?? ''),
    end_time: String(row.end_time ?? ''),
    total: Number(row.total ?? 0),
    addons: Array.isArray(row.addons) ? row.addons.map(String) : [],
    email: typeof row.email === 'string' ? row.email : null,
    status: row.status === 'cancelled' || row.status === 'pending' ? row.status : 'confirmed',
    videomaker: Boolean(row.videomaker),
    videomaker_days: Number(row.videomaker_days ?? 0),
    vfx_ai_seconds: Number(row.vfx_ai_seconds ?? 0),
    deposit_paid: Boolean(row.deposit_paid),
    final_paid: Boolean(row.final_paid),
    created_at: String(row.created_at ?? ''),
  };
}

const PAGE = 20;

export default function AdminDashboard() {
  const { user, loading: authLoading, isAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(startOfMonth());
  const [to, setTo] = useState(endOfMonth());
  const [studio, setStudio] = useState<'all' | 'piccolo' | 'ssg' | 'videomaker'>('all');
  const [status, setStatus] = useState<'all' | 'confirmed' | 'cancelled' | 'pending'>('all');
  const [onlyVm, setOnlyVm] = useState(false);
  const [onlyVfx, setOnlyVfx] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [dayFilter, setDayFilter] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setDataError(null);
    try {
      let q = supabase
        .from('bookings')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false });
      if (studio !== 'all') q = q.eq('studio', studio);
      if (status !== 'all') q = q.eq('status', status);
      if (onlyVm) q = q.eq('videomaker', true);
      if (onlyVfx) q = q.gt('vfx_ai_seconds', 0);
      const { data, error } = await q;
      if (error) {
        setDataError('Prenotazioni non disponibili al momento.');
        toast.error('Errore caricamento prenotazioni');
        setBookings([]);
        return;
      }
      setBookings((data ?? []).map((row) => normalizeBooking(row as Record<string, unknown>)));
      setPage(0);
    } catch (error) {
      console.error('Admin dashboard load error', error);
      setDataError('Prenotazioni non disponibili al momento.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, from, to, studio, status, onlyVm, onlyVfx]);

  const filtered = useMemo(() => {
    if (!dayFilter) return bookings;
    return bookings.filter((b) => b.date === dayFilter);
  }, [bookings, dayFilter]);

  const paginated = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));

  // Stats
  const stats = useMemo(() => {
    const confirmed = bookings.filter((b) => b.status === 'confirmed');
    const rev = confirmed.reduce((s, b) => s + Number(b.total || 0), 0);
    const ssg = confirmed.filter((b) => b.studio === 'ssg').length;
    const piccolo = confirmed.filter((b) => b.studio === 'piccolo').length;
    const vm = bookings.filter((b) => b.studio === 'videomaker' && b.status !== 'cancelled').length;
    return {
      count: confirmed.length,
      revenue: rev,
      ssg,
      piccolo,
      vm,
    };
  }, [bookings]);

  // Mini calendar — count per day for filter range month
  const monthDays = useMemo(() => {
    const start = new Date(from);
    const days: { date: string; count: number }[] = [];
    const last = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= last; i++) {
      const dd = new Date(start.getFullYear(), start.getMonth(), i)
        .toISOString()
        .slice(0, 10);
      days.push({ date: dd, count: bookings.filter((b) => b.date === dd).length });
    }
    return days;
  }, [bookings, from]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const togglePaid = async (b: Booking, field: 'deposit_paid' | 'final_paid') => {
    const next = !b[field];
    const patch = { [field]: next } as any;
    const { error } = await supabase.from('bookings').update(patch).eq('id', b.id);
    if (error) return toast.error('Errore aggiornamento');
    setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, [field]: next } : x)));
  };

  const cancelBooking = async (b: Booking) => {
    if (!confirm(`Cancellare prenotazione del ${formatDateIT(b.date)} ${b.start_time}?`)) return;
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', b.id);
    if (error) return toast.error('Errore cancellazione');
    setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: 'cancelled' } : x)));
    toast.success('Prenotazione cancellata');
  };

  const requestBalance = async (b: Booking) => {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { booking_id: b.id, payment_type: 'balance' },
    });
    const respErr = (data as any)?.error;
    const url = (data as any)?.checkout_url || (data as any)?.url;
    if (error || respErr || !url) {
      toast.error(respErr || error?.message || 'Errore creazione link saldo');
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link saldo copiato — mandalo al cliente');
    } catch {
      window.prompt('Copia il link saldo:', url);
    }
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
        <div className="font-display uppercase text-lg">Trenches Records · Dashboard</div>
        <div className="flex items-center gap-3 text-xs">
          <span className="opacity-60 hidden sm:inline">{user?.email}</span>
          <Link
            to="/admin/studios"
            className="px-3 py-1.5 rounded-full border border-white/30 hover:border-[#E8DCC8] transition-colors"
          >
            Studi
          </Link>
          <button
            onClick={signOut}
            className="px-3 py-1.5 rounded-full bg-[#E8DCC8] text-[#0A0908] hover:bg-[#F5F1E8] transition-colors"
          >
            Esci
          </button>
        </div>
      </header>

      <main className="px-5 sm:px-8 py-8 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
          <StatCard label="Prenotazioni mese" value={String(stats.count)} />
          <StatCard label="Revenue mese" value={`€${stats.revenue.toFixed(0)}`} />
          <StatCard label="Studio SSG" value={String(stats.ssg)} />
          <StatCard label="Studio Piccolo" value={String(stats.piccolo)} />
          <StatCard label="Videomaker" value={String(stats.vm)} />
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-white/10 p-4 sm:p-5 mb-6 flex flex-wrap gap-3 items-end">
          <Field label="Da">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-sm"
              style={{ colorScheme: 'dark' }}
            />
          </Field>
          <Field label="A">
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-sm"
              style={{ colorScheme: 'dark' }}
            />
          </Field>
          <Field label="Risorsa">
            <select
              value={studio}
              onChange={(e) => setStudio(e.target.value as any)}
              className="bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Tutte</option>
              <option value="ssg">SSG</option>
              <option value="piccolo">Piccolo</option>
              <option value="videomaker">Videomaker</option>
            </select>
          </Field>
          <Field label="Stato">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Tutti</option>
              <option value="confirmed">Confermate</option>
              <option value="cancelled">Cancellate</option>
              <option value="pending">In attesa</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-xs cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={onlyVm}
              onChange={(e) => setOnlyVm(e.target.checked)}
              className="accent-[#E8DCC8]"
            />
            Solo con videomaker
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={onlyVfx}
              onChange={(e) => setOnlyVfx(e.target.checked)}
              className="accent-[#E8DCC8]"
            />
            Includi VFX
          </label>
        </div>

        {dayFilter && (
          <div className="mb-3 text-xs flex items-center gap-2">
            Filtro giorno: <b>{formatDateIT(dayFilter)}</b>
            <button
              onClick={() => setDayFilter(null)}
              className="underline opacity-70 hover:opacity-100"
            >
              rimuovi
            </button>
          </div>
        )}

        {dataError && <div className="mb-3 text-xs text-red-300/90">{dataError}</div>}

        {/* Table */}
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-[#E8DCC8]">
                <tr>
                  <Th>Data</Th>
                  <Th>Orario</Th>
                  <Th>Studio</Th>
                  <Th>Email</Th>
                  <Th>Totale</Th>
                  <Th>Add-on</Th>
                  <Th>Videomaker</Th>
                  <Th>Acconto</Th>
                  <Th>Saldo</Th>
                  <Th>Stato</Th>
                  <Th>Azioni</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 opacity-60">
                      Caricamento…
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 opacity-60">
                      Nessuna prenotazione
                    </td>
                  </tr>
                ) : (
                  paginated.map((b, i) => (
                    <tr
                      key={b.id}
                      className={i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}
                    >
                      <Td>{formatDateIT(b.date)}</Td>
                      <Td>
                        {(b.start_time || '—').slice(0, 5)}–{(b.end_time || '—').slice(0, 5)}
                      </Td>
                      <Td className="uppercase">{b.studio}</Td>
                      <Td className="opacity-80">{b.email ?? '—'}</Td>
                      <Td>€{Number(b.total).toFixed(0)}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {(b.addons ?? []).length === 0 && '—'}
                          {(b.addons ?? []).map((a) => (
                            <span
                              key={a}
                              className="text-[10px] uppercase tracking-wider bg-[#E8DCC8]/10 border border-[#E8DCC8]/30 px-1.5 py-0.5 rounded"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </Td>
                      <Td>
                        {!b.videomaker
                          ? '—'
                          : `Sì · ${b.videomaker_days}d${
                              b.vfx_ai_seconds > 0 ? ` · VFX ${b.vfx_ai_seconds}s` : ''
                            }`}
                      </Td>
                      <Td>
                        <button onClick={() => togglePaid(b, 'deposit_paid')}>
                          {b.deposit_paid ? '✓' : '✗'}
                        </button>
                      </Td>
                      <Td>
                        <button onClick={() => togglePaid(b, 'final_paid')}>
                          {b.final_paid ? '✓' : '✗'}
                        </button>
                      </Td>
                      <Td>
                        <span
                          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${
                            b.status === 'confirmed'
                              ? 'border-green-500/40 text-green-300 bg-green-500/10'
                              : b.status === 'cancelled'
                              ? 'border-red-500/40 text-red-300 bg-red-500/10'
                              : 'border-yellow-500/40 text-yellow-300 bg-yellow-500/10'
                          }`}
                        >
                          {b.status}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setDetail(b)}
                            className="text-xs underline opacity-80 hover:opacity-100"
                          >
                            Dettagli
                          </button>
                          {b.deposit_paid && !b.final_paid && b.status !== 'cancelled' && (
                            <button
                              onClick={() => requestBalance(b)}
                              className="text-xs underline text-[#E8DCC8] hover:text-white"
                            >
                              Richiedi saldo 50%
                            </button>
                          )}
                          {b.status !== 'cancelled' && (
                            <button
                              onClick={() => cancelBooking(b)}
                              className="text-xs underline text-red-300/80 hover:text-red-300"
                            >
                              Cancella
                            </button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex justify-between items-center p-3 text-xs border-t border-white/10">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-full border border-white/20 disabled:opacity-30"
              >
                ← Prec
              </button>
              <span className="opacity-60">
                Pagina {page + 1} / {pages}
              </span>
              <button
                disabled={page + 1 >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-full border border-white/20 disabled:opacity-30"
              >
                Succ →
              </button>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="mt-8 rounded-2xl border border-white/10 p-5">
          <div className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-3">
            Calendario · clic su un giorno per filtrare
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {monthDays.map((d) => {
              const day = Number(d.date.slice(-2));
              const active = dayFilter === d.date;
              return (
                <button
                  key={d.date}
                  onClick={() => setDayFilter(active ? null : d.date)}
                  className={`aspect-square rounded-lg border text-xs flex flex-col items-center justify-center transition-colors ${
                    active
                      ? 'border-[#E8DCC8] bg-[#E8DCC8]/15'
                      : d.count > 0
                      ? 'border-[#E8DCC8]/30 bg-[#E8DCC8]/5 hover:border-[#E8DCC8]/60'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <span>{day}</span>
                  {d.count > 0 && (
                    <span className="text-[9px] opacity-70">{d.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {detail && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-[#0F0E0C] border border-white/15 rounded-3xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display uppercase text-xl mb-4">Dettagli prenotazione</h3>
            <pre className="text-xs whitespace-pre-wrap opacity-80">
              {JSON.stringify(detail, null, 2)}
            </pre>
            <button
              onClick={() => setDetail(null)}
              className="mt-4 w-full rounded-full bg-[#E8DCC8] text-[#0A0908] px-4 py-2 text-xs uppercase tracking-widest"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0F0E0C] p-5">
      <div className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-2">{label}</div>
      <div className="font-display text-3xl">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-[#E8DCC8]">{label}</span>
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-2.5 whitespace-nowrap">{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 whitespace-nowrap ${className}`}>{children}</td>;
}
