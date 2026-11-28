export function Spinner({ size = 16, label }: { size?: number; label?: string }) {
  return (
    <svg
      className="ui-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}
