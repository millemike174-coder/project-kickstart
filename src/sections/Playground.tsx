import { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

// 4 immagini posizionate ai 4 angoli + range di parallax differenti
// per dare profondità (alcune si muovono più velocemente di altre).
type Photo = {
  src: string;
  alt: string;
  // posizione assoluta nel container
  position: { top?: string; bottom?: string; left?: string; right?: string };
  // dimensione (clamp per scalare)
  size: string;
  // rotazione iniziale per non sembrare tutte allineate
  rotate: number;
  // intensità del parallax: più alto = scorre più veloce
  parallaxFactor: number;
};

const PHOTOS: Photo[] = [
  // FILA ALTA
  {
    src: '/studio/piccolo-1.jpg',
    alt: 'Studio Piccolo',
    position: { top: '6%', left: '3%' },
    size: 'clamp(240px, 28vw, 480px)',
    rotate: -3,
    parallaxFactor: 1.2,
  },
  {
    src: '/studio/ssg-1.jpg',
    alt: 'Studio SSG',
    position: { top: '9%', right: '4%' },
    size: 'clamp(230px, 26vw, 440px)',
    rotate: 4,
    parallaxFactor: -0.7,
  },
  // FILA CENTRALE (lontane dal centro per non coprire il titolo)
  {
    src: '/studio/ssg-2.jpg',
    alt: 'Studio SSG',
    position: { top: '42%', left: '2%' },
    size: 'clamp(190px, 22vw, 380px)',
    rotate: 6,
    parallaxFactor: -1.4,
  },
  {
    src: '/studio/piccolo-2.jpg',
    alt: 'Studio Piccolo',
    position: { top: '46%', right: '2%' },
    size: 'clamp(200px, 23vw, 400px)',
    rotate: -5,
    parallaxFactor: 1.5,
  },
  // FILA BASSA
  {
    src: '/studio/piccolo-2.jpg',
    alt: 'Studio Piccolo',
    position: { bottom: '8%', left: '5%' },
    size: 'clamp(220px, 24vw, 420px)',
    rotate: 5,
    parallaxFactor: -1.1,
  },
  {
    src: '/studio/ssg-2.jpg',
    alt: 'Studio SSG',
    position: { bottom: '6%', right: '4%' },
    size: 'clamp(250px, 28vw, 500px)',
    rotate: -4,
    parallaxFactor: 1.6,
  },
];

function ParallaxPhoto({
  photo,
  progress,
}: {
  photo: Photo;
  progress: MotionValue<number>;
}) {
  // mapper: 0..1 di scroll → translateY in pixel
  const range = 200 * photo.parallaxFactor;
  const y = useTransform(progress, [0, 1], [-range, range]);

  return (
    <motion.div
      style={{
        position: 'absolute',
        ...photo.position,
        width: photo.size,
        rotate: `${photo.rotate}deg`,
        y,
      }}
      className="aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50"
    >
      <img
        src={photo.src}
        alt={photo.alt}
        loading="lazy"
        className="w-full h-full object-cover"
        draggable={false}
      />
    </motion.div>
  );
}

export default function Playground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  return (
    <section className="relative bg-[#0A0908] overflow-hidden">
      <div
        ref={containerRef}
        className="relative"
        style={{ minHeight: '260vh' }}
      >
        {/* Foto in parallax, distribuite agli angoli */}
        <div className="absolute inset-0 pointer-events-none">
          {PHOTOS.map((p, i) => (
            <ParallaxPhoto key={i} photo={p} progress={scrollYProgress} />
          ))}
        </div>

        {/* Contenuto centrato fisso (sticky) */}
        <div className="sticky top-0 h-screen w-full flex items-center justify-center px-5 sm:px-8 z-10">
          <div className="text-center max-w-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15% 0px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs uppercase tracking-[0.4em] text-[#E8DCC8] mb-6"
            >
              Esplorazioni
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-15% 0px' }}
              transition={{
                duration: 1.2,
                ease: [0.19, 1, 0.22, 1],
                delay: 0.1,
              }}
              className="text-[#F5F1E8] leading-[0.95]"
              style={{
                fontSize: 'clamp(2.75rem, 7vw, 6rem)',
                fontFamily: "'Anton', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '-0.01em',
              }}
            >
              Lo spazio{' '}
              <span
                className="text-[#E8DCC8] normal-case"
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: 'italic',
                  fontWeight: 400,
                  letterSpacing: '0',
                }}
              >
                che senti
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15% 0px' }}
              transition={{
                duration: 0.9,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.3,
              }}
              className="mt-7 text-sm sm:text-base text-[#F5F1E8]/65 max-w-md mx-auto leading-relaxed"
            >
              Atmosfera, materiali, luce. Ogni dettaglio è pensato perché la
              sessione suoni meglio prima ancora di accendere il microfono.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15% 0px' }}
              transition={{
                duration: 0.9,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.45,
              }}
              className="mt-8"
            >
              <a
                href="#studios"
                className="group inline-flex items-center gap-2.5 rounded-full border border-[#F5F1E8]/30 text-[#F5F1E8] px-6 py-3 text-xs sm:text-sm uppercase tracking-widest font-medium hover:border-[#E8DCC8] hover:text-[#E8DCC8] transition-colors backdrop-blur-sm bg-black/25"
              >
                Vedi le sale
                <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
