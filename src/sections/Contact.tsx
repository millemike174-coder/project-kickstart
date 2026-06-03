import FadeIn from '../components/FadeIn';
import ScrollHeading from '../components/ScrollHeading';
import { ArrowUpRight } from 'lucide-react';

export default function Contact() {
  const openBooking = () => {
    window.dispatchEvent(new Event('open-booking'));
  };

  return (
    <section
      id="contact"
      className="relative px-5 sm:px-8 py-24 sm:py-32 md:py-40 border-t border-white/5 overflow-hidden"
    >
      {/* Soft accent glow */}
      <div
        className="absolute inset-x-0 top-0 h-full pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(232, 220, 200, 0.12) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center text-center">
        <ScrollHeading
          className="font-display uppercase text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.88] tracking-tight max-w-5xl"
          lines={[{ text: 'Pronto a registrare?', accent: true }]}
        />

        <FadeIn delay={0.4} y={20}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={openBooking}
              className="group inline-flex items-center gap-3 rounded-full bg-[#E8DCC8] text-[#0A0908] px-8 sm:px-10 py-4 text-sm sm:text-base uppercase tracking-widest font-medium hover:bg-[#F5F1E8] transition-colors shadow-xl shadow-black/40"
            >
              Prenota ora
              <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
