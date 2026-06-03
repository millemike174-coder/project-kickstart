import FadeIn from '../components/FadeIn';
import StudioArt from '../components/StudioArt';
import ScrollHeading from '../components/ScrollHeading';

type Item = {
  variant: 'red' | 'blue';
  detail: 'cabin' | 'wide';
  label: string;
  imageUrl?: string;
};

const ITEMS: Item[] = [
  { variant: 'blue', detail: 'wide', label: 'Studio SSG', imageUrl: '/studio/ssg-1.jpg' },
  { variant: 'blue', detail: 'cabin', label: 'Studio SSG', imageUrl: '/studio/ssg-2.jpg' },
  { variant: 'red', detail: 'wide', label: 'Studio Piccolo', imageUrl: '/studio/piccolo-1.jpg' },
  { variant: 'red', detail: 'cabin', label: 'Studio Piccolo', imageUrl: '/studio/piccolo-2.jpg' },
  { variant: 'blue', detail: 'wide', label: 'Studio SSG', imageUrl: '/studio/ssg-1.jpg' },
  { variant: 'red', detail: 'cabin', label: 'Studio Piccolo', imageUrl: '/studio/piccolo-2.jpg' },
];

export default function Gallery() {
  return (
    <section className="relative px-5 sm:px-8 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12 sm:mb-16">
          <div>
            <FadeIn delay={0} y={20}>
              <div className="text-xs uppercase tracking-[0.35em] text-[#E8DCC8] mb-3">
                Galleria
              </div>
            </FadeIn>
            <ScrollHeading
              className="font-display uppercase text-5xl sm:text-6xl md:text-7xl leading-[0.9] tracking-tight"
              lines={[{ text: 'Dentro gli studi.' }]}
            />
          </div>
          <FadeIn delay={0.15} y={20}>
            <p className="max-w-sm text-[#F5F1E8]/65 text-sm sm:text-base leading-relaxed">
              Niente render né filtri pesanti. Quello che vedi è quello che
              trovi entrando.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {ITEMS.map((it, i) => (
            <FadeIn key={i} delay={i * 0.06} y={30}>
              <div className="group relative rounded-2xl overflow-hidden border border-white/5 aspect-[4/3]">
                {it.imageUrl ? (
                  <img
                    src={it.imageUrl}
                    alt={it.label}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <StudioArt
                    variant={it.variant}
                    detail={it.detail}
                    className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute bottom-3 left-3 text-[10px] sm:text-xs uppercase tracking-widest text-white/80 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
                  {it.label}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
