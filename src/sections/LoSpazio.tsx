import FadeIn from '../components/FadeIn';
import ScrollHeading from '../components/ScrollHeading';

export default function LoSpazio() {
  return (
    <section className="relative px-5 sm:px-8 py-20 sm:py-28 md:py-32 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <FadeIn delay={0} y={20}>
          <div className="text-xs uppercase tracking-[0.35em] text-[#E8DCC8] mb-5">
            Lo spazio
          </div>
        </FadeIn>

        <ScrollHeading
          className="font-display uppercase text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight max-w-4xl mb-12 sm:mb-16"
          lines={[{ text: 'Più di uno studio.' }]}
        />

        <FadeIn delay={0.2} y={30}>
          <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 aspect-[16/9] sm:aspect-[21/9]">
            <img
              src="/studio/ssg-1.jpg"
              alt="Lo spazio Trenches Records"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Soft vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(180deg, transparent 60%, rgba(10,9,8,0.65) 100%)',
              }}
            />
            {/* Caption */}
            <div className="absolute bottom-5 left-5 sm:bottom-8 sm:left-8 right-5 sm:right-8 flex items-end justify-between gap-4">
              <p
                className="text-[#F5F1E8] text-sm sm:text-base md:text-lg max-w-md leading-relaxed"
                style={{ textShadow: '0 2px 14px rgba(0,0,0,0.7)' }}
              >
                Un ambiente curato in ogni dettaglio. Materiali, luce,
                atmosfera. La sala è già parte del processo creativo.
              </p>
              <span className="hidden sm:inline-flex text-[10px] uppercase tracking-widest text-[#F5F1E8]/70 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 shrink-0">
                Milano · IT
              </span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
