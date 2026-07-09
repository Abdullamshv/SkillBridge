"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ME, GET_PROJECT } from "@/src/graphql/queries";
import { REACH_OUT } from "@/src/graphql/mutations";
import { Navbar } from "@/src/components/Navbar";
import { CostBreakdown } from "@/src/components/CostBreakdown";
import { VerifiedBadge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { taskCategoryLabel } from "@/src/lib/categories";
import { dueInDays, formatRM, gradientFor, initials } from "@/src/lib/format";

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: meData } = useQuery(GET_ME);
  const { data, loading } = useQuery(GET_PROJECT, { variables: { id } });
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [reachOut, { loading: sending, error }] = useMutation(REACH_OUT);

  const role = meData?.me?.role;
  const project = data?.project;

  async function handleReachOut(e: React.FormEvent) {
    e.preventDefault();
    await reachOut({ variables: { projectId: id, message } });
    setSent(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <p className="mt-10 text-center text-sm text-muted">Loading…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <p className="mt-10 text-center text-sm text-muted">Task not found.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-5xl px-6 pt-6">
        <Link href="/home" className="text-xs font-bold text-muted hover:text-ink">
          ‹ Back to tasks
        </Link>
      </div>
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-start gap-6 px-6 py-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Header card */}
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-extrabold text-white"
                style={{ background: gradientFor(project.sme.companyName) }}
              >
                {initials(project.sme.companyName)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-ink">{project.sme.companyName}</span>
                  {project.sme.isVerified && <VerifiedBadge />}
                </div>
                <span className="text-xs text-muted">{project.sme.location}</span>
              </div>
            </div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">{project.title}</h1>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-brand-tint px-3 py-1 text-xs font-bold text-brand">
                {taskCategoryLabel(project.category)}
              </span>
              <span className="rounded-full bg-bg px-3 py-1 text-xs font-semibold text-muted">
                {dueInDays(project.deadline)}
              </span>
              <span className="rounded-full bg-bg px-3 py-1 text-xs font-semibold text-muted">
                {project.sme.location}
              </span>
              <span className="rounded-full bg-accent-tint px-3 py-1 text-xs font-bold text-accent-dark">
                {formatRM(project.budget)} · fixed
              </span>
            </div>
          </Card>

          {/* About */}
          <Card className="p-6">
            <h3 className="text-sm font-extrabold text-ink">About the task</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
              {project.description}
            </p>
            {project.descriptionExtra && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
                {project.descriptionExtra}
              </p>
            )}
          </Card>

          {/* Who they're looking for */}
          {(project.lookingForBullets.length > 0 || project.requiredSkills.length > 0) && (
            <Card className="p-6">
              <h3 className="text-sm font-extrabold text-ink">Who they&apos;re looking for</h3>
              {project.lookingForBullets.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {project.lookingForBullets.map((b: string) => (
                    <li key={b} className="flex gap-2 text-sm text-muted">
                      <span className="text-success">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              {project.requiredSkills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-4">
                  {project.requiredSkills.map((s: string) => (
                    <span key={s} className="rounded-full bg-brand-tint px-3 py-1.5 text-xs font-bold text-brand">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Timeline */}
          {project.milestones.length > 0 && (
            <Card className="p-6">
              <h3 className="text-sm font-extrabold text-ink">Timeline</h3>
              <ol className="mt-4 space-y-4">
                {project.milestones.map((m: { id: string; label: string; note: string; dueDate: string }) => (
                  <li key={m.id} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-bold text-ink">{m.label}</span>
                        <span className="shrink-0 text-xs font-semibold text-muted">{m.dueDate}</span>
                      </div>
                      {m.note && <p className="mt-0.5 text-xs text-muted">{m.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>

        {/* Sticky sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <CostBreakdown
            role={role === "sme" ? "sme" : "student"}
            budget={project.budget}
            platformFee={project.platformFee}
            businessTotal={project.businessTotal}
          />

          <Card className="p-5">
            <h3 className="text-sm font-extrabold text-ink">About {project.sme.companyName}</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {project.sme.location}
              {project.sme.website ? ` · ${project.sme.website}` : ""}
            </p>
            <p className="mt-2 text-xs font-semibold text-muted">
              <span className="text-accent">★ {project.sme.rating.toFixed(1)}</span>{" "}
              from {project.sme.ratingCount} student rating{project.sme.ratingCount === 1 ? "" : "s"}
            </p>
          </Card>

          {role === "student" && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-extrabold text-ink">{formatRM(project.budget)}</div>
                  <span className="text-xs font-semibold text-muted">
                    fixed price · {dueInDays(project.deadline)}
                  </span>
                </div>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-extrabold text-white"
                  style={{ background: gradientFor(project.sme.companyName) }}
                >
                  {initials(project.sme.companyName)}
                </div>
              </div>
              {sent ? (
                <div className="mt-4 text-sm">
                  <p className="font-bold text-ink">Message sent!</p>
                  <p className="mt-1 text-muted">
                    {project.sme.companyName} will reply in your{" "}
                    <Link href="/office" className="font-semibold text-brand">
                      Office inbox
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReachOut} className="mt-4 space-y-3">
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Tell them why you're a good fit…"
                    className="w-full rounded-xl border border-transparent bg-bg px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:bg-white"
                  />
                  {error && <p className="text-xs font-semibold text-red-600">{error.message}</p>}
                  <Button type="submit" disabled={sending} className="w-full">
                    {sending ? "Sending…" : `💬 Message ${project.sme.companyName}`}
                  </Button>
                </form>
              )}
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
