"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ME, MY_SME_PROFILE, MY_STUDENT_PROFILE } from "@/src/graphql/queries";
import { UPDATE_SME_PROFILE, UPDATE_STUDENT_PROFILE } from "@/src/graphql/mutations";
import type {
  MySmeProfile,
  MyStudentProfile,
  ResumeSuggestions,
} from "@/src/graphql/types";
import { Navbar } from "@/src/components/Navbar";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { friendlyError } from "@/src/lib/errors";

const BACKEND = (
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:8000/graphql/"
).replace(/\/graphql\/?$/, "");

const CATEGORIES = ["Design", "Writing", "Social Media", "Web", "Data", "Video"];

const inputClass =
  "w-full rounded-xl border border-transparent bg-bg px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:bg-white";
const labelClass = "mb-1.5 block text-xs font-bold text-ink";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

/* ── Student form ─────────────────────────────────────────────────────── */

type StudentForm = {
  university: string;
  major: string;
  graduationYear: string;
  primaryCategory: string;
  skills: string;
  bio: string;
  portfolioUrl: string;
  linkedinUrl: string;
  languages: string;
  priceLow: string;
  priceHigh: string;
  availabilityStatus: string;
  availableFrom: string;
};

function fromProfile(p: MyStudentProfile): StudentForm {
  return {
    university: p.university,
    major: p.major,
    graduationYear: p.graduationYear ? String(p.graduationYear) : "",
    primaryCategory: p.primaryCategory,
    skills: p.skills.join(", "),
    bio: p.bio,
    portfolioUrl: p.portfolioUrl,
    linkedinUrl: p.linkedinUrl,
    languages: p.languages,
    priceLow: parseFloat(p.priceLow) > 0 ? p.priceLow : "",
    priceHigh: parseFloat(p.priceHigh) > 0 ? p.priceHigh : "",
    availabilityStatus: p.availabilityStatus,
    availableFrom: p.availableFrom ?? "",
  };
}

