type StudioArtProps = {
  variant: 'red' | 'blue';
  className?: string;
  detail?: 'cabin' | 'wide';
};

// Generates 50 random star positions deterministically
const STAR_FIELD = Array.from({ length: 60 }, (_, i) => {
  const seed = (i * 7919) % 1000;
  const left = ((seed * 13) % 100);
  const top = ((seed * 31) % 100);
  const size = ((seed * 7) % 3) + 1;
  const opacity = 0.3 + ((seed * 11) % 70) / 100;
  return { left, top, size, opacity };
});

export default function StudioArt({ variant, className, detail = 'cabin' }: StudioArtProps) {
  const red = variant === 'red';
  const accent = red ? '#E64E2E' : '#4A8BE6';
  const accentDeep = red ? '#A8200E' : '#1E3A8A';

  return (
    <div
      className={`relative overflow-hidden ${className ?? ''}`}
      style={{
        background: red
          ? 'radial-gradient(ellipse at 50% 30%, #2A0A05 0%, #0A0908 70%)'
          : 'radial-gradient(ellipse at 50% 30%, #0A1A33 0%, #050608 70%)',
      }}
    >
      {/* Starfield ceiling */}
      <div className="absolute inset-x-0 top-0 h-2/5 overflow-hidden">
        {STAR_FIELD.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
              boxShadow: `0 0 ${s.size * 2}px rgba(255,255,255,${s.opacity * 0.8})`,
            }}
          />
        ))}
      </div>

      {/* Accent ambient glow */}
      <div
        className="absolute inset-x-0 bottom-0 h-3/4 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, ${accent}55 0%, transparent 60%)`,
        }}
      />

      {/* Floor reflection line */}
      <div
        className="absolute inset-x-8 bottom-[20%] h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}aa, transparent)` }}
      />

      {/* Equipment silhouettes */}
      {detail === 'cabin' ? (
        <>
          {/* Microphone on stand center */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-[18%]"
            style={{ width: '12px', height: '40%' }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-7 rounded-md"
              style={{
                background: `linear-gradient(180deg, #1a1a1a, #0a0a0a)`,
                boxShadow: `0 0 18px ${accent}66, inset 0 0 4px ${accent}55`,
              }}
            />
            <div
              className="absolute top-7 left-1/2 -translate-x-1/2 w-px bg-neutral-700"
              style={{ height: 'calc(100% - 28px)' }}
            />
          </div>
        </>
      ) : (
        <>
          {/* Two speakers */}
          <div className="absolute left-[18%] bottom-[24%] w-12 h-20 rounded-sm"
            style={{
              background: 'linear-gradient(180deg, #1c1c1c, #0a0a0a)',
              boxShadow: `0 0 24px ${accent}55, inset 0 0 6px ${accent}33`,
            }}
          >
            <div className="absolute inset-2 rounded-full" style={{ background: accentDeep, opacity: 0.7 }} />
          </div>
          <div className="absolute right-[18%] bottom-[24%] w-12 h-20 rounded-sm"
            style={{
              background: 'linear-gradient(180deg, #1c1c1c, #0a0a0a)',
              boxShadow: `0 0 24px ${accent}55, inset 0 0 6px ${accent}33`,
            }}
          >
            <div className="absolute inset-2 rounded-full" style={{ background: accentDeep, opacity: 0.7 }} />
          </div>
          {/* Desk/console */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-[20%] rounded-sm"
            style={{
              width: '38%',
              height: '8%',
              background: 'linear-gradient(180deg, #2a2a2a, #0a0a0a)',
              boxShadow: `0 -8px 24px ${accent}33`,
            }}
          />
        </>
      )}

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}
