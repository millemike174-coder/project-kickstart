import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Booking = {
  id: string;
  studio: string;
  date: string;
  start_time: string;
  end_time: string;
  total: number;
  status: string;
  deposit_paid: boolean;
  final_paid: boolean;
};

function formatDateIT(d: string) {
  if (!d || !d.includes('-')) return d || '—';
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
}

export default function BookingSuccess() {
  const [params] = useSearchParams();
  const bookingId = params.get('booking_id');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase.functions.invoke('get-booking-public', {
        body: { booking_id: bookingId },
      });
      if (!error && (data as any)?.booking) {
        setBooking((data as any).booking as Booking);
      }
      setLoading(false);
    })();
  }, [bookingId]);

  const total = booking ? Number(booking.total) : 0;
  const deposit = total * 0.5;

  return (
    <main className="min-h-screen bg-[#0A0908] text-[#F5F1E8] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#E8DCC8]/10 border border-[#E8DCC8]/30 flex items-center justify-center">
          <Check className="w-7 h-7 text-[#E8DCC8]" />
        </div>
        <h1 className="font-display uppercase text-3xl sm:text-4xl mb-3">Prenotazione confermata!</h1>
        <p className="text-sm text-[#F5F1E8]/70 mb-8">
          Acconto ricevuto. Ti aspettiamo in studio.
        </p>

        {loading ? (
          <p className="text-xs opacity-60 mb-8">Caricamento dettagli…</p>
        ) : booking ? (
          <div className="text-left rounded-2xl border border-white/10 bg-[#0F0E0C] p-5 mb-8 space-y-2 text-sm">
            <Row label="Studio" value={booking.studio.toUpperCase()} />
            <Row label="Data" value={formatDateIT(booking.date)} />
            <Row
              label="Orario"
              value={`${booking.start_time.slice(0, 5)} – ${booking.end_time.slice(0, 5)}`}
            />
            <div className="border-t border-white/10 my-2" />
            <Row label="Totale" value={`€${total.toFixed(0)}`} />
            <Row label="Acconto pagato" value={`€${deposit.toFixed(0)}`} />
            <Row label="Saldo in studio" value={`€${(total - deposit).toFixed(0)}`} />
          </div>
        ) : (
          <p className="text-xs text-red-300/80 mb-8">Dettagli prenotazione non disponibili.</p>
        )}

        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-[#E8DCC8] text-[#0A0908] px-6 py-3 text-sm uppercase tracking-widest font-medium hover:bg-[#F5F1E8] transition-colors"
        >
          Torna al sito
        </Link>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="uppercase tracking-widest text-[10px] opacity-60 mt-0.5">{label}</span>
      <span className="text-[#F5F1E8] text-right">{value}</span>
    </div>
  );
}
