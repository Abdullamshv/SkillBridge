"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ME, GET_STUDENT } from "@/src/graphql/queries";
import { REACH_OUT } from "@/src/graphql/mutations";
import { Navbar } from "@/src/components/Navbar";
import { VettedBadge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { formatRM, gradientFor, initials } from "@/src/lib/format";

export default function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: meData } = useQuery(GET_ME);
  const { data, loading } = useQuery(GET_STUDENT, { variables: { id } });
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [reachOut, { loading: sending, error }] = useMutation(REACH_OUT);

  const role = meData?.me?.role;
  const student = data?.student;

  async function handleReachOut(e: React.FormEvent) {
    e.preventDefault();
    await reachOut({ variables: { studentId: id, message } });
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

  if (!student) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <p className="mt-10 text-center text-sm text-muted">Student not found.</p>
      </div>
    );
  }

  const availability =
    student.availabilityStatus === "now" ? "Available now" : `From ${student.availableFrom}`;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-5xl px-6 pt-6">
        <Link href="/home" className="text-xs font-bold text-muted hover:text-ink">
          ‹ Back to talent
        </Link>
      </div>
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-start gap-6 px-6 py-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Header card */}
          <Card className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-extrabold text-white"
                  style={{ background: gradientFor(student.user.username) }}
                >
                  {initials(student.user.username)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-ink">{student.user.username}</span>
                    {student.isVetted && <VettedBadge />}
                  </div>
                  <span className="text-sm text-muted">
                    {student.major} · {student.university}
                  </span>
                  <p className="mt-1 text-xs font-semibold text-muted">
                    <span className="text-accent">★ {student.rating.toFixed(1)}</span> ({student.ratingCount}{" "}
                    review{student.ratingCount === 1 ? "" : "s"})
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${
                  student.availabilityStatus === "now"
                    ? "bg-success-tint text-success"
                    : "bg-accent-tint text-accent-dark"
                }`}
              >
                {availability}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {student.skills.slice(0, 3).map((s: string) => (
                <span key={s} className="rounded-full bg-brand-tint px-3 py-1 text-xs font-bold text-brand">
                  {s}
                </span>
              ))}
            </div>
          </Card>

          {/* About */}
          <Card className="p-6">
            <h3 className="text-sm font-extrabold text-ink">About</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{student.bio}</p>
          </Card>

          {/* Skills */}
          <Card className="p-6">
            <h3 className="text-sm font-extrabold text-ink">Skills</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {student.skills.map((s: string) => (
                <span key={s} className="rounded-full bg-bg px-3 py-1.5 text-xs font-semibold text-muted">
                  {s}
                </span>
              ))}
            </div>
          </Card>

          {/* Reviews */}
          {student.reviews.length > 0 && (
            <Card className="p-6">
              <h3 className="text-sm font-extrabold text-ink">What businesses say</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {student.reviews.map(
                  (r: { id: string; rating: number; comment: string; reviewer: { username: string } }) => (
                    <div key={r.id} className="rounded-xl bg-bg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-ink">{r.reviewer.username}</span>
                        <span className="text-xs font-semibold text-accent">★ {r.rating.toFixed(1)}</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">“{r.comment}”</p>
                    </div>
                  )
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sticky sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="p-5">
            <div className="text-2xl font-extrabold text-ink">
              {formatRM(student.priceLow)}–{formatRM(student.priceHigh)}
            </div>
            <span className="text-xs font-semibold text-muted">per task · typical range</span>
            <p className="mt-3 rounded-xl bg-brand-tint px-3 py-2.5 text-xs font-medium leading-relaxed text-brand">
              Payment is held in escrow and released when you approve the delivery. A flat 2% fee applies at
              checkout.
            </p>
            {role === "sme" &&
              (sent ? (
                <div className="mt-4 text-sm">
                  <p className="font-bold text-ink">Message sent!</p>
                  <p className="mt-1 text-muted">
                    {student.user.username} will reply in your{" "}
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
                    placeholder="Tell them about the task…"
                    className="w-full rounded-xl border border-transparent bg-bg px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:bg-white"
                  />
                  {error && <p className="text-xs font-semibold text-red-600">{error.message}</p>}
                  <Button type="submit" disabled={sending} className="w-full">
                    {sending ? "Sending…" : `💬 Message ${student.user.username}`}
                  </Button>
                </form>
              ))}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-extrabold text-ink">Quick facts</h3>
            <dl className="mt-3 space-y-2.5 text-sm">
              <QuickFact label="University" value={student.university} />
              <QuickFact label="Graduating" value={String(student.graduationYear)} />
              <QuickFact label="Tasks completed" value={String(student.ratingCount)} />
              <QuickFact label="Languages" value={student.languages || "—"} />
              <QuickFact label="Availability" value={availability} />
              <QuickFact
                label="Campus-vetted"
                value={
                  student.isVetted
                    ? student.vettedAt
                      ? `Since ${new Date(student.vettedAt).toLocaleDateString("en-MY", { month: "short", year: "numeric" })}`
                      : "Yes"
                    : "Not yet"
                }
              />
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function QuickFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="text-right text-sm font-bold text-ink">{value}</dd>
    </div>
  );
}
