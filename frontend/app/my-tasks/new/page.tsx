"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ME, GET_MY_PROJECTS } from "@/src/graphql/queries";
import { CREATE_PROJECT } from "@/src/graphql/mutations";
import { Navbar } from "@/src/components/Navbar";
import { TASK_CATEGORIES } from "@/src/lib/categories";
import { formatRM } from "@/src/lib/format";
import { friendlyError } from "@/src/lib/errors";

const inputClass =
  "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-brand";

function ListEditor({
  label,
  hint,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  hint: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const value = draft.trim();
    if (!value || items.includes(value)) return;
    onChange([...items, value]);
    setDraft("");
  }

  return (
    <div>
      <label className="text-sm font-bold text-ink">{label}</label>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={inputClass}
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-xl border border-border bg-white px-4 text-sm font-bold text-brand hover:bg-brand-tint"
        >
          Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item}
              className="flex items-center gap-1.5 rounded-full bg-brand-tint px-3 py-1.5 text-xs font-bold text-brand"
            >
              {item}
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => onChange(items.filter((i) => i !== item))}
                className="text-brand/60 hover:text-brand"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewTaskPage() {
  const router = useRouter();
  const { data: meData, loading: meLoading } = useQuery(GET_ME);
  const me = meData?.me;
  const isSme = me?.role === "sme";

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(TASK_CATEGORIES[0].value);
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionExtra, setDescriptionExtra] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [lookingForBullets, setLookingForBullets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [createProject, { loading: submitting }] = useMutation(CREATE_PROJECT, {
    refetchQueries: [GET_MY_PROJECTS],
  });

  useEffect(() => {
    if (meLoading) return;
    if (!me) router.replace("/auth?mode=signin");
    else if (!isSme) router.replace("/home");
  }, [meLoading, me, isSme, router]);

  if (meLoading || !isSme) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <p className="mt-10 text-center text-sm text-muted">Loading…</p>
      </div>
    );
  }

  const budgetNum = parseFloat(budget);
  const validBudget = !Number.isNaN(budgetNum) && budgetNum > 0;
  const fee = validBudget ? budgetNum * 0.02 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError("Please fill in the title and description.");
      return;
    }
    if (!validBudget) {
      setError("Please enter a valid task price.");
      return;
    }
    if (!deadline || new Date(deadline) <= new Date()) {
      setError("Please pick a deadline in the future.");
      return;
    }

    try {
      await createProject({
        variables: {
          title: title.trim(),
          description: description.trim(),
          category,
          budget: budgetNum.toFixed(2),
          deadline,
          descriptionExtra: descriptionExtra.trim(),
          requiredSkills,
          lookingForBullets,
        },
      });
      router.push("/my-tasks");
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-2xl px-6 py-8">
        <Link href="/my-tasks" className="text-sm font-bold text-brand hover:underline">
          ← My tasks
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-ink">Post a task</h1>
        <p className="mt-1 text-sm text-muted">
          Students see exactly the price you set — the flat 2% platform fee is added on your side
          only.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-bold text-ink">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design a new menu for our café"
              maxLength={120}
              className={`mt-2 ${inputClass}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-bold text-ink">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`mt-2 ${inputClass}`}
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-ink">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-ink">Task price (RM)</label>
            <p className="mt-0.5 text-xs text-muted">
              What the student receives — they keep 100% of this.
            </p>
            <input
              type="number"
              min="1"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 450"
              className={`mt-2 ${inputClass}`}
            />
            {validBudget && (
              <p className="mt-2 text-xs font-semibold text-muted">
                You pay {formatRM(budgetNum + fee)} total — {formatRM(budgetNum)} task price +{" "}
                {formatRM(fee)} platform fee (2%).
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-bold text-ink">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the work, the deliverables, and any context a student needs to quote well."
              rows={5}
              className={`mt-2 ${inputClass}`}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-ink">
              Extra details <span className="font-semibold text-muted">(optional)</span>
            </label>
            <textarea
              value={descriptionExtra}
              onChange={(e) => setDescriptionExtra(e.target.value)}
              placeholder="Brand guidelines, file formats, examples you like…"
              rows={3}
              className={`mt-2 ${inputClass}`}
            />
          </div>

          <ListEditor
            label="Required skills"
            hint="Shown as chips on your task card."
            placeholder="e.g. Adobe Illustrator"
            items={requiredSkills}
            onChange={setRequiredSkills}
          />

          <ListEditor
            label="Who you're looking for"
            hint="Bullet points shown on the task detail page."
            placeholder="e.g. Has designed for F&B brands before"
            items={lookingForBullets}
            onChange={setLookingForBullets}
          />

          {error && (
            <p className="rounded-xl bg-[#fdecec] px-4 py-3 text-sm font-semibold text-[#c0392b]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-light disabled:opacity-50"
          >
            {submitting ? "Posting…" : "Post task"}
          </button>
        </form>
      </div>
    </div>
  );
}
