export function Card({
  className = "",
  hover = false,
  children,
}: {
  className?: string;
  hover?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-card ${
        hover ? "transition-shadow hover:shadow-card-hover" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
