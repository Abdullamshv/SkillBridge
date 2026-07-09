import { Card } from "./Card";

export function StatCard({
  big,
  label,
  sub,
}: {
  big: string;
  label: string;
  sub?: string;
}) {
  return (
    <Card className="p-5">
      <div className="text-2xl font-extrabold text-ink">{big}</div>
      <div className="mt-1 text-sm font-semibold text-muted">{label}</div>
      {sub && <div className="mt-2.5 text-xs font-bold text-faint">{sub}</div>}
    </Card>
  );
}
