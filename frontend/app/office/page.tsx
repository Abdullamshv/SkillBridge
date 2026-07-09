"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ENGAGEMENTS, GET_ME } from "@/src/graphql/queries";
import {
  ADVANCE_ENGAGEMENT_STATUS,
  FUND_ESCROW,
  SEND_MESSAGE,
  SUBMIT_REVIEW,
} from "@/src/graphql/mutations";
import type { Engagement } from "@/src/graphql/types";
import { Navbar } from "@/src/components/Navbar";
import { friendlyError } from "@/src/lib/errors";
import { formatRM, gradientFor, initials } from "@/src/lib/format";

const BACKEND = (
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:8000/graphql/"
).replace(/\/graphql\/?$/, "");

const STEPS = ["Reached out", "Agreed", "In progress", "Delivered", "Completed"];
const STATUS_ORDER = ["reached_out", "agreed", "in_progress", "delivered", "completed"];

const STATUS_PILL: Record<string, { background: string; color: string }> = {
  reached_out: { background: "#EEEDF5", color: "#6B7280" },
  agreed: { background: "#ECEAFC", color: "#4E3FE3" },
  in_progress: { background: "#FDEFE3", color: "#C96A12" },
  delivered: { background: "#E3F4EC", color: "#1F9D6B" },
  completed: { background: "#4E3FE3", color: "#FFFFFF" },
};

function statusLabel(status: string): string {
  return STEPS[STATUS_ORDER.indexOf(status)] ?? status;
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" });
  return sameDay ? time : `${d.toLocaleDateString("en-MY", { day: "numeric", month: "short" })} ${time}`;
}

