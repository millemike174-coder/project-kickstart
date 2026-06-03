import RondoLogo from '../components/RondoLogo';

const NAV_LINKS = [
  { label: 'Studi', href: '#studios' },
  { label: 'Esperienza', href: '#experience' },
  { label: 'Team', href: '#team' },
  { label: 'Prenota', action: 'open-booking' as const },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 px-5 sm:px-8 pt-16 pb-10 bg-[#0A0908]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <RondoLogo size={36} color="#F5F1E8" />
            <span className="font-display uppercase text-2xl">
              Trenches Records
            </span>
          </div>
          <p className="text-sm text-[#F5F1E8]/60 leading-relaxed max-w-xs">
            Studio di registrazione privato a Milano. Un santuario creativo ad
            alto tasso di riservatezza.
          </p>
        </div>

        {/* Nav */}
        <div>
          <h4 className="text-xs uppercase tracking-[0.3em] text-[#E8DCC8] mb-5">
            Naviga
          </h4>
          <ul className="space-y-3">
            {NAV_LINKS.map((l) => (
              <li key={l.label}>
                {'action' in l ? (
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event(l.action!))}
                    className="text-sm text-[#F5F1E8]/75 hover:text-[#E8DCC8] transition-colors"
                  >
                    {l.label}
                  </button>
                ) : (
                  <a
                    href={l.href}
                    className="text-sm text-[#F5F1E8]/75 hover:text-[#E8DCC8] transition-colors"
                  >
                    {l.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Contatti */}
        <div>
          <h4 className="text-xs uppercase tracking-[0.3em] text-[#E8DCC8] mb-5">
            Contatti
          </h4>
          <a
            href="https://www.instagram.com/trenches_records1"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-[#F5F1E8] hover:text-[#E8DCC8] transition-colors mb-2"
          >
            @trenchesrecords
          </a>
          <p className="text-sm text-[#F5F1E8]/60">Milano · IT</p>
        </div>
      </div>

      <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-[11px] uppercase tracking-widest text-[#F5F1E8]/40">
          © 2026 Trenches Records — Made in the Trenches
        </span>
      </div>
    </footer>
  );
}
