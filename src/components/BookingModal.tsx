import { useEffect, useMemo, useState } from 'react';
import { X, ArrowRight, Check, AlertCircle } from 'lucide-react';

// ─── CONFIGURAZIONE PAGAMENTO ────────────────────────────────────────────
// Sostituire con il Stripe Payment Link reale quando creato.
// Esempio: https://buy.stripe.com/test_aBc123def456
const PAYMENT_URL = 'https://buy.stripe.com/PLACEHOLDER';

// ─── STORAGE DELLE PRENOTAZIONI ──────────────────────────────────────────
// Per ora salviamo localmente nel browser (localStorage). Funziona come demo
// ma NON previene conflitti tra dispositivi diversi.
// Per produzione: sostituire le funzioni saveBooking / loadBookings con
// chiamate ad un backend (Supabase, Firebase, ecc.).
const STORAGE_KEY = 'trenches_bookings_v1';

type StoredBooking = {
  studio: StudioId;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  total: number;
  createdAt: string; // ISO
};

function loadBookings(): StoredBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredBooking[]) : [];
  } catch {
    return [];
  }
}

function saveBooking(b: StoredBooking) {
  try {
    const all = loadBookings();
    all.push(b);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

// converte "HH:MM" in minuti dal mezzanotte
const toMinutes = (t: string) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// due intervalli si sovrappongono se start < otherEnd && end > otherStart
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

// ─── DATI ─────────────────────────────────────────────────────────────────

type StudioId = 'piccolo' | 'ssg';

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

export default function BookingModal({ open, onClose }: Props) {
  const [studio, setStudio] = useState<StudioId>('piccolo');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [addons, setAddons] = useState<string[]>([]);
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  // Force re-render quando una prenotazione viene salvata
  const [bookingsVersion, setBookingsVersion] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  // ESC chiude + blocca scroll body quando aperto
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

  // Reset stato quando si chiude
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setStep('form'), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Carica le prenotazioni di questo studio per la data scelta
  const busySlotsForDay = useMemo(() => {
    if (!date) return [];
    void bookingsVersion;
    return loadBookings()
      .filter((b) => b.studio === studio && b.date === date)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  }, [studio, date, bookingsVersion]);

  if (!open) return null;

  const currentStudio = STUDIOS.find((s) => s.id === studio)!;

  const computeHours = () => {
    if (!startTime || !endTime) return 0;
    return (toMinutes(endTime) - toMinutes(startTime)) / 60;
  };

  const hours = Math.max(0, computeHours());
  const studioTotal = hours * currentStudio.rate;
  const addonsTotal = addons.reduce((sum, id) => {
    const a = ADDONS.find((x) => x.id === id);
    return sum + (a ? a.rate * hours : 0);
  }, 0);
  const total = studioTotal + addonsTotal;

  const validHours = hours >= 2;

  // Conflict check
  const hasConflict =
    !!date && !!startTime && !!endTime && validHours
      ? busySlotsForDay.some((b) =>
          overlaps(startTime, endTime, b.start, b.end)
        )
      : false;

  const validForm =
    !!date && !!startTime && !!endTime && validHours && !hasConflict;

  const toggleAddon = (id: string) =>
    setAddons((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleConfirm = () => {
    if (!validForm) return;
    setStep('confirm');
  };

  const handlePayment = () => {
    // Salviamo localmente la prenotazione (demo)
    saveBooking({
      studio,
      date,
      start: startTime,
      end: endTime,
      total,
      createdAt: new Date().toISOString(),
    });
    setBookingsVersion((v) => v + 1);

    // Costruisci URL Stripe con i parametri della prenotazione
    const params = new URLSearchParams({
      studio: currentStudio.name,
      date,
      from: startTime,
      to: endTime,
      hours: hours.toString(),
      addons: addons.join(','),
      total: total.toFixed(2),
    });
    const url = `${PAYMENT_URL}?${params.toString()}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <style>{`
        @keyframes bm-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes bm-slide { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        style={{ animation: 'bm-fade 0.2s ease-out' }}
        onClick={onClose}
      />

      {/* Modal */}
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
              Prenota
            </h2>
            <p className="text-sm text-[#F5F1E8]/60 mb-6">
              Scegli sala, data e orario
            </p>

            {/* Sala */}
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
                    <div className="text-sm mt-1 text-[#F5F1E8]/70">
                      €{s.rate}/h
                    </div>
                  </button>
                ))}
              </div>
            </div>

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

            {/* Orari già occupati */}
            {date && busySlotsForDay.length > 0 && (
              <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-red-300 mb-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Orari già prenotati per {currentStudio.name}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {busySlotsForDay.map((b, i) => (
                    <span
                      key={i}
                      className="text-xs bg-red-500/15 text-red-200 border border-red-500/30 px-2 py-0.5 rounded-md"
                    >
                      {b.start} → {b.end}
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

            {/* Messaggi validazione */}
            <div className="mb-5 min-h-[22px] text-xs">
              {hours > 0 && !validHours && (
                <div className="text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Minimo 2 ore di booking (selezionate: {hours.toFixed(1)}h)
                </div>
              )}
              {validHours && hasConflict && (
                <div className="text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Questo orario è già prenotato. Scegli un altro slot.
                </div>
              )}
              {validHours && !hasConflict && (
                <div className="text-[#E8DCC8] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Durata: {hours.toFixed(hours % 1 === 0 ? 0 : 1)} ore
                </div>
              )}
            </div>

            {/* Add-on */}
            <div className="mb-6">
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
                    <span className="text-sm text-[#F5F1E8]/60">
                      +€{a.rate}/h
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Totale preview */}
            {validForm && (
              <div className="mb-6 p-4 rounded-2xl bg-[#E8DCC8]/5 border border-[#E8DCC8]/20 flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest opacity-70">
                  Totale stimato
                </span>
                <span className="font-display text-2xl">€{total.toFixed(0)}</span>
              </div>
            )}

            {/* Continua */}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!validForm}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#E8DCC8] text-[#0A0908] px-6 py-3.5 text-sm uppercase tracking-widest font-medium hover:bg-[#F5F1E8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continua
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            {/* CONFERMA */}
            <h2 className="font-display uppercase text-2xl sm:text-3xl mb-1">
              Conferma
            </h2>
            <p className="text-sm text-[#F5F1E8]/60 mb-6">
              Controlla i dati prima di procedere
            </p>

            <div className="space-y-3.5 mb-6 p-5 rounded-2xl bg-black/30 border border-white/10">
              <Row label="Sala" value={currentStudio.name} />
              <Row label="Tariffa" value={`€${currentStudio.rate}/h`} />
              <Row label="Data" value={formatDateIT(date)} />
              <Row label="Orario" value={`${startTime} → ${endTime}`} />
              <Row
                label="Durata"
                value={`${hours.toFixed(hours % 1 === 0 ? 0 : 1)} ore`}
              />
              {addons.length > 0 && (
                <Row
                  label="Add-on"
                  value={addons
                    .map((id) => ADDONS.find((a) => a.id === id)?.name || '')
                    .join(', ')}
                />
              )}
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
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#E8DCC8] text-[#0A0908] px-6 py-3.5 text-sm uppercase tracking-widest font-medium hover:bg-[#F5F1E8] transition-colors mb-3"
            >
              Paga con Stripe
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
