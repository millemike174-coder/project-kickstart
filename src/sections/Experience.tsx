import FadeIn from '../components/FadeIn';
import ScrollHeading from '../components/ScrollHeading';

const ITEMS = [
  {
    n: '01',
    title: 'Suono da major',
    desc: 'Hardware analogico premium e sale trattate: console, preamp e compressori di alto livello per un risultato pronto per le piattaforme.',
  },
  {
    n: '02',
    title: 'Riservatezza assoluta',
    desc: 'Un santuario creativo privato a Milano. Lavori senza distrazioni, lontano da occhi indiscreti.',
  },
  {
    n: '03',
    title: 'Team al tuo fianco',
    desc: 'Producer e fonici in-house che conoscono ogni sala, oppure porta il tuo: la sala è pronta in ogni caso.',
  },
  {
    n: '04',
    title: 'Mix & Master',
    desc: 'Finalizzazione professionale e loudness competitivo per il digitale.',
  },
];

export default function Experience() {
  return (
    <section
      id="experience"
      className="relative px-5 sm:px-8 py-20 sm:py-28 md:py-36 border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto">
        <FadeIn delay={0} y={20}>
          <div className="text-xs uppercase tracking-[0.35em] text-[#E8DCC8] mb-5">
            Perché Trenches
          </div>
        </FadeIn>

        <ScrollHeading
          className="font-display uppercase text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight max-w-5xl mb-16 sm:mb-20"
          lines={[
            { text: 'Uno studio' },
            { text: 'che suona come un disco.', accent: true },
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
          {ITEMS.map((it, i) => (
            <FadeIn key={it.n} delay={i * 0.1} y={30}>
              <div className="bg-[#0A0908] p-7 sm:p-9 h-full flex flex-col gap-5 hover:bg-[#100F0D] transition-colors">
                <span className="font-display text-5xl sm:text-6xl text-[#E8DCC8] leading-none">
                  {it.n}
                </span>
                <h3 className="font-display uppercase text-2xl sm:text-3xl">
                  {it.title}
                </h3>
                <p className="text-sm sm:text-base text-[#F5F1E8]/65 leading-relaxed">
                  {it.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
