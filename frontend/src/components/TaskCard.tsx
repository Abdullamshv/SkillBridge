"use client";

import Link from "next/link";
import { taskCategoryLabel } from "@/src/lib/categories";
import { dueInDays, formatRM, gradientFor, initials } from "@/src/lib/format";
import { VerifiedBadge } from "@/src/components/ui/Badge";
import { BookmarkIcon } from "@/src/components/ui/BookmarkIcon";
import type { ProjectSummary as TaskCardProject } from "@/src/graphql/types";

export type { TaskCardProject };

export function TaskCard({
  project,
  saved,
  onToggleSave,
}: {
  project: TaskCardProject;
  saved: boolean;
  onToggleSave?: (id: string) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-extrabold text-white"
          style={{ background: gradientFor(project.sme.companyName) }}
        >
          {initials(project.sme.companyName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold text-ink">{project.sme.companyName}</span>
            {project.sme.isVerified && <VerifiedBadge compact />}
          </div>
          <span className="text-xs font-medium text-muted">{project.sme.location}</span>
        </div>
        {onToggleSave && (
          <button
            onClick={() => onToggleSave(project.id)}
            aria-label={saved ? "Unsave task" : "Save task"}
            className="shrink-0 transition-transform hover:scale-110"
          >
            <BookmarkIcon saved={saved} />
          </button>
        )}
      </div>

      <Link href={`/home/tasks/${project.id}`} className="mt-3 block">
        <h3 className="text-[15px] font-bold leading-snug text-ink hover:text-brand">
          {project.title}
        </h3>
      </Link>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[11px] font-bold text-brand">
          {taskCategoryLabel(project.category)}
        </span>
        {project.requiredSkills.slice(0, 2).map((s) => (
          <span key={s} className="rounded-full bg-bg px-2.5 py-1 text-[11px] font-semibold text-muted">
            {s}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div>
          <span className="text-base font-extrabold text-ink">{formatRM(project.budget)}</span>
          <span className="ml-1.5 text-[11px] font-semibold text-faint">fixed price</span>
        </div>
        <span className="text-xs font-semibold text-muted">{dueInDays(project.deadline)}</span>
      </div>
    </div>
  );
}
