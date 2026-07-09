function TrustBadge({
  className,
  title,
  children,
}: {
  className: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <span
      title={title}
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-bold ${className}`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z"
          clipRule="evenodd"
        />
      </svg>
      {children}
    </span>
  );
}

export function VettedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <TrustBadge title="Vetted through the campus talent pool" className="bg-brand-tint text-brand">
      {compact ? "Vetted" : "Campus-vetted"}
    </TrustBadge>
  );
}

export function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <TrustBadge
      title="Business registration checked with SSM (Companies Commission of Malaysia)"
      className="bg-success-tint text-success"
    >
      {compact ? "SSM" : "SSM verified"}
    </TrustBadge>
  );
}
