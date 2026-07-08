"use client";

import { formatRM } from "@/src/lib/format";

export function CostBreakdown({
  role,
  budget,
  platformFee,
  businessTotal,
}: {
  role: "student" | "sme";
  budget: string;
  platformFee: string;
  businessTotal: string;
}) {
  const isStudent = role === "student";
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h3 className="text-sm font-bold text-ink">Cost breakdown</h3>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Task price</span>
          <span className="font-semibold text-ink">{formatRM(budget)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Platform fee</span>
          <span className="font-semibold text-ink">
            {isStudent ? formatRM(0) : formatRM(platformFee)}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-2">
          <span className="font-bold text-ink">{isStudent ? "You receive" : "You pay"}</span>
          <span className="font-extrabold text-ink">
            {isStudent ? formatRM(budget) : formatRM(businessTotal)}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        {isStudent
          ? "Held in escrow when terms are agreed — released to you on approval."
          : "Funded into escrow when terms are agreed — released to the student when you approve the work. Nothing hidden: the fee is always a flat 2%."}
      </p>
    </div>
  );
}
