import { useState } from 'react';
import { Camera, Clock, Film, Sparkles, Layers } from 'lucide-react';
import FadeIn from '../components/FadeIn';
import ScrollHeading from '../components/ScrollHeading';
import BookingModal from '../components/BookingModal';

const FEATURES = [
  { icon: Camera, text: 'Operatore + camera 4K' },
  { icon: Clock, text: 'Copertura 9:00 – 21:00 (12h)' },
  { icon: Film, text: 'Materiale grezzo + 3 clip social' },
  { icon: Layers, text: 'Possibilità di prenotare più giorni' },
  { icon: Sparkles, text: 'Integrazione VFX AI opzionale' },
];

export default function Videomaker() {
  const [open, setOpen] = useState(false);

  return (
    <section
      id="videomaker"
      className="relative px-5 sm:px-8 py-20 sm:py-28 md:py-36 border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto">
        <FadeIn delay={0} y={20}>
          <div className="text-xs uppercase tracking-[0.35em] text-[#E8DCC8] mb-5">
            Videomaker
          </div>
        </FadeIn>

        <ScrollHeading
          className="font-display uppercase text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight max-w-4xl"
          lines={[{ text: 'Documenta' }, { text: 'la sessione.', accent: true }]}
        />

        <div className="mt-14 sm:mt-20 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
          {/* LEFT */}
          <FadeIn delay={0.1} y={30}>
            <div className="flex flex-col gap-7">
              <p className="text-base sm:text-lg text-[#F5F1E8]/80 leading-relaxed">
                Servizio video professionale on-site. Cattura preparazione,
                riprese, momenti dietro le quinte. Consegnato come materiale
                grezzo + clip social ready (15s / 30s / 60s).
              </p>
              <ul className="flex flex-col gap-3">
                {FEATURES.map((f) => (
                  <li
                    key={f.text}
                    className="flex items-center gap-3 text-sm sm:text-base"
                  >
                    <f.icon className="w-4 h-4 text-[#E8DCC8] shrink-0" />
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="self-start mt-2 rounded-full bg-[#E8DCC8] text-[#0A0908] px-6 py-3.5 text-sm uppercase tracking-widest font-medium hover:bg-[#F5F1E8] transition-colors"
              >
                Aggiungi al booking
              </button>
            </div>
          </FadeIn>

          {/* RIGHT — Pricing card */}
          <FadeIn delay={0.2} y={30}>
            <div className="rounded-3xl border border-[#E8DCC8]/40 p-8 sm:p-10 bg-[#0F0E0C]">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#E8DCC8]">
                Pacchetto
              </span>
              <div className="mt-3 font-display text-7xl sm:text-8xl leading-none">
                €800
              </div>
              <div className="mt-2 text-sm text-[#F5F1E8]/70">
                primo giorno (9:00–21:00)
              </div>

              <div className="my-7 h-px bg-white/10" />
              <div className="flex items-baseline justify-between">
                <span className="font-display text-3xl sm:text-4xl">+€400</span>
                <span className="text-xs uppercase tracking-widest text-[#F5F1E8]/60">
                  / giorno extra
                </span>
              </div>

              <div className="my-7 h-px bg-white/10" />
              <div className="flex items-baseline justify-between">
                <span className="font-display text-3xl sm:text-4xl">€200</span>
                <span className="text-xs uppercase tracking-widest text-[#F5F1E8]/60">
                  VFX AI (4–15s)
                </span>
              </div>

              <p className="mt-8 text-[11px] sm:text-xs text-[#F5F1E8]/55 leading-relaxed">
                50% acconto + 50% il giorno · Costi extra (location, attrezzatura,
                vitto/alloggio, cast) a carico del cliente.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>

      <BookingModal
        open={open}
        onClose={() => setOpen(false)}
        initialVideomaker
      />
    </section>
  );
}
