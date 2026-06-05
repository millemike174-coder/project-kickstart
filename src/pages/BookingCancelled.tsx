import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export default function BookingCancelled() {
  return (
    <main className="min-h-screen bg-[#0A0908] text-[#F5F1E8] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <X className="w-7 h-7 text-red-300" />
        </div>
        <h1 className="font-display uppercase text-3xl mb-3">Pagamento annullato</h1>
        <p className="text-sm text-[#F5F1E8]/70 mb-8">
          La prenotazione non è stata confermata. Puoi riprovare quando vuoi.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-[#E8DCC8] text-[#0A0908] px-6 py-3 text-sm uppercase tracking-widest font-medium hover:bg-[#F5F1E8] transition-colors"
        >
          Torna alla home
        </Link>
      </div>
    </main>
  );
}
