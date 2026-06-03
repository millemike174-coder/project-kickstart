import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const openBooking = () => {
  window.dispatchEvent(new Event('open-booking'));
};

const VIDEO_SRC = '/videos/hero.mp4';

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    const tryPlay = () => v.play().catch(() => { /* silently ignore */ });
    tryPlay();
    const onInteract = () => { tryPlay(); document.removeEventListener('pointerdown', onInteract); };
    document.addEventListener('pointerdown', onInteract);
    return () => document.removeEventListener('pointerdown', onInteract);
  }, []);

  return (
    <section
      id="top"
      className="relative w-full overflow-hidden bg-[#0A0908] flex items-center justify-center"
      style={{ minHeight: '100vh' }}
    >
      {/* VIDEO BACKGROUND */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/studio/ssg-1.jpg"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      {/* Overlay scuro per leggibilità */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,9,8,0.45) 0%, rgba(10,9,8,0.2) 40%, rgba(10,9,8,0.45) 75%, rgba(10,9,8,0.95) 100%)',
        }}
      />

      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-32 z-[1] pointer-events-none"
        style={{
          background:
            'linear-gradient(0deg, rgba(10,9,8,1) 0%, transparent 100%)',
        }}
      />

      {/* CONTENUTO */}
      <div className="relative z-10 max-w-6xl w-full mx-auto px-5 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="text-xs uppercase tracking-[0.4em] text-[#E8DCC8] mb-7"
        >
          Studio privato · Milano
        </motion.div>

        {/* Titolo principale — "Diamo voce alle" entra dritto, "Trenches" fa il giro 3D */}
        <h1
          className="text-[#F5F1E8] leading-[0.95] tracking-tight"
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: 'clamp(3rem, 9vw, 9rem)',
            textTransform: 'uppercase',
            textShadow: '0 4px 30px rgba(0,0,0,0.7)',
            perspective: '1200px',
          }}
        >
          <motion.span
            initial={{ opacity: 0, y: 40, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1], delay: 0.25 }}
            className="inline-block"
          >
            Diamo voce alle{' '}
          </motion.span>

          {/* "Trenches" — solo entrata morbida (no rotazioni infinite) */}
          <motion.span
            initial={{ opacity: 0, y: 40, scale: 0.85, filter: 'blur(12px)' }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              filter: 'blur(0px)',
            }}
            transition={{
              duration: 1.4,
              ease: [0.19, 1, 0.22, 1],
              delay: 0.85,
            }}
            className="inline-block normal-case"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: 'italic',
              fontWeight: 400,
              color: '#E8DCC8',
              letterSpacing: '-0.01em',
            }}
          >
            Trenches
          </motion.span>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 1.5 }}
          className="mt-12"
        >
          <button
            type="button"
            onClick={openBooking}
            className="group inline-flex items-center gap-3 rounded-full bg-[#E8DCC8] text-[#0A0908] px-8 sm:px-10 py-4 text-sm sm:text-base uppercase tracking-widest font-medium hover:bg-[#F5F1E8] transition-colors shadow-xl shadow-black/60"
          >
            Prenota ora
            <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
