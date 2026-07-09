import Link from "next/link";
import { Navbar } from "@/src/components/Navbar";
import { Button } from "@/src/components/ui/Button";

const STATS = [
  { big: "100%", label: "payout goes to students" },
  { big: "2%", label: "flat fee for businesses — nothing hidden" },
  { big: "5", label: "digital skill verticals, campus-vetted" },
];

const FLOATING_PILLS = [
  { icon: "🛡", label: "Safe escrow payments", className: "right-0 top-2" },
  { icon: "🎓", label: "Campus-vetted talent", className: "left-4 top-20" },
  { icon: "💸", label: "100% payout for students", className: "right-6 top-40" },
  { icon: "％", label: "Flat 2% fee, nothing hidden", className: "left-0 bottom-6" },
];

const HOW_IT_WORKS = [
  {
    icon: "👤",
    tint: "bg-brand-tint",
    title: "Create your profile",
    text: "Students verify with a campus email; businesses with an SSM number. Trust on both sides, day one.",
  },
  {
    icon: "🔍",
    tint: "bg-accent-tint",
    title: "Match on a task",
    text: "Students browse paid tasks; businesses browse vetted talent. Either side can reach out first.",
  },
  {
    icon: "💬",
    tint: "bg-brand-tint",
    title: "Chat & deliver in Office",
    text: "Messages, drafts and big files stay in one thread, with a clear status from reach-out to done.",
  },
  {
    icon: "✅",
    tint: "bg-success-tint",
    title: "Get paid — keep 100%",
    text: "Escrow releases when work is approved. Students keep every ringgit; businesses pay a flat 2%.",
  },
];

const STUDENT_POINTS = [
  "Keep 100% of every ringgit — no commission, ever",
  "Escrow-protected payouts straight to your bank",
  "Build a rated, reviewed portfolio while you study",
];

const BUSINESS_POINTS = [
  "Flat 2% on top of the task price — nothing hidden",
  "Campus-vetted students across 5 digital verticals",
  "Escrow releases only when you approve the work",
];

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm font-medium text-muted">
      <span className="mt-0.5 text-success">✓</span>
      {children}
    </li>
  );
}

function TrustPill({ icon, label, className }: { icon: string; label: string; className?: string }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-ink shadow-card ${className ?? ""}`}
    >
      <span aria-hidden>{icon}</span>
      {label}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <div>
          <span className="inline-block rounded-full bg-brand-tint px-3.5 py-1.5 text-xs font-bold text-brand">
            ✦ Malaysia&apos;s campus talent marketplace
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-[54px] sm:leading-[1.08]">
            Real work. Real pay. Right from campus.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">
            Students keep 100% of what they earn. Businesses pay a flat 2% — nothing else.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <div>
              <Button href="/auth?mode=signup&role=student" size="lg">
                I&apos;m a student →
              </Button>
              <p className="mt-2 text-center text-[11px] font-semibold text-faint">
                Keep 100% of what you earn
              </p>
            </div>
            <div>
              <Button href="/auth?mode=signup&role=sme" variant="accent" size="lg">
                I&apos;m a business →
              </Button>
              <p className="mt-2 text-center text-[11px] font-semibold text-faint">
                Just 2% commission, no hidden fees
              </p>
            </div>
          </div>

          <div className="mt-12 grid max-w-md grid-cols-3 gap-6">
            {STATS.map((s) => (
              <div key={s.big}>
                <div className="text-3xl font-extrabold text-ink">{s.big}</div>
                <p className="mt-1 text-xs font-medium leading-snug text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Floating trust pills over a soft gradient blob */}
        <div className="relative hidden h-[380px] lg:block" aria-hidden>
          <div
            className="absolute inset-6 rounded-full opacity-70 blur-2xl"
            style={{ background: "linear-gradient(135deg,#ECEAFC 0%,#E4E9FA 55%,#FDEEDE 100%)" }}
          />
          {FLOATING_PILLS.map((p) => (
            <TrustPill key={p.label} icon={p.icon} label={p.label} className={`absolute ${p.className}`} />
          ))}
          <div className="absolute left-10 top-1/2 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-ink shadow-card">
            <span className="flex -space-x-1.5">
              <span className="h-5 w-5 rounded-full bg-brand ring-2 ring-white" />
              <span className="h-5 w-5 rounded-full bg-accent ring-2 ring-white" />
              <span className="h-5 w-5 rounded-full bg-success ring-2 ring-white" />
            </span>
            Students from UM · USM · UiTM
          </div>
        </div>
      </main>

      {/* Getting started */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-card sm:p-10">
          <h2 className="text-2xl font-extrabold text-ink">Getting started is easy</h2>
          <p className="mt-1 text-sm font-medium text-muted">
            Match, chat, deliver and get paid — without work ever leaving the platform.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.title} className="rounded-2xl border border-border/70 p-5">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${step.tint}`}
                  aria-hidden
                >
                  {step.icon}
                </span>
                <h3 className="mt-3 text-sm font-extrabold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value panels */}
      <section className="px-6 pb-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-card">
            <span className="inline-block rounded-full bg-brand-tint px-3 py-1 text-[11px] font-extrabold tracking-wide text-brand">
              FOR STUDENTS
            </span>
            <h3 className="mt-4 text-xl font-extrabold text-ink">Earn before you graduate</h3>
            <ul className="mt-4 space-y-2.5">
              {STUDENT_POINTS.map((p) => (
                <CheckItem key={p}>{p}</CheckItem>
              ))}
            </ul>
            <Button href="/auth?mode=signup&role=student" className="mt-6">
              Start earning
            </Button>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-card">
            <span className="inline-block rounded-full bg-accent-tint px-3 py-1 text-[11px] font-extrabold tracking-wide text-accent-dark">
              FOR BUSINESSES
            </span>
            <h3 className="mt-4 text-xl font-extrabold text-ink">Digital talent without agency prices</h3>
            <ul className="mt-4 space-y-2.5">
              {BUSINESS_POINTS.map((p) => (
                <CheckItem key={p}>{p}</CheckItem>
              ))}
            </ul>
            <Button href="/auth?mode=signup&role=sme" variant="accent" className="mt-6">
              Post your first task
            </Button>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-6 pb-16">
        <div
          className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-8 py-16 text-center shadow-card"
          style={{ background: "linear-gradient(120deg,#ECEAFC 0%,#F7F9FC 45%,#FDEEDE 100%)" }}
        >
          <TrustPill icon="🛡" label="Escrow held until approved" className="absolute left-10 top-8 hidden lg:flex" />
          <TrustPill icon="🎓" label="Verified campus talent" className="absolute bottom-8 right-10 hidden lg:flex" />
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Put campus talent to work.
          </h2>
          <p className="mt-3 text-sm font-medium text-muted">
            Join the pilot — free for students, one flat fee for businesses.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button href="/auth?mode=signup&role=student">I&apos;m a student</Button>
            <Button href="/auth?mode=signup&role=sme" variant="accent">
              I&apos;m a business
            </Button>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-8 text-xs font-medium text-faint">
        <span className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-brand to-brand-light text-[10px] font-extrabold text-white">
            S
          </span>
          © {new Date().getFullYear()} SkillBridge · Kuala Lumpur
        </span>
        <span className="flex gap-4">
          <Link href="#" className="hover:text-ink">Terms</Link>
          <Link href="#" className="hover:text-ink">Privacy</Link>
          <Link href="#" className="hover:text-ink">Contact</Link>
        </span>
      </footer>
    </div>
  );
}
