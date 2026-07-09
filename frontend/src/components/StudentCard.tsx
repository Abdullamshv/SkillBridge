"use client";

import Link from "next/link";
import { formatRM, gradientFor, initials } from "@/src/lib/format";
import type { StudentSummary as StudentCardProfile } from "@/src/graphql/types";

export type { StudentCardProfile };

export function StudentCard({
  student,
  saved,
  onToggleSave,
}: {
  student: StudentCardProfile;
  saved: boolean;
  onToggleSave?: (id: string) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white"
          style={{ background: gradientFor(student.user.username) }}
        >
          {initials(student.user.username)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold text-ink">{student.user.username}</span>
            {student.isVetted && (
              <span className="shrink-0 text-[10px] font-bold text-brand" title="Campus-vetted">
                ✓
              </span>
            )}
          </div>
          <span className="text-xs font-medium text-muted">{student.university}</span>
        </div>
        {onToggleSave && (
          <button
            onClick={() => onToggleSave(student.id)}
            aria-label={saved ? "Unsave student" : "Save student"}
            className="shrink-0 text-lg"
          >
            {saved ? "♥" : "♡"}
          </button>
        )}
      </div>

      <Link href={`/home/talent/${student.id}`} className="mt-3 block">
        <h3 className="text-[15px] font-bold leading-snug text-ink hover:text-brand">
          {student.major}
        </h3>
      </Link>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {student.skills.slice(0, 3).map((s) => (
          <span key={s} className="rounded-full bg-bg px-2.5 py-1 text-[11px] font-semibold text-muted">
            {s}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm font-extrabold text-ink">
          {formatRM(student.priceLow)}–{formatRM(student.priceHigh)}
        </span>
        <span className="text-xs font-semibold text-accent">
          ★ {student.rating.toFixed(1)} ({student.ratingCount})
        </span>
      </div>
    </div>
  );
}