function StudentProfileEditor() {
  const { data, loading, refetch } = useQuery(MY_STUDENT_PROFILE);
  const [update, { loading: saving }] = useMutation(UPDATE_STUDENT_PROFILE);
  const [form, setForm] = useState<StudentForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autofillNote, setAutofillNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data?.myStudentProfile && form === null) {
      setForm(fromProfile(data.myStudentProfile));
    }
  }, [data, form]);

  if (loading || !form) {
    return <p className="mt-10 text-center text-sm text-muted">Loading…</p>;
  }

  const set = (key: keyof StudentForm) => (value: string) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setSaved(false);
  };

  async function handleResume(file: File) {
    setError(null);
    setAutofillNote(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`${BACKEND}/api/profile/resume/`, {
        method: "POST",
        credentials: "include",
        body,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed");
        return;
      }
      const s: ResumeSuggestions = json.suggestions ?? {};
      let filled = 0;
      setForm((f) => {
        if (!f) return f;
        const next = { ...f };
        const fill = (key: keyof StudentForm, value: string | undefined) => {
          if (value && !next[key].trim()) {
            next[key] = value;
            filled += 1;
          }
        };
        fill("university", s.university);
        fill("graduationYear", s.graduation_year ? String(s.graduation_year) : undefined);
        fill("skills", s.skills?.join(", "));
        fill("languages", s.languages);
        fill("linkedinUrl", s.linkedin_url);
        fill("portfolioUrl", s.portfolio_url);
        fill("bio", s.bio);
        return next;
      });
      setAutofillNote(
        filled > 0
          ? `Filled ${filled} empty field${filled === 1 ? "" : "s"} from your resume — review and save.`
          : "Resume saved. Nothing new to fill — your profile already covers it."
      );
      setSaved(false);
    } catch {
      setError("Upload failed — is the backend running?");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!form) return;
    setError(null);
    try {
      await update({
        variables: {
          university: form.university,
          major: form.major,
          graduationYear: form.graduationYear ? parseInt(form.graduationYear, 10) : 0,
          primaryCategory: form.primaryCategory,
          skills: form.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          bio: form.bio,
          portfolioUrl: form.portfolioUrl,
          linkedinUrl: form.linkedinUrl,
          languages: form.languages,
          priceLow: form.priceLow || "0",
          priceHigh: form.priceHigh || "0",
          availabilityStatus: form.availabilityStatus,
          ...(form.availableFrom ? { availableFrom: form.availableFrom } : {}),
        },
      });
      await refetch();
      setSaved(true);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-base font-extrabold text-ink">Autofill your profile</h2>
        <p className="mt-1 text-sm text-muted">
          Upload your resume (PDF or TXT) and we&apos;ll pre-fill the empty fields below. You
          review everything before saving.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleResume(file);
            }}
          />
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Reading resume…" : "Upload resume"}
          </Button>
          {autofillNote && (
            <p className="text-xs font-semibold text-success">{autofillNote}</p>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-extrabold text-ink">Profile details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="University">
            <input
              value={form.university}
              onChange={(e) => set("university")(e.target.value)}
              className={inputClass}
              placeholder="Universiti Malaya"
            />
          </Field>
          <Field label="Major">
            <input
              value={form.major}
              onChange={(e) => set("major")(e.target.value)}
              className={inputClass}
              placeholder="BSc Computer Science"
            />
          </Field>
          <Field label="Graduation year">
            <input
              type="number"
              value={form.graduationYear}
              onChange={(e) => set("graduationYear")(e.target.value)}
              className={inputClass}
              placeholder="2028"
            />
          </Field>
          <Field label="Primary category">
            <select
              value={form.primaryCategory}
              onChange={(e) => set("primaryCategory")(e.target.value)}
              className={inputClass}
            >
              <option value="">Choose a category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Skills (comma-separated)">
            <input
              value={form.skills}
              onChange={(e) => set("skills")(e.target.value)}
              className={inputClass}
              placeholder="Figma, React, Copywriting"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Bio">
            <textarea
              value={form.bio}
              onChange={(e) => set("bio")(e.target.value)}
              rows={4}
              className={`${inputClass} resize-y`}
              placeholder="Tell businesses what you do best…"
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="LinkedIn">
            <input
              value={form.linkedinUrl}
              onChange={(e) => set("linkedinUrl")(e.target.value)}
              className={inputClass}
              placeholder="https://linkedin.com/in/yourname"
            />
          </Field>
          <Field label="Website / portfolio">
            <input
              value={form.portfolioUrl}
              onChange={(e) => set("portfolioUrl")(e.target.value)}
              className={inputClass}
              placeholder="https://yourname.dev"
            />
          </Field>
          <Field label="Languages">
            <input
              value={form.languages}
              onChange={(e) => set("languages")(e.target.value)}
              className={inputClass}
              placeholder="EN · BM · 中文"
            />
          </Field>
          <Field label="Availability">
            <select
              value={form.availabilityStatus}
              onChange={(e) => set("availabilityStatus")(e.target.value)}
              className={inputClass}
            >
              <option value="now">Available now</option>
              <option value="from">From a date</option>
            </select>
          </Field>
          {form.availabilityStatus === "from" && (
            <Field label="Available from">
              <input
                type="date"
                value={form.availableFrom}
                onChange={(e) => set("availableFrom")(e.target.value)}
                className={inputClass}
              />
            </Field>
          )}
          <Field label="Price from (RM)">
            <input
              type="number"
              value={form.priceLow}
              onChange={(e) => set("priceLow")(e.target.value)}
              className={inputClass}
              placeholder="300"
            />
          </Field>
          <Field label="Price to (RM)">
            <input
              type="number"
              value={form.priceHigh}
              onChange={(e) => set("priceHigh")(e.target.value)}
              className={inputClass}
              placeholder="600"
            />
          </Field>
        </div>

        {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
        {saved && (
          <p className="mt-4 text-sm font-semibold text-success">Profile saved ✓</p>
        )}

        <div className="mt-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ── SME form ─────────────────────────────────────────────────────────── */

type SmeForm = {
  companyName: string;
  industry: string;
  location: string;
  website: string;
  description: string;
  ssmNumber: string;
};

function fromSme(p: MySmeProfile): SmeForm {
  return {
    companyName: p.companyName,
    industry: p.industry,
    location: p.location,
    website: p.website,
    description: p.description,
    ssmNumber: p.ssmNumber,
  };
}

function SmeProfileEditor() {
  const { data, loading, refetch } = useQuery(MY_SME_PROFILE);
  const [update, { loading: saving }] = useMutation(UPDATE_SME_PROFILE);
  const [form, setForm] = useState<SmeForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.mySmeProfile && form === null) {
      setForm(fromSme(data.mySmeProfile));
    }
  }, [data, form]);

  if (loading || !form) {
    return <p className="mt-10 text-center text-sm text-muted">Loading…</p>;
  }

  const set = (key: keyof SmeForm) => (value: string) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setSaved(false);
  };

  async function handleSave() {
    if (!form) return;
    setError(null);
    try {
      await update({ variables: { ...form } });
      await refetch();
      setSaved(true);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-base font-extrabold text-ink">Company details</h2>
      {data?.mySmeProfile.isVerified && (
        <p className="mt-1 text-xs font-bold text-success">SSM verified ✓</p>
      )}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Company name">
          <input
            value={form.companyName}
            onChange={(e) => set("companyName")(e.target.value)}
            className={inputClass}
            placeholder="Kopi Kita Sdn Bhd"
          />
        </Field>
        <Field label="Industry">
          <input
            value={form.industry}
            onChange={(e) => set("industry")(e.target.value)}
            className={inputClass}
            placeholder="F&B"
          />
        </Field>
        <Field label="Location">
          <input
            value={form.location}
            onChange={(e) => set("location")(e.target.value)}
            className={inputClass}
            placeholder="Kuala Lumpur"
          />
        </Field>
        <Field label="Website">
          <input
            value={form.website}
            onChange={(e) => set("website")(e.target.value)}
            className={inputClass}
            placeholder="https://yourcompany.my"
          />
        </Field>
        <Field label="SSM number">
          <input
            value={form.ssmNumber}
            onChange={(e) => set("ssmNumber")(e.target.value)}
            className={inputClass}
            placeholder="202301234567"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="About the company">
          <textarea
            value={form.description}
            onChange={(e) => set("description")(e.target.value)}
            rows={4}
            className={`${inputClass} resize-y`}
            placeholder="What does your business do?"
          />
        </Field>
      </div>

      {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
      {saved && <p className="mt-4 text-sm font-semibold text-success">Profile saved ✓</p>}

      <div className="mt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </Card>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const router = useRouter();
  const { data: meData, loading: meLoading } = useQuery(GET_ME);
  const me = meData?.me;

  useEffect(() => {
    if (!meLoading && !me) router.replace("/auth?mode=signin");
  }, [meLoading, me, router]);

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
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Your profile</h1>
        <p className="mt-1.5 text-sm text-muted">
          {me.role === "student"
            ? "This is what businesses see when they find you in the talent pool."
            : "This is what students see when you post tasks and reach out."}
        </p>
        <p className="mt-1 text-xs font-semibold text-faint">
          Signed in as {me.username}
        </p>
        <div className="mt-7">
          {me.role === "student" ? <StudentProfileEditor /> : <SmeProfileEditor />}
        </div>
      </main>
    </div>
  );
}
