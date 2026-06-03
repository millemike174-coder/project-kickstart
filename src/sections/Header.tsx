import { useEffect, useState } from 'react';
import RondoLogo from '../components/RondoLogo';
import BookingModal from '../components/BookingModal';

const NAV_LINKS = [
  { label: 'Studi', href: '#studios' },
  { label: 'Esperienza', href: '#experience' },
  { label: 'Team', href: '#team' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Listen for global open-booking events from other CTAs
  useEffect(() => {
    const open = () => setBookingOpen(true);
    window.addEventListener('open-booking', open);
    return () => window.removeEventListener('open-booking', open);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0A0908]/85 backdrop-blur-md border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 py-4 sm:py-5">
          <a href="#top" className="flex items-center gap-3 group">
            <RondoLogo size={32} color="#F5F1E8" />
            <span className="font-display text-xl sm:text-2xl tracking-wide uppercase">
              Trenches Records
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm uppercase tracking-widest text-[#F5F1E8]/70 hover:text-[#E8DCC8] transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setBookingOpen(true)}
            className="rounded-full px-5 sm:px-6 py-2.5 text-xs sm:text-sm uppercase tracking-widest font-medium border border-[#E8DCC8] text-[#F5F1E8] hover:bg-[#E8DCC8] hover:text-[#0A0908] transition-colors"
          >
            Prenota
          </button>
        </div>
      </header>

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </>
  );
}
