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
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <h3 className="text-sm font-bold text-ink">Cost breakdown</h3>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Task price</span>
          <span className="font-semibold text-ink">{formatRM(budget)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Platform fee{isStudent ? " — students" : " — flat 2%"}</span>
          <span className={`font-semibold ${isStudent ? "text-success" : "text-ink"}`}>
            {isStudent ? formatRM(0) : formatRM(platformFee)}
          </span>
        </div>
        <div className="flex items-baseline justify-between border-t border-border pt-2.5">
          <span className="font-bold text-ink">{isStudent ? "You receive" : "You pay"}</span>
          <span className="text-lg font-extrabold text-brand">
            {isStudent ? formatRM(budget) : formatRM(businessTotal)}
          </span>
        </div>
      </div>
      <p
        className={`mt-3 rounded-xl px-3 py-2.5 text-xs font-medium leading-relaxed ${
          isStudent ? "bg-success-tint text-success" : "bg-brand-tint text-brand"
        }`}
      >
        {isStudent
          ? "Held in escrow when terms are agreed — released to you on approval."
          : "Funded into escrow when terms are agreed — released to the student when you approve the work. Nothing hidden: the fee is always a flat 2%."}
      </p>
    </div>
  );
}
