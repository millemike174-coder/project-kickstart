import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function BookingCancelled() {
  const [params] = useSearchParams();
  const bookingId = params.get('booking_id');
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(false);

  const retryPayment = async () => {
    if (!bookingId) {
      toast.error('ID prenotazione mancante');
      return;
    }
    setRetrying(true);
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { booking_id: bookingId, payment_type: 'deposit' },
    });
    const respErr = (data as any)?.error;
    const url = (data as any)?.checkout_url || (data as any)?.url;
    if (error || respErr || !url) {
      setRetrying(false);
      toast.error(respErr || error?.message || 'Errore con il pagamento, riprova o scrivici su Instagram');
      return;
    }
    window.location.href = url;
  };

  return (
    <main className="min-h-screen bg-[#0A0908] text-[#F5F1E8] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <X className="w-7 h-7 text-red-300" />
        </div>
        <h1 className="font-display uppercase text-3xl sm:text-4xl mb-3">Pagamento annullato</h1>
        <p className="text-sm text-[#F5F1E8]/70 mb-8">
          La tua prenotazione è in attesa. Completa il pagamento o scrivici su Instagram.
        </p>
        <div className="flex flex-col gap-3">
          {bookingId && (
            <button
              onClick={retryPayment}
              disabled={retrying}
              className="inline-flex items-center justify-center rounded-full bg-[#E8DCC8] text-[#0A0908] px-6 py-3 text-sm uppercase tracking-widest font-medium hover:bg-[#F5F1E8] transition-colors disabled:opacity-60"
            >
              {retrying ? 'Reindirizzamento…' : 'Riprova pagamento'}
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center rounded-full border border-white/20 hover:border-white/40 px-6 py-3 text-sm uppercase tracking-widest font-medium transition-colors"
          >
            Torna al sito
          </button>
        </div>
        <div className="mt-6 text-[11px] opacity-50">
          <Link to="/" className="underline">Home</Link>
        </div>
      </div>
    </main>
  );
}
