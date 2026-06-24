import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-lg tracking-tight">SkillBridge</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/projects" className="text-zinc-600 hover:text-zinc-900">
            Browse Projects
          </Link>
          <Link
            href="/auth/login"
            className="text-zinc-600 hover:text-zinc-900"
          >
            Log in
          </Link>
          <Link
            href="/auth/register"
            className="rounded-full bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700"
          >
            Sign up
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
        <span className="mb-4 inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
          Klang Valley MVP
        </span>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Real projects. Real experience.{" "}
          <span className="text-indigo-600">Right on campus.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-zinc-500">
          SkillBridge connects university students with local Malaysian SMEs for
          paid digital projects — design, copywriting, development, and more.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/auth/register?role=student"
            className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-500"
          >
            I&apos;m a Student
          </Link>
          <Link
            href="/auth/register?role=sme"
            className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            I&apos;m a Business
          </Link>
        </div>
      </main>

      {/* Feature strip */}
      <section className="border-t border-zinc-100 bg-zinc-50 px-6 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 sm:grid-cols-3 text-center">
          {[
            {
              title: "Post a Project",
              body: "SMEs describe the task, set a budget, and pick the best student proposal.",
            },
            {
              title: "Get Matched",
              body: "Students browse real briefs, submit proposals, and build their portfolios.",
            },
            {
              title: "Safe Payments",
              body: "Funds are held in escrow and released only when the work is approved.",
            },
          ].map((f) => (
            <div key={f.title}>
              <h3 className="font-semibold text-zinc-900">{f.title}</h3>
              <p className="mt-2 text-sm text-zinc-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-100 px-6 py-6 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} SkillBridge. Klang Valley, Malaysia.
      </footer>
    </div>
  );
}
