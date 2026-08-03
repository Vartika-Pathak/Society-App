// The Pavilion wordmark's glyph: a gazebo-style roof over three columns, evoking an
// actual pavilion rather than a generic office building. Drawn in lucide's own stroke
// convention (24x24 grid, currentColor, round caps) so it drops in as a like-for-like
// replacement for the lucide `Building2` icon it replaces everywhere in the app.
export function PavilionMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 10 L12 4 L21 10" />
      <line x1="12" y1="4" x2="12" y2="2" />
      <line x1="4" y1="19" x2="20" y2="19" />
      <line x1="7" y1="10" x2="7" y2="19" />
      <line x1="12" y1="10" x2="12" y2="19" />
      <line x1="17" y1="10" x2="17" y2="19" />
    </svg>
  );
}
