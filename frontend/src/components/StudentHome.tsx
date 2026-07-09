"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_PROJECTS, GET_SAVED_TASK_IDS } from "@/src/graphql/queries";
import { SAVE_TASK, UNSAVE_TASK } from "@/src/graphql/mutations";
import { TASK_CATEGORIES, PRICE_OPTS, SORT_OPTS } from "@/src/lib/categories";
import { Chip, PillButton } from "@/src/components/Chip";
import { TaskCard, TaskCardProject } from "@/src/components/TaskCard";

export function StudentHome() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [priceIdx, setPriceIdx] = useState(0);
  const [sort, setSort] = useState("new");

  const priceOpt = PRICE_OPTS[priceIdx];

  const { data, loading } = useQuery(GET_PROJECTS, {
    variables: {
      search: search || undefined,
      category: category || undefined,
      minPrice: priceOpt.min,
      maxPrice: priceOpt.max,
      sort,
    },
  });
  const { data: savedData, refetch: refetchSaved } = useQuery(GET_SAVED_TASK_IDS);
  const [saveTask] = useMutation(SAVE_TASK);
  const [unsaveTask] = useMutation(UNSAVE_TASK);

  const savedIds: string[] = savedData?.savedTaskIds ?? [];

  async function toggleSave(id: string) {
    if (savedIds.includes(id)) {
      await unsaveTask({ variables: { projectId: id } });
    } else {
      await saveTask({ variables: { projectId: id } });
    }
    refetchSaved();
  }

  const projects: TaskCardProject[] = data?.projects ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-extrabold text-ink">Find your next task</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tasks, skills, or businesses…"
        className="mt-4 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-brand"
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Chip active={category === null} onClick={() => setCategory(null)}>
          All
        </Chip>
        {TASK_CATEGORIES.map((c) => (
          <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
            {c.label}
          </Chip>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => setPriceIdx((priceIdx + 1) % PRICE_OPTS.length)}
          className="rounded-full border border-border bg-white px-4 py-2 text-[13px] font-bold text-ink"
        >
          {priceOpt.label}
        </button>
        <div className="flex rounded-full bg-white p-1 shadow-sm">
          {SORT_OPTS.map((s) => (
            <PillButton key={s.value} active={sort === s.value} onClick={() => setSort(s.value)}>
              {s.label}
            </PillButton>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-10 text-center text-sm text-muted">Loading tasks…</p>
      ) : projects.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">No tasks match your filters.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <TaskCard
              key={p.id}
              project={p}
              saved={savedIds.includes(p.id)}
              onToggleSave={toggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
