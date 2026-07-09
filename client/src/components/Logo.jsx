export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size * (130 / 120)} viewBox="0 0 120 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* skyline behind the archway */}
      <rect x="18" y="22" width="14" height="36" stroke="#263349" strokeWidth="2.5" fill="#ffffff" />
      <rect x="40" y="8" width="16" height="50" stroke="#263349" strokeWidth="2.5" fill="#ffffff" />
      <rect x="88" y="26" width="13" height="32" stroke="#263349" strokeWidth="2.5" fill="#ffffff" />

      {/* arch molding (two concentric curves) */}
      <path d="M25,102 L25,70 Q25,34 60,34 Q95,34 95,70 L95,102" stroke="#263349" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M35,102 L35,72 Q35,45 60,45 Q85,45 85,72 L85,102" stroke="#263349" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* columns */}
      <rect x="14" y="90" width="17" height="6" fill="#263349" />
      <rect x="17" y="96" width="11" height="27" stroke="#263349" strokeWidth="2.5" fill="#ffffff" />
      <rect x="14" y="121" width="17" height="6" fill="#263349" />

      <rect x="89" y="90" width="17" height="6" fill="#263349" />
      <rect x="92" y="96" width="11" height="27" stroke="#263349" strokeWidth="2.5" fill="#ffffff" />
      <rect x="89" y="121" width="17" height="6" fill="#263349" />

      {/* doorway with lattice */}
      <path d="M49,121 L49,86 Q60,68 71,86 L71,121 Z" stroke="#263349" strokeWidth="2.5" fill="#ffffff" />
      <path d="M60,80 L68,90 L60,100 L52,90 Z" stroke="#263349" strokeWidth="1.5" fill="none" />

      <line x1="8" y1="126" x2="112" y2="126" stroke="#263349" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ size = 28, withWordmark = true }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.35 }}>
      <LogoMark size={size} />
      {withWordmark && (
        <span style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 700, fontSize: size * 0.52, color: 'var(--text)', letterSpacing: '0.01em' }}>
          The Grand Pavilion
        </span>
      )}
    </span>
  );
}
