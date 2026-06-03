type LogoProps = {
  size?: number;
  className?: string;
  color?: string;
};

// Monogramma SSG dentro cerchio — usato in navbar e footer
export default function RondoLogo({
  size = 32,
  className,
  color = '#F5F1E8',
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="32" cy="32" r="30" stroke={color} strokeWidth="2" />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontFamily="'Anton', sans-serif"
        fontSize="20"
        fontWeight="700"
        fill={color}
        letterSpacing="0.5"
      >
        SSG
      </text>
    </svg>
  );
}
