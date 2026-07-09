export default function Logo({ size = 28, withWordmark = true }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.32 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#846044" />
        <circle cx="30" cy="11" r="5" fill="#98a086" />
        <path d="M8 21L20 10L32 21" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="11.5" y="20" width="17" height="12.5" rx="1.5" fill="#ffffff" />
        <rect x="17" y="25" width="6" height="7.5" rx="1" fill="#846044" />
      </svg>
      {withWordmark && <span style={{ fontWeight: 700, fontSize: size * 0.5, color: 'var(--text)', letterSpacing: '-0.01em' }}>Society App</span>}
    </span>
  );
}
