import Link from "next/link";
import { Navbar } from "@/src/components/Navbar";

const STATS = [
  { big: "100%", label: "of the task price goes to the student" },
  { big: "2%", label: "flat fee, charged to the business only" },
  { big: "5", label: "verticals: design, writing, social, web, data" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 flex-col items-center px-6 py-20 text-center">
        <span className="mb-5 inline-block rounded-full bg-brand-tint px-3.5 py-1.5 text-xs font-bold text-brand">
          Klang Valley MVP
        </span>
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
          Real work. Real pay.{" "}
          <span className="text-brand">Right on campus.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          SkillBridge connects Malaysian university students with local SMEs that
          need affordable digital work — design, writing, social media, web
          development and data.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/auth?mode=signup&role=student"
            className="rounded-full bg-brand px-7 py-3.5 text-sm font-bold text-white hover:bg-brand-light"
          >
            I&apos;m a Student
          </Link>
          <Link
            href="/auth?mode=signup&role=sme"
            className="rounded-full border border-border bg-white px-7 py-3.5 text-sm font-bold text-ink hover:bg-brand-tint"
          >
            I&apos;m a Business
          </Link>
        </div>

        <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-extrabold text-brand">{s.big}</div>
              <p className="mt-2 text-sm font-medium text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </main>

      <section className="border-t border-border bg-white px-6 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 sm:grid-cols-2">
          <div className="rounded-2xl border border-border p-6">
            <h3 className="text-lg font-extrabold text-ink">For students</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Browse real, fixed-price briefs from local businesses. Keep 100% of
              what you earn — no platform cut on your side, ever. Get campus-vetted
              and build a portfolio that outlasts your degree.
            </p>
          </div>
          <div className="rounded-2xl border border-border p-6">
            <h3 className="text-lg font-extrabold text-ink">For businesses</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Post a task, message vetted student talent directly, and pay a flat
              2% fee — nothing hidden. Funds sit in escrow until you approve the
              work.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-brand px-6 py-16 text-center">
        <h2 className="text-2xl font-extrabold text-white">
          Ready to get started?
        </h2>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/auth?mode=signup"
            className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-brand hover:bg-brand-tint"
          >
            Create your account
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-faint">
        © {new Date().getFullYear()} SkillBridge. Klang Valley, Malaysia.
      </footer>
    </div>
  );
}
