"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ME, GET_PROJECT } from "@/src/graphql/queries";
import { REACH_OUT } from "@/src/graphql/mutations";
import { Navbar } from "@/src/components/Navbar";
import { CostBreakdown } from "@/src/components/CostBreakdown";
import { taskCategoryLabel } from "@/src/lib/categories";
import { formatRM, gradientFor, initials } from "@/src/lib/format";

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
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-extrabold text-white"
              style={{ background: gradientFor(project.sme.companyName) }}
            >
              {initials(project.sme.companyName)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-ink">{project.sme.companyName}</span>
                {project.sme.isVerified && (
                  <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[10px] font-bold text-brand">
                    SSM verified
                  </span>
                )}
              </div>
              <span className="text-xs text-muted">
                {project.sme.location} · ★ {project.sme.rating.toFixed(1)} ({project.sme.ratingCount})
              </span>
            </div>
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-ink">{project.title}</h1>
          <span className="mt-2 inline-block rounded-full bg-brand-tint px-3 py-1 text-xs font-bold text-brand">
            {taskCategoryLabel(project.category)}
          </span>

          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink">
            {project.description}
          </p>
          {project.descriptionExtra && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
              {project.descriptionExtra}
            </p>
          )}

          {project.lookingForBullets.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-ink">Who they&apos;re looking for</h3>
              <ul className="mt-2 space-y-1.5">
                {project.lookingForBullets.map((b: string) => (
                  <li key={b} className="flex gap-2 text-sm text-muted">
                    <span className="text-brand">•</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {project.requiredSkills.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-ink">Required skills</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {project.requiredSkills.map((s: string) => (
                  <span key={s} className="rounded-full bg-bg px-3 py-1.5 text-xs font-semibold text-muted">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {project.milestones.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-ink">Timeline</h3>
              <ol className="mt-3 space-y-3 border-l-2 border-border pl-4">
                {project.milestones.map((m: { id: string; label: string; note: string; dueDate: string }) => (
                  <li key={m.id}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-ink">{m.label}</span>
                      <span className="text-xs font-semibold text-muted">{m.dueDate}</span>
                    </div>
                    {m.note && <p className="text-xs text-muted">{m.note}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-white p-5 text-center">
            <div className="text-2xl font-extrabold text-ink">{formatRM(project.budget)}</div>
            <span className="text-xs font-semibold text-muted">fixed price</span>
          </div>

          <CostBreakdown
            role={role === "sme" ? "sme" : "student"}
            budget={project.budget}
            platformFee={project.platformFee}
            businessTotal={project.businessTotal}
          />

          {role === "student" && (
            <div className="rounded-2xl border border-border bg-white p-5">
              {sent ? (
                <div className="text-sm">
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
                <form onSubmit={handleReachOut} className="space-y-3">
                  <label className="block text-sm font-bold text-ink">
                    Message {project.sme.companyName}
                  </label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Tell them why you're a good fit…"
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                  {error && <p className="text-xs font-semibold text-red-600">{error.message}</p>}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-light disabled:opacity-60"
                  >
                    {sending ? "Sending…" : "Message SME"}
                  </button>
                </form>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
