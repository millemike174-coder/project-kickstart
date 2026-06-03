import FadeIn from '../components/FadeIn';
import ScrollHeading from '../components/ScrollHeading';
import { ArrowUpRight } from 'lucide-react';

const MEMBERS = [
  { initial: 'M', role: 'Producer' },
  { initial: 'E', role: 'Fonico' },
  { initial: 'A', role: 'Sound Designer' },
];

export default function Team() {
  return (
    <section
      id="team"
      className="relative px-5 sm:px-8 py-20 sm:py-28 md:py-32 border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto">
        <FadeIn delay={0} y={20}>
          <div className="text-xs uppercase tracking-[0.35em] text-[#E8DCC8] mb-5">
            Team
          </div>
        </FadeIn>

        <ScrollHeading
          className="font-display uppercase text-5xl sm:text-6xl md:text-7xl leading-[0.9] tracking-tight max-w-4xl"
          lines={[{ text: 'Chi c’è' }, { text: 'dietro il suono.', accent: true }]}
        />

        <div className="mt-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
          <FadeIn delay={0.25} y={20}>
            <p className="max-w-xl text-[#F5F1E8]/65 text-base sm:text-lg leading-relaxed">
              Producer e fonici affiliati allo studio. Puoi richiederne uno in
              fase di prenotazione, oppure portare il tuo: la sala è pronta in
              ogni caso.
            </p>
          </FadeIn>

          <FadeIn delay={0.4} y={20}>
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 text-sm uppercase tracking-widest text-[#E8DCC8] hover:text-[#F5F1E8] transition-colors"
            >
              <span>Conosci il team</span>
              <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </FadeIn>
        </div>

        {/* Avatars */}
        <div className="mt-14 sm:mt-20 flex flex-wrap items-center gap-4 sm:gap-6">
          {MEMBERS.map((m, i) => (
            <FadeIn key={m.initial} delay={i * 0.12} y={20}>
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border border-[#E8DCC8]/40 flex items-center justify-center bg-[#0F0E0C] hover:border-[#E8DCC8] transition-colors"
                  style={{
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)',
                  }}
                >
                  <span
                    className="text-[#F5F1E8] leading-none"
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontStyle: 'italic',
                      fontWeight: 400,
                      fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
                    }}
                  >
                    {m.initial}
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#F5F1E8]/60">
                  {m.role}
                </span>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
