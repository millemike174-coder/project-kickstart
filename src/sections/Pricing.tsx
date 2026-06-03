import FadeIn from '../components/FadeIn';
import ScrollHeading from '../components/ScrollHeading';

const ROOMS = [
  { tag: 'Red Room', name: 'Studio Piccolo', rate: '€35', unit: '/ ora' },
  { tag: 'Flagship', name: 'Studio SSG', rate: '€60', unit: '/ ora' },
];

const ADDONS = [
  { tag: 'Producer', name: 'Producer in sessione', rate: '€20', unit: '/ ora' },
  { tag: 'Fonico', name: 'Sound engineer', rate: '€25', unit: '/ ora' },
];

const NOTES = [
  { title: 'Minimo 2 ore', desc: 'Ogni prenotazione parte da una sessione di 2 ore.' },
  { title: 'Pacchetti 10h+', desc: 'Sconti dedicati per chi prenota dalle 10 ore in su. Scrivici per il preventivo.' },
  { title: 'Mix & Master', desc: 'Quotato sul progetto in base a numero tracce e tempistica.' },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="relative px-5 sm:px-8 py-20 sm:py-28 md:py-36 border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto">
        <FadeIn delay={0} y={20}>
          <div className="text-xs uppercase tracking-[0.35em] text-[#E8DCC8] mb-5">
            03 — Tariffe &amp; Servizi
          </div>
        </FadeIn>

        <ScrollHeading
          className="font-display uppercase text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight max-w-4xl"
          lines={[{ text: 'Chiari.' }, { text: 'Senza giri.', accent: true }]}
        />

        <div className="mt-14 sm:mt-20 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {ROOMS.map((r, i) => (
            <FadeIn key={r.name} delay={i * 0.1} y={30}>
              <div className="rounded-3xl border border-white/10 p-7 sm:p-9 flex flex-col gap-3 bg-[#0F0E0C] hover:border-[#E8DCC8]/40 transition-colors">
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-[#E8DCC8]">
                  {r.tag}
                </span>
                <h3 className="font-display uppercase text-3xl sm:text-4xl">{r.name}</h3>
                <div className="mt-4 flex items-end gap-2">
                  <span className="font-display text-5xl sm:text-6xl leading-none">
                    {r.rate}
                  </span>
                  <span className="text-sm uppercase tracking-widest text-[#F5F1E8]/60 mb-1.5">
                    {r.unit}
                  </span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.2} y={20}>
          <div className="mt-10 text-xs uppercase tracking-[0.3em] text-[#F5F1E8]/50 mb-4">
            Add-on opzionali
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {ADDONS.map((a, i) => (
            <FadeIn key={a.name} delay={i * 0.1} y={20}>
              <div className="rounded-2xl border border-white/8 p-6 flex items-center justify-between gap-4 bg-[#0F0E0C]">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#E8DCC8]">
                    {a.tag}
                  </span>
                  <h4 className="font-display uppercase text-xl sm:text-2xl mt-1">
                    {a.name}
                  </h4>
                </div>
                <div className="flex items-end gap-1">
                  <span className="font-display text-3xl sm:text-4xl leading-none">
                    {a.rate}
                  </span>
                  <span className="text-xs uppercase tracking-widest text-[#F5F1E8]/60 mb-1">
                    {a.unit}
                  </span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pt-10 border-t border-white/5">
          {NOTES.map((n, i) => (
            <FadeIn key={n.title} delay={i * 0.1} y={20}>
              <div>
                <h4 className="font-display uppercase text-xl sm:text-2xl mb-3">
                  {n.title}
                </h4>
                <p className="text-sm text-[#F5F1E8]/60 leading-relaxed">
                  {n.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
