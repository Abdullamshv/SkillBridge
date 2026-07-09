export const STEPS = ["Reached out", "Agreed", "In progress", "Delivered", "Completed"];
export const STATUS_ORDER = ["reached_out", "agreed", "in_progress", "delivered", "completed"];

export const STATUS_PILL: Record<string, { background: string; color: string }> = {
  reached_out: { background: "#EEEDF5", color: "#6B7280" },
  agreed: { background: "#ECEAFC", color: "#4E3FE3" },
  in_progress: { background: "#FDEFE3", color: "#C96A12" },
  delivered: { background: "#E3F4EC", color: "#1F9D6B" },
  completed: { background: "#4E3FE3", color: "#FFFFFF" },
};

export function statusLabel(status: string): string {
  return STEPS[STATUS_ORDER.indexOf(status)] ?? status;
}

/** The 5-step engagement timeline: connected dots, solid indigo for reached
 * steps, gray for future ones. Driven directly off Engagement.status. */
export function ProgressTracker({ status }: { status: string }) {
  const stepIndex = STATUS_ORDER.indexOf(status);
  return (
    <ol className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const done = i <= stepIndex;
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex min-w-0 flex-col items-center gap-1">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold ${
                  done ? "bg-brand text-white" : "bg-bg text-faint"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`whitespace-nowrap text-[10.5px] font-bold ${
                  done ? "text-brand" : "text-faint"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1.5 mb-4 h-0.5 flex-1 rounded ${
                  i < stepIndex ? "bg-brand" : "bg-border"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
