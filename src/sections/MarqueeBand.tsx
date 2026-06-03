const PHRASE = 'Trenches Records · Premium Studio · Made in the Trenches · Milano';

export default function MarqueeBand() {
  // Duplicate text to enable seamless loop
  const repeated = Array.from({ length: 8 }, () => PHRASE).join(' · ');
  return (
    <section
      className="relative py-8 border-y border-white/5 overflow-hidden"
      aria-hidden="true"
    >
      <div className="flex whitespace-nowrap animate-marquee will-change-transform">
        <div className="font-display text-4xl sm:text-5xl md:text-6xl uppercase text-[#F5F1E8]/30 pr-12">
          {repeated}
        </div>
        <div className="font-display text-4xl sm:text-5xl md:text-6xl uppercase text-[#F5F1E8]/30 pr-12">
          {repeated}
        </div>
      </div>
    </section>
  );
}
