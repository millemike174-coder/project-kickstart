import FadeIn from '../components/FadeIn';
import StudioArt from '../components/StudioArt';
import ScrollHeading from '../components/ScrollHeading';
import { ArrowUpRight } from 'lucide-react';

type Studio = {
  n: string;
  tag: string;
  name: string;
  rate: string;
  desc: string;
  features: string[];
  variant: 'red' | 'blue';
  detail: 'cabin' | 'wide';
  imageUrl?: string;
};

const STUDIOS: Studio[] = [
  {
    n: '01',
    tag: 'Flagship',
    name: 'Studio SSG',
    rate: '€60',
    desc: 'Regia spaziosa, acustica high-end. Tracking, mixing e ascolto critico in un ambiente dimensionato per produzioni serie.',
    features: ['Regia premium', 'Lounge artisti', 'Doppia workstation', 'Capienza crew'],
    variant: 'blue',
    detail: 'wide',
    imageUrl: '/studio/ssg-1.jpg',
  },
  {
    n: '02',
    tag: 'Red Room',
    name: 'Studio Piccolo',
    rate: '€35',
    desc: 'Ambiente intimo per voci, top-line e pre-produzione. Luce rossa, cielo stellato, focus totale sulla performance.',
    features: ['Acustica trattata', 'Monitor di riferimento', 'Soffitto stellato', 'Atmosfera cinematica'],
    variant: 'red',
    detail: 'cabin',
    imageUrl: '/studio/piccolo-1.jpg',
  },
];

export default function Studios() {
  return (
    <section
      id="studios"
      className="relative px-5 sm:px-8 py-20 sm:py-28 md:py-36 border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto">
        <FadeIn delay={0} y={20}>
          <div className="text-xs uppercase tracking-[0.35em] text-[#E8DCC8] mb-5">
            Gli Studi
          </div>
        </FadeIn>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12 sm:mb-16">
          <ScrollHeading
            className="font-display uppercase text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight max-w-4xl"
            lines={[
              { text: 'Due sale.' },
              { text: 'Una sola ossessione.', accent: true },
            ]}
          />
          <FadeIn delay={0.3} y={20}>
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 text-sm uppercase tracking-widest text-[#E8DCC8] hover:text-[#F5F1E8] transition-colors shrink-0"
            >
              <span>Vedi tutte le specifiche</span>
              <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </FadeIn>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {STUDIOS.map((s, i) => (
            <FadeIn key={s.name} delay={i * 0.15} y={40}>
              <div className="group relative rounded-3xl overflow-hidden border border-white/5 bg-[#0F0E0C] hover:border-white/15 transition-colors">
                {s.imageUrl ? (
                  <img
                    src={s.imageUrl}
                    alt={s.name}
                    loading="lazy"
                    className="w-full aspect-[4/3] object-cover"
                  />
                ) : (
                  <StudioArt
                    variant={s.variant}
                    detail={s.detail}
                    className="w-full aspect-[4/3]"
                  />
                )}

                <div className="absolute top-5 left-5 right-5 flex items-start justify-between">
                  <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#F5F1E8]/80 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
                    {s.n} — {s.tag}
                  </span>
                  <div className="text-right">
                    <div className="font-display text-3xl sm:text-4xl text-[#F5F1E8] leading-none">
                      {s.rate}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-[#F5F1E8]/60 mt-1">
                      / ora
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 flex flex-col gap-5">
                  <h3 className="font-display uppercase text-3xl sm:text-4xl">
                    {s.name}
                  </h3>
                  <p className="text-[#F5F1E8]/65 text-sm sm:text-base leading-relaxed">
                    {s.desc}
                  </p>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm text-[#F5F1E8]/75">
                    {s.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 before:content-['—'] before:text-[#E8DCC8]"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event('open-booking'))}
                    className="mt-2 inline-flex items-center justify-between gap-3 rounded-full border border-[#F5F1E8]/20 px-5 py-3 text-xs sm:text-sm uppercase tracking-widest hover:border-[#E8DCC8] hover:text-[#E8DCC8] transition-colors"
                  >
                    <span>Prenota questa sala</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
