"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ME, GET_MY_PROJECTS } from "@/src/graphql/queries";
import { UPDATE_PROJECT_STATUS } from "@/src/graphql/mutations";
import { Navbar } from "@/src/components/Navbar";
import { taskCategoryLabel } from "@/src/lib/categories";
import { dueInDays, formatRM, postedAgo } from "@/src/lib/format";
import { friendlyError } from "@/src/lib/errors";
import type { MyProject } from "@/src/graphql/types";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-brand-tint text-brand" },
  in_progress: { label: "In progress", className: "bg-[#fdf1e4] text-status-progress" },
  completed: { label: "Completed", className: "bg-[#e6f5ef] text-status-delivered" },
  cancelled: { label: "Cancelled", className: "bg-bg text-muted" },
  disputed: { label: "Disputed", className: "bg-[#fdecec] text-[#c0392b]" },
};

export default function MyTasksPage() {
  const router = useRouter();
  const { data: meData, loading: meLoading } = useQuery(GET_ME);
  const me = meData?.me;
  const isSme = me?.role === "sme";

  const { data, loading, refetch } = useQuery(GET_MY_PROJECTS, { skip: !isSme });
  const [updateStatus, { loading: updating }] = useMutation(UPDATE_PROJECT_STATUS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (meLoading) return;
    if (!me) router.replace("/auth?mode=signin");
    else if (!isSme) router.replace("/home");
  }, [meLoading, me, isSme, router]);

  if (meLoading || !isSme || loading || !data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <p className="mt-10 text-center text-sm text-muted">Loading…</p>
      </div>
    );
  }

  async function setProjectStatus(projectId: string, status: string) {
    setError(null);
    try {
      await updateStatus({ variables: { projectId, status } });
      await refetch();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  const projects: MyProject[] = data.myProjects;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-ink">My tasks</h1>
          <Link
            href="/my-tasks/new"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-dark"
          >
            + Post a task
          </Link>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-[#fdecec] px-4 py-3 text-sm font-semibold text-[#c0392b]">
            {error}
          </p>
        )}

        {projects.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-card">
            <p className="text-sm font-semibold text-ink">You haven&apos;t posted any tasks yet.</p>
            <p className="mt-1 text-sm text-muted">
              Post your first task and campus talent will reach out to you.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {projects.map((p) => {
              const badge = STATUS_BADGES[p.status] ?? {
                label: p.status,
                className: "bg-bg text-muted",
              };
              return (
                <div
                  key={p.id}
                  className="rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/home/tasks/${p.id}`}
                          className="truncate text-[15px] font-bold text-ink hover:text-brand"
                        >
                          {p.title}
                        </Link>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-muted">
                        {taskCategoryLabel(p.category)} · posted {postedAgo(p.createdAt)} ·{" "}
                        {dueInDays(p.deadline)}
                        {p.assignedStudent && <> · assigned to {p.assignedStudent.user.username}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-base font-extrabold text-ink">{formatRM(p.budget)}</div>
                        <div className="text-[11px] font-semibold text-muted">
                          you pay {formatRM(p.businessTotal)} incl. 2% fee
                        </div>
                      </div>
                      {p.status === "open" && (
                        <button
                          onClick={() => setProjectStatus(p.id, "cancelled")}
                          disabled={updating}
                          className="rounded-full border border-border bg-white px-4 py-2 text-[13px] font-bold text-ink hover:bg-bg disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                      {p.status === "cancelled" && (
                        <button
                          onClick={() => setProjectStatus(p.id, "open")}
                          disabled={updating}
                          className="rounded-full border border-border bg-white px-4 py-2 text-[13px] font-bold text-brand hover:bg-brand-tint disabled:opacity-50"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
