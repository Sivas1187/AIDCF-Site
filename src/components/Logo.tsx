// AIDCF mark: a chain of four linked stages ending in a decision node.
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="30" height="30" rx="6" fill="var(--accent)" />
      <g stroke="var(--accent-ink)" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M8 9h6M8 16h10M8 23h14" />
        <circle cx="24" cy="23" r="2.5" fill="var(--accent-ink)" />
      </g>
    </svg>
  );
}