export default function OfficePage() {
  const router = useRouter();
  const { data: meData, loading: meLoading } = useQuery(GET_ME);
  const me = meData?.me;

  const { data, loading, refetch } = useQuery(GET_ENGAGEMENTS, {
    skip: !me,
    pollInterval: 4000,
  });

  const [tab, setTab] = useState<"progress" | "reach">("progress");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!meLoading && !me) router.replace("/auth?mode=signin");
  }, [meLoading, me, router]);

  const engagements = useMemo(() => data?.engagements ?? [], [data]);
  const threads = useMemo(
    () =>
      engagements.filter((e) =>
        tab === "reach" ? e.status === "reached_out" : e.status !== "reached_out"
      ),
    [engagements, tab]
  );
  // Selection spans both tabs so the open chat survives its own status change
  // (agreeing terms moves a thread from "Reach outs" to "Tasks in progress").
  const selected =
    engagements.find((e) => e.id === selectedId) ?? threads[0] ?? null;
  const selectedStatus = selected?.status;

  useEffect(() => {
    if (selectedStatus) {
      setTab(selectedStatus === "reached_out" ? "reach" : "progress");
    }
  }, [selectedStatus]);

  const progressCount = engagements.filter((e) => e.status !== "reached_out").length;
  const reachCount = engagements.length - progressCount;

  if (meLoading || !me) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <p className="mt-10 text-center text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[340px_1fr]">
        <aside>
          <h1 className="text-2xl font-extrabold text-ink">Office</h1>

          <div className="mt-4 flex rounded-xl bg-white p-1 shadow-sm">
            <button
              onClick={() => setTab("progress")}
              className={`flex-1 rounded-lg py-2.5 text-[13px] font-bold transition-colors ${
                tab === "progress" ? "bg-brand-tint text-brand" : "text-muted"
              }`}
            >
              Tasks in progress ({progressCount})
            </button>
            <button
              onClick={() => setTab("reach")}
              className={`flex-1 rounded-lg py-2.5 text-[13px] font-bold transition-colors ${
                tab === "reach" ? "bg-brand-tint text-brand" : "text-muted"
              }`}
            >
              Reach outs ({reachCount})
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {loading && threads.length === 0 ? (
              <p className="text-sm text-muted">Loading threads…</p>
            ) : threads.length === 0 ? (
              <p className="text-sm text-muted">
                {tab === "reach"
                  ? "No reach outs yet — message someone from the marketplace."
                  : "Nothing in progress yet."}
              </p>
            ) : (
              threads.map((e) => {
                const other =
                  me.role === "sme" ? e.student.user.username : e.sme.companyName;
                const last = e.messages[e.messages.length - 1];
                const active = selected?.id === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedId(e.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                      active ? "border-brand bg-white shadow-sm" : "border-border bg-white/60 hover:bg-white"
                    }`}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
                      style={{ background: gradientFor(other) }}
                    >
                      {initials(other)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-ink">{other}</span>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                          style={STATUS_PILL[e.status]}
                        >
                          {statusLabel(e.status)}
                        </span>
                      </div>
                      <p className="truncate text-xs font-semibold text-muted">
                        {e.project?.title ?? "Direct reach out"}
                      </p>
                      {last && (
                        <p className="mt-0.5 truncate text-xs text-faint">
                          {last.attachments.length > 0 ? `📎 ${last.attachments[0].originalName}` : last.text}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {selected ? (
          <ChatPane
            key={selected.id}
            engagement={selected}
            meId={me.id}
            meRole={me.role}
            meUsername={me.username}
            onChanged={() => refetch()}
          />
        ) : (
          <div className="flex items-center justify-center rounded-2xl border border-border bg-white p-10 text-sm text-muted">
            Select a thread to open the conversation.
          </div>
        )}
      </div>
    </div>
  );
}

function ChatPane({
  engagement,
  meId,
  meRole,
  meUsername,
  onChanged,
}: {
  engagement: Engagement;
  meId: string;
  meRole: string;
  meUsername: string;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [priceDraft, setPriceDraft] = useState(
    engagement.agreedPrice ?? engagement.project?.budget ?? ""
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE);
  const [advanceStatus, { loading: advancing }] = useMutation(ADVANCE_ENGAGEMENT_STATUS);
  const [fundEscrow, { loading: funding }] = useMutation(FUND_ESCROW);

  const stepIndex = STATUS_ORDER.indexOf(engagement.status);
  const other = meRole === "sme" ? engagement.student.user.username : engagement.sme.companyName;
  const busy = advancing || funding;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [engagement.messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await sendMessage({ variables: { engagementId: engagement.id, text } });
    onChanged();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`${BACKEND}/api/upload/${engagement.id}/`, {
      method: "POST",
      credentials: "include",
      body,
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setActionError(payload?.error ?? "Upload failed");
      return;
    }
    setActionError(null);
    onChanged();
  }

  async function doAdvance(status: string, agreedPrice?: string) {
    setActionError(null);
    try {
      await advanceStatus({ variables: { engagementId: engagement.id, status, agreedPrice } });
      onChanged();
    } catch (err) {
      setActionError(friendlyError(err));
    }
  }

  async function doFund() {
    setActionError(null);
    try {
      await fundEscrow({ variables: { engagementId: engagement.id } });
      onChanged();
    } catch (err) {
      setActionError(friendlyError(err));
    }
  }

  const tx = engagement.transaction;
  const escrowHeld = tx?.status === "held";
  const price = engagement.agreedPrice ?? engagement.project?.budget ?? null;

  let action: React.ReactNode = null;
  if (meRole === "sme" && engagement.status === "reached_out") {
    action = (
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={priceDraft}
          onChange={(e) => setPriceDraft(e.target.value)}
          inputMode="decimal"
          className="w-32 rounded-full border border-border px-4 py-2 text-sm outline-none focus:border-brand"
          placeholder="Price (RM)"
        />
        <button
          disabled={busy || !priceDraft}
          onClick={() => doAdvance("agreed", priceDraft)}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-light disabled:opacity-60"
        >
          Agree terms at RM {priceDraft || "…"}
        </button>
      </div>
    );
  } else if (meRole === "sme" && engagement.status !== "completed" && !tx) {
    action = (
      <button
        disabled={busy}
        onClick={doFund}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-light disabled:opacity-60"
      >
        Fund escrow — {price ? formatRM(price) : ""} + 2% fee
      </button>
    );
  } else if (meRole === "student" && engagement.status === "agreed") {
    action = (
      <button
        disabled={busy}
        onClick={() => doAdvance("in_progress")}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-light disabled:opacity-60"
      >
        Start work
      </button>
    );
  } else if (meRole === "student" && engagement.status === "in_progress") {
    action = (
      <button
        disabled={busy}
        onClick={() => doAdvance("delivered")}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-light disabled:opacity-60"
      >
        Mark delivered
      </button>
    );
  } else if (meRole === "sme" && engagement.status === "delivered" && escrowHeld) {
    action = (
      <button
        disabled={busy}
        onClick={() => doAdvance("completed")}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-light disabled:opacity-60"
      >
        Approve &amp; release {tx ? formatRM(tx.amount) : ""}
      </button>
    );
  }

  return (
    <section className="flex min-h-[70vh] flex-col rounded-2xl border border-border bg-white">
      <header className="border-b border-border p-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-base font-extrabold text-white"
            style={{ background: gradientFor(other) }}
          >
            {initials(other)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-bold text-ink">{other}</span>
              <span className="rounded-full px-2.5 py-1 text-[10.5px] font-bold" style={STATUS_PILL[engagement.status]}>
                {statusLabel(engagement.status)}
              </span>
            </div>
            <p className="truncate text-xs font-semibold text-muted">
              {engagement.project?.title ?? "Direct reach out"}
              {price ? ` · ${formatRM(price)}` : ""}
              {tx ? ` · escrow ${tx.status === "held" ? "funded" : tx.status}` : ""}
            </p>
          </div>
        </div>

        <ol className="mt-4 flex items-center gap-0">
          {STEPS.map((label, i) => {
            const done = i <= stepIndex;
            return (
              <li key={label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1" style={{ minWidth: 0 }}>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold ${
                      done ? "bg-brand text-white" : "bg-bg text-faint"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`whitespace-nowrap text-[10.5px] font-bold ${done ? "text-brand" : "text-faint"}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mx-1.5 mb-4 h-0.5 flex-1 rounded ${i < stepIndex ? "bg-brand" : "bg-border"}`} />
                )}
              </li>
            );
          })}
        </ol>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
        {engagement.messages.map((m) => {
          const mine = m.sender.id === meId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-bg text-ink"
                }`}
              >
                {m.text && <p className="whitespace-pre-line">{m.text}</p>}
                {m.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.url ? `${BACKEND}${a.url}` : undefined}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-1.5 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                      mine ? "bg-white/15 text-white" : "bg-white text-ink"
                    }`}
                  >
                    📎 {a.originalName}
                    <span className={mine ? "text-white/70" : "text-faint"}>{fmtBytes(a.sizeBytes)}</span>
                  </a>
                ))}
                <div className={`mt-1 text-[10px] font-semibold ${mine ? "text-white/60" : "text-faint"}`}>
                  {timeLabel(m.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="border-t border-border p-4">
        {actionError && <p className="mb-2 text-xs font-semibold text-red-600">{actionError}</p>}
        {action && <div className="mb-3">{action}</div>}

        {engagement.status === "completed" && !engagement.reviewerUsernames.includes(meUsername) && (
          <ReviewForm engagementId={engagement.id} otherName={other} onDone={onChanged} />
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title="Attach a file (up to 50 MB in dev)"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-lg hover:bg-bg"
          >
            📎
          </button>
          <input ref={fileRef} type="file" hidden onChange={handleUpload} />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${other}…`}
            className="min-w-0 flex-1 rounded-full border border-border px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-light disabled:opacity-60"
          >
            Send
          </button>
        </form>
      </footer>
    </section>
  );
}

function ReviewForm({
  engagementId,
  otherName,
  onDone,
}: {
  engagementId: string;
  otherName: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitReview, { loading }] = useMutation(SUBMIT_REVIEW);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await submitReview({ variables: { engagementId, rating, comment } });
      onDone();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-3 rounded-2xl bg-bg p-4">
      <p className="text-sm font-bold text-ink">How was working with {otherName}?</p>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={`text-xl ${n <= rating ? "text-accent" : "text-border"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="A sentence or two about the experience…"
        className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
      />
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-full bg-brand px-5 py-2 text-sm font-bold text-white hover:bg-brand-light disabled:opacity-60"
      >
        Submit review
      </button>
    </form>
  );
}
