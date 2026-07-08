"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ME, GET_STUDENT } from "@/src/graphql/queries";
import { REACH_OUT } from "@/src/graphql/mutations";
import { Navbar } from "@/src/components/Navbar";
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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-extrabold text-white"
              style={{ background: gradientFor(student.user.username) }}
            >
              {initials(student.user.username)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold text-ink">{student.user.username}</span>
                {student.isVetted && (
                  <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[10px] font-bold text-brand">
                    Campus-vetted
                  </span>
                )}
              </div>
              <span className="text-sm text-muted">
                {student.major} · {student.university}
              </span>
            </div>
          </div>

          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-ink">
            {student.bio}
          </p>

          <div className="mt-6">
            <h3 className="text-sm font-bold text-ink">All skills</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {student.skills.map((s: string) => (
                <span key={s} className="rounded-full bg-bg px-3 py-1.5 text-xs font-semibold text-muted">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <QuickFact label="University" value={student.university} />
            <QuickFact label="Graduating" value={String(student.graduationYear)} />
            <QuickFact label="Languages" value={student.languages || "—"} />
            <QuickFact
              label="Availability"
              value={student.availabilityStatus === "now" ? "Available now" : `From ${student.availableFrom}`}
            />
          </div>

          {student.reviews.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-ink">Reviews from businesses</h3>
              <div className="mt-3 space-y-3">
                {student.reviews.map((r: { id: string; rating: number; comment: string; reviewer: { username: string } }) => (
                  <div key={r.id} className="rounded-xl border border-border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-ink">{r.reviewer.username}</span>
                      <span className="text-xs font-semibold text-accent">★ {r.rating}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-white p-5 text-center">
            <div className="text-xl font-extrabold text-ink">
              {formatRM(student.priceLow)}–{formatRM(student.priceHigh)}
            </div>
            <span className="text-xs font-semibold text-muted">typical task price</span>
            <div className="mt-2 text-xs font-semibold text-accent">
              ★ {student.rating.toFixed(1)} ({student.ratingCount} ratings)
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <h3 className="text-sm font-bold text-ink">Cost breakdown</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Whatever price you agree on in chat, the platform fee is a flat 2% —
              charged to you, the business, on top. {student.user.username} keeps
              100% of the agreed price. Funds are held in escrow until you approve
              the work.
            </p>
          </div>

          {role === "sme" && (
            <div className="rounded-2xl border border-border bg-white p-5">
              {sent ? (
                <div className="text-sm">
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
                <form onSubmit={handleReachOut} className="space-y-3">
                  <label className="block text-sm font-bold text-ink">
                    Message {student.user.username}
                  </label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Tell them about the task…"
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                  {error && <p className="text-xs font-semibold text-red-600">{error.message}</p>}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-light disabled:opacity-60"
                  >
                    {sending ? "Sending…" : "Message student"}
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

function QuickFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-bg p-3">
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-ink">{value}</div>
    </div>
  );
}
