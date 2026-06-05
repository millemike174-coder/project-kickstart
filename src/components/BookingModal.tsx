import { useEffect, useState } from 'react';
import { X, ArrowRight, Check, AlertCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';


const toMinutes = (t: string) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// Strict overlap: edge-touching (12-14 / 14-16) is allowed.
const overlaps = (
  startA: string,
  endA: string,
  startB: string,
  endB: string
) => {
  const aS = toMinutes(startA);
  const aE = toMinutes(endA);
  const bS = toMinutes(startB);
  const bE = toMinutes(endB);
  return aS < bE && aE > bS;
};

type StudioId = 'piccolo' | 'ssg';
type ResourceId = StudioId | 'videomaker';

type Studio = {
  id: StudioId;
  name: string;
  rate: number;
  tag: string;
};

const STUDIOS: Studio[] = [
  { id: 'piccolo', name: 'Studio Piccolo', rate: 35, tag: 'Red Room' },
  { id: 'ssg', name: 'Studio SSG', rate: 60, tag: 'Flagship' },
];

type Addon = { id: string; name: string; rate: number };

const ADDONS: Addon[] = [
  { id: 'producer', name: 'Producer in sessione', rate: 20 },
  { id: 'fonico', name: 'Sound engineer', rate: 25 },
];

type Props = {
  open: boolean;
  onClose: () => void;
  initialVideomaker?: boolean;
};

function formatDateIT(d: string) {
  if (!d) return '';
  const [year, month, day] = d.split('-');
  return `${day}/${month}/${year}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start text-sm gap-4">
      <span className="uppercase tracking-widest text-[10px] opacity-60 mt-0.5">
        {label}
      </span>
      <span className="text-[#F5F1E8] text-right">{value}</span>
    </div>
  );
}

// videomaker pricing
function videomakerPrice(days: number, vfxSeconds: number) {
  if (days <= 0) return 0;
  const base = 800 + Math.max(0, days - 1) * 400;
  const vfx = vfxSeconds > 0 ? 200 : 0;
  return base + vfx;
}

type BlockRow = {
  start_date: string;
  end_date: string;
  reason: string | null;
};

type BusyRow = {
  start_time: string;
  end_time: string;
};

export default function BookingModal({ open, onClose, initialVideomaker = false }: Props) {
  // Mode is locked when the modal opens — Videomaker is a fully separate flow
  // from the two studios. No mixing across resources.
  const mode: 'studio' | 'videomaker' = initialVideomaker ? 'videomaker' : 'studio';

  const [studio, setStudio] = useState<StudioId>('piccolo');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [addons, setAddons] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  // Videomaker pricing inputs (only relevant in videomaker mode)
  const [vmDays, setVmDays] = useState(1);
  const [vfxOn, setVfxOn] = useState(false);
  const [vfxSec, setVfxSec] = useState(4);

  // From DB — always scoped to the currently selected resource only.
  const [busySlots, setBusySlots] = useState<BusyRow[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // The resource being booked — drives the conflict query.
  const resource: ResourceId = mode === 'videomaker' ? 'videomaker' : studio;

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setStep('form'), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Fetch busy slots + blocks for THIS resource on the selected date.
  // Conflicts are strictly per-resource — no cross-resource blocking.
  useEffect(() => {
    if (!open || !date) {
      setBusySlots([]);
      setBlocks([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const [bookingsRes, blocksRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('start_time,end_time')
          .eq('studio', resource)
          .eq('date', date)
          .eq('status', 'confirmed'),
        supabase
          .from('studio_blocks')
          .select('start_date,end_date,reason')
          .eq('studio', resource)
          .lte('start_date', date)
          .gte('end_date', date),
      ]);
      if (cancelled) return;
      setBusySlots((bookingsRes.data ?? []) as BusyRow[]);
      setBlocks((blocksRes.data ?? []) as BlockRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, resource, date]);

  if (!open) return null;

  const currentStudio = STUDIOS.find((s) => s.id === studio)!;

  const computeHours = () => {
    if (!startTime || !endTime) return 0;
    return (toMinutes(endTime) - toMinutes(startTime)) / 60;
  };
  const hours = Math.max(0, computeHours());

  // Pricing: studios charge by hour + addons; videomaker uses its own formula.
  const studioTotal = mode === 'studio' ? hours * currentStudio.rate : 0;
  const addonsTotal =
    mode === 'studio'
      ? addons.reduce((sum, id) => {
          const a = ADDONS.find((x) => x.id === id);
          return sum + (a ? a.rate * hours : 0);
        }, 0)
      : 0;
  const vmTotal = mode === 'videomaker' ? videomakerPrice(vmDays, vfxOn ? vfxSec : 0) : 0;
  const total = studioTotal + addonsTotal + vmTotal;

  // Duration rules: min 2h always; videomaker also capped at 10h.
  const minHoursOk = hours >= 2;
  const maxHoursOk = mode === 'videomaker' ? hours <= 10 : true;
  const validHours = minHoursOk && maxHoursOk;

  const hasConflict =
    !!date && !!startTime && !!endTime && validHours
      ? busySlots.some((b) =>
          overlaps(startTime, endTime, b.start_time.slice(0, 5), b.end_time.slice(0, 5))
        )
      : false;

  const isBlocked = blocks.length > 0;
  const blockReason = blocks[0]?.reason ?? '';

  const validForm =
    !!date && !!startTime && !!endTime && validHours && !hasConflict && !isBlocked;

  const toggleAddon = (id: string) =>
    setAddons((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleConfirm = () => {
    if (!date) return toast.error('Seleziona una data');
    if (!startTime || !endTime) return toast.error('Seleziona orario di inizio e fine');
    if (!minHoursOk) return toast.error('Minimo 2 ore di booking');
    if (!maxHoursOk) return toast.error('Massimo 10 ore per il videomaker');
    if (isBlocked) return toast.error('Risorsa non disponibile in questa data');
    if (hasConflict) return toast.error('Questo orario è già prenotato');
    setStep('confirm');
  };

  const handlePayment = async () => {
    setSubmitting(true);
    try {
      const { data: createData, error: createErr } = await supabase.functions.invoke('create-booking', {
        body: {
          studio: resource,
          date,
          start_time: startTime,
          end_time: endTime,
          total,
          addons: mode === 'studio' ? addons : [],
          email: email || null,
          videomaker: mode === 'videomaker',
          videomaker_days: mode === 'videomaker' ? vmDays : 0,
          vfx_ai_seconds: mode === 'videomaker' && vfxOn ? vfxSec : 0,
        },
      });
      const createRespErr = (createData as any)?.error;
      const booking_id = (createData as any)?.booking_id;
      if (createErr || createRespErr || !booking_id) {
        toast.error(createRespErr || createErr?.message || 'Errore durante la prenotazione, riprova o scrivici su Instagram');
        setSubmitting(false);
        return;
      }

      // Studio bookings: confirmed immediately, no Stripe.
      if (mode === 'studio') {
        window.location.href = `/booking-success?booking_id=${booking_id}`;
        return;
      }

      // Videomaker: 50% deposit via Stripe.
      const { data: payData, error: payErr } = await supabase.functions.invoke('create-checkout-session', {
        body: { booking_id, payment_type: 'deposit' },
      });
      const payRespErr = (payData as any)?.error;
      const url = (payData as any)?.checkout_url || (payData as any)?.url;
      if (payErr || payRespErr || !url) {
        toast.error(payRespErr || payErr?.message || 'Errore con il pagamento, riprova o scrivici su Instagram');
        setSubmitting(false);
        return;
      }
      window.location.href = url;
    } catch (_e) {
      setSubmitting(false);
      toast.error('Errore con il pagamento, riprova o scrivici su Instagram');
    }
  };


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <style>{`
        @keyframes bm-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes bm-slide { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        style={{ animation: 'bm-fade 0.2s ease-out' }}
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-lg bg-[#0F0E0C] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ animation: 'bm-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'form' ? (
          <>
            <h2 className="font-display uppercase text-2xl sm:text-3xl mb-1">
              {mode === 'videomaker' ? 'Prenota videomaker' : 'Prenota'}
            </h2>
            <p className="text-sm text-[#F5F1E8]/60 mb-6">
              {mode === 'videomaker'
                ? 'Calendario indipendente — non blocca gli studi'
                : 'Scegli sala, data e orario'}
            </p>

            {/* Sala — solo studio mode */}
            {mode === 'studio' && (
              <div className="mb-5">
                <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-2 block">
                  Sala
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STUDIOS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStudio(s.id)}
                      className={`text-left p-4 rounded-2xl border transition-colors ${
                        studio === s.id
                          ? 'border-[#E8DCC8] bg-[#E8DCC8]/10'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-widest text-[#E8DCC8]">
                        {s.tag}
                      </div>
                      <div className="font-display text-lg mt-1">{s.name}</div>
                      <div className="text-sm mt-1 text-[#F5F1E8]/70">€{s.rate}/h</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Data */}
            <div className="mb-4">
              <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-2 block">
                Data
              </label>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-[#F5F1E8] focus:outline-none focus:border-[#E8DCC8] transition-colors"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Block warning */}
            {isBlocked && (
              <div className="mb-4 p-3 rounded-xl border border-red-500/40 bg-red-500/10 flex gap-2 items-start">
                <Lock className="w-4 h-4 text-red-300 mt-0.5 shrink-0" />
                <div className="text-xs text-red-200">
                  {mode === 'videomaker'
                    ? 'Videomaker non disponibile in questa data.'
                    : 'Lo studio non è disponibile in questa data.'}
                  {blockReason && (
                    <>
                      {' '}
                      Motivo: <b>{blockReason}</b>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Busy slots */}
            {date && !isBlocked && busySlots.length > 0 && (
              <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-red-300 mb-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Orari già prenotati
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {busySlots.map((b, i) => (
                    <span
                      key={i}
                      className="text-xs bg-red-500/15 text-red-200 border border-red-500/30 px-2 py-0.5 rounded-md"
                    >
                      {b.start_time.slice(0, 5)} → {b.end_time.slice(0, 5)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Orari */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-2 block">
                  Dalle
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-[#F5F1E8] focus:outline-none focus:border-[#E8DCC8] transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-2 block">
                  Alle
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-[#F5F1E8] focus:outline-none focus:border-[#E8DCC8] transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div className="mb-5 min-h-[22px] text-xs">
              {hours > 0 && !minHoursOk && (
                <div className="text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Minimo 2 ore (selezionate: {hours.toFixed(1)}h)
                </div>
              )}
              {minHoursOk && !maxHoursOk && (
                <div className="text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Massimo 10 ore per il videomaker (selezionate: {hours.toFixed(1)}h)
                </div>
              )}
              {validHours && hasConflict && (
                <div className="text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Questo orario è già prenotato.
                </div>
              )}
              {validHours && !hasConflict && !isBlocked && (
                <div className="text-[#E8DCC8] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Durata: {hours.toFixed(hours % 1 === 0 ? 0 : 1)} ore
                </div>
              )}
            </div>

            {/* Email */}
            <div className="mb-5">
              <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-2 block">
                Email (opzionale)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@email.com"
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-[#F5F1E8] focus:outline-none focus:border-[#E8DCC8] transition-colors"
              />
            </div>

            {/* Add-on — solo studio mode */}
            {mode === 'studio' && (
              <div className="mb-5">
                <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-2 block">
                  Add-on opzionali
                </label>
                <div className="space-y-2">
                  {ADDONS.map((a) => (
                    <label
                      key={a.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        addons.includes(a.id)
                          ? 'border-[#E8DCC8]/50 bg-[#E8DCC8]/5'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={addons.includes(a.id)}
                          onChange={() => toggleAddon(a.id)}
                          className="w-4 h-4 accent-[#E8DCC8]"
                        />
                        <span className="text-sm">{a.name}</span>
                      </div>
                      <span className="text-sm text-[#F5F1E8]/60">+€{a.rate}/h</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Videomaker config — solo videomaker mode */}
            {mode === 'videomaker' && (
              <div className="mb-6 rounded-2xl border border-white/10 p-4 space-y-4 bg-black/20">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-1.5 block">
                    Numero giorni
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={vmDays}
                    onChange={(e) =>
                      setVmDays(Math.max(1, Math.min(10, Number(e.target.value) || 1)))
                    }
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5"
                  />
                  <p className="text-[11px] text-[#F5F1E8]/55 mt-1.5">
                    €800 primo giorno + €400 per ogni giorno successivo (max 10h/giorno)
                  </p>
                </div>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">Aggiungi VFX AI</span>
                  <input
                    type="checkbox"
                    checked={vfxOn}
                    onChange={(e) => setVfxOn(e.target.checked)}
                    className="w-4 h-4 accent-[#E8DCC8]"
                  />
                </label>

                {vfxOn && (
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#E8DCC8] mb-1.5 block">
                      Secondi VFX
                    </label>
                    <input
                      type="number"
                      min={4}
                      max={15}
                      value={vfxSec}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 4;
                        if (v > 15) {
                          toast.message('Oltre 15s, quotato su richiesta');
                          setVfxSec(15);
                        } else {
                          setVfxSec(Math.max(4, Math.min(15, v)));
                        }
                      }}
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5"
                    />
                    <p className="text-[11px] text-[#F5F1E8]/55 mt-1.5">
                      €200 per pacchetto 4–15s. Oltre 15s, scrivici
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-xs uppercase tracking-widest opacity-70">
                    Totale videomaker
                  </span>
                  <span className="font-display text-xl">
                    €{videomakerPrice(vmDays, vfxOn ? vfxSec : 0)}
                  </span>
                </div>

                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-[11px] text-[#F5F1E8]/55 leading-relaxed">
                  Pagamento: 50% acconto alla conferma + 50% saldo il giorno del
                  servizio. Costi extra a carico del cliente: noleggio
                  location/auto/attrezzatura specifica, modelle/attori/comparse,
                  vitto/alloggio/trasferte.
                </div>
              </div>
            )}

            {validForm && (
              <div className="mb-6 p-4 rounded-2xl bg-[#E8DCC8]/5 border border-[#E8DCC8]/20 flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest opacity-70">
                  Totale stimato
                </span>
                <span className="font-display text-2xl">€{total.toFixed(0)}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#E8DCC8] text-[#0A0908] px-6 py-3.5 text-sm uppercase tracking-widest font-medium hover:bg-[#F5F1E8] transition-colors ${validForm ? '' : 'opacity-60'}`}
            >
              Continua
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <h2 className="font-display uppercase text-2xl sm:text-3xl mb-1">Conferma</h2>
            <p className="text-sm text-[#F5F1E8]/60 mb-6">
              Controlla i dati prima di procedere
            </p>

            <div className="space-y-3.5 mb-6 p-5 rounded-2xl bg-black/30 border border-white/10">
              <Row
                label="Risorsa"
                value={mode === 'videomaker' ? 'Videomaker' : currentStudio.name}
              />
              <Row label="Data" value={formatDateIT(date)} />
              <Row label="Orario" value={`${startTime} → ${endTime}`} />
              <Row
                label="Durata"
                value={`${hours.toFixed(hours % 1 === 0 ? 0 : 1)} ore`}
              />
              {mode === 'studio' && addons.length > 0 && (
                <Row
                  label="Add-on"
                  value={addons
                    .map((id) => ADDONS.find((a) => a.id === id)?.name || '')
                    .join(', ')}
                />
              )}
              {mode === 'videomaker' && (
                <Row
                  label="Pacchetto"
                  value={`${vmDays} giorn${vmDays > 1 ? 'i' : 'o'}${
                    vfxOn ? ` · VFX ${vfxSec}s` : ''
                  }`}
                />
              )}
              {email && <Row label="Email" value={email} />}
              <div className="border-t border-white/10 pt-3.5 mt-1 flex justify-between items-center">
                <span className="font-display uppercase text-sm">Totale</span>
                <span className="font-display text-3xl text-[#E8DCC8]">
                  €{total.toFixed(0)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePayment}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#E8DCC8] text-[#0A0908] px-6 py-3.5 text-sm uppercase tracking-widest font-medium hover:bg-[#F5F1E8] transition-colors mb-3 disabled:opacity-50"
            >
              {submitting
                ? (mode === 'videomaker' ? 'Reindirizzamento al pagamento…' : 'Conferma in corso…')
                : (mode === 'videomaker' ? 'Paga acconto videomaker (50%)' : 'Conferma prenotazione')}
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-full text-xs text-[#F5F1E8]/60 hover:text-[#F5F1E8] underline py-2 transition-colors"
            >
              ← Modifica prenotazione
            </button>
          </>
        )}
      </div>
    </div>
  );
}
