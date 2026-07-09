"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_STUDENTS, GET_SAVED_STUDENT_IDS } from "@/src/graphql/queries";
import { SAVE_STUDENT, UNSAVE_STUDENT } from "@/src/graphql/mutations";
import { STUDENT_CATEGORIES, SPRICE_OPTS, RATE_OPTS } from "@/src/lib/categories";
import { Chip } from "@/src/components/Chip";
import { SearchBar } from "@/src/components/ui/SearchBar";
import { StudentCard, StudentCardProfile } from "@/src/components/StudentCard";

export function SmeHome() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [priceIdx, setPriceIdx] = useState(0);
  const [rateIdx, setRateIdx] = useState(0);
  const [vettedOnly, setVettedOnly] = useState(false);

  const priceOpt = SPRICE_OPTS[priceIdx];
  const rateOpt = RATE_OPTS[rateIdx];

  const { data, loading } = useQuery(GET_STUDENTS, {
    variables: {
      search: search || undefined,
      category: category || undefined,
      minPrice: priceOpt.min,
      maxPrice: priceOpt.max,
      minRating: rateOpt.min,
      vettedOnly: vettedOnly || undefined,
    },
  });
  const { data: savedData, refetch: refetchSaved } = useQuery(GET_SAVED_STUDENT_IDS);
  const [saveStudent] = useMutation(SAVE_STUDENT);
  const [unsaveStudent] = useMutation(UNSAVE_STUDENT);

  const savedIds: string[] = savedData?.savedStudentIds ?? [];

  async function toggleSave(id: string) {
    if (savedIds.includes(id)) {
      await unsaveStudent({ variables: { studentId: id } });
    } else {
      await saveStudent({ variables: { studentId: id } });
    }
    refetchSaved();
  }

  const students: StudentCardProfile[] = data?.students ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-extrabold text-ink">Find campus talent</h1>
      <p className="mt-1 text-sm font-medium text-muted">
        Campus-vetted students across 5 digital verticals — pay a flat 2%, nothing hidden.
      </p>

      <div className="mt-5">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search students by name or bio…"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Chip active={category === null} onClick={() => setCategory(null)}>
          All
        </Chip>
        {STUDENT_CATEGORIES.map((c) => (
          <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
            {c.label}
          </Chip>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setPriceIdx((priceIdx + 1) % SPRICE_OPTS.length)}
          className="rounded-full border border-border bg-white px-4 py-2 text-[13px] font-bold text-ink"
        >
          {priceOpt.label}
        </button>
        <button
          onClick={() => setRateIdx((rateIdx + 1) % RATE_OPTS.length)}
          className="rounded-full border border-border bg-white px-4 py-2 text-[13px] font-bold text-ink"
        >
          {rateOpt.label}
        </button>
        <button
          onClick={() => setVettedOnly(!vettedOnly)}
          className={`rounded-full border px-4 py-2 text-[13px] font-bold transition-colors ${
            vettedOnly
              ? "border-brand bg-brand-tint text-brand"
              : "border-border bg-white text-ink hover:border-brand-light"
          }`}
        >
          ✓ Campus-vetted only
        </button>
      </div>

      {loading ? (
        <p className="mt-10 text-center text-sm text-muted">Loading students…</p>
      ) : students.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">No students match your filters.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <StudentCard
              key={s.id}
              student={s}
              saved={savedIds.includes(s.id)}
              onToggleSave={toggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
