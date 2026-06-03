import { useRef, CSSProperties, ReactNode } from 'react';
import { motion, useInView, Variants } from 'framer-motion';

export type HeadingLine = {
  text: string;
  accent?: boolean; // se true, applica il colore avorio del brand
};

type Props = {
  lines: HeadingLine[];
  className?: string;
  style?: CSSProperties;
  accentClassName?: string; // override del colore accent per casi speciali
  as?: 'h1' | 'h2' | 'h3';
};

const container: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.13,
      delayChildren: 0.12,
    },
  },
};

const word: Variants = {
  hidden: {
    opacity: 0,
    y: 80,
    rotateX: -75,
    filter: 'blur(12px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 1.4,
      ease: [0.19, 1, 0.22, 1],
    },
  },
};

export default function ScrollHeading({
  lines,
  className,
  style,
  accentClassName = 'text-[#E8DCC8]',
  as = 'h2',
}: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  // Triggera quando il titolo entra di ~20% nel viewport
  const inView = useInView(ref, { once: true, margin: '-15% 0px -15% 0px' });

  const MotionTag = motion[as];

  const renderLine = (line: HeadingLine, lineIdx: number): ReactNode => {
    const words = line.text.split(' ');
    return (
      <span
        key={lineIdx}
        className={`block ${line.accent ? accentClassName : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {words.map((w, i) => (
          <motion.span
            key={`${lineIdx}-${i}`}
            variants={word}
            className="inline-block"
            style={{
              transformOrigin: '50% 100%',
              transformStyle: 'preserve-3d',
              willChange: 'transform, opacity, filter',
            }}
          >
            {w}
            {i < words.length - 1 && ' '}
          </motion.span>
        ))}
      </span>
    );
  };

  return (
    <MotionTag
      ref={ref}
      className={className}
      style={{ ...style, perspective: '1200px' }}
      variants={container}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      {lines.map(renderLine)}
    </MotionTag>
  );
}
