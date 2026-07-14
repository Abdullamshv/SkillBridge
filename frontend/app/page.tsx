import Link from "next/link";
import { Navbar } from "@/src/components/Navbar";
import { Button } from "@/src/components/ui/Button";

const STATS = [
  { big: "100%", label: "payout goes to students" },
  { big: "2%", label: "flat fee for businesses — nothing hidden" },
  { big: "5", label: "digital skill verticals, campus-vetted" },
];

/*
 * Anchored on the orbit rings (outer r=250, inner r=155, center of the
 * 440px hero box). x/y are px offsets from the center to the marker dot;
 * the pill extends toward `side` so labels never leave the column.
 */
const ORBIT_PILLS = [
  { icon: "/icons/shield.webp", label: "Safe escrow payments", x: 143, y: -205, side: "left" },
  { icon: "/icons/medal.webp", label: "Campus-vetted talent", x: -140, y: -66, side: "right" },
  { icon: "/icons/moneybag.webp", label: "100% payout for students", x: 235, y: 86, side: "left" },
  { icon: "/icons/calc.webp", label: "Flat 2% fee, nothing hidden", x: -143, y: 205, side: "right" },
] as const;

/* Decorative nodes sitting on the same rings */
const ORBIT_DOTS = [
  { x: -143, y: -205, className: "h-2.5 w-2.5 bg-accent/80" },
  { x: 143, y: 205, className: "h-2.5 w-2.5 bg-brand-light/80" },
  { x: 134, y: -78, className: "h-2 w-2 bg-brand/60" },
  { x: -134, y: 78, className: "h-2 w-2 bg-accent-dark/70" },
] as const;

const HOW_IT_WORKS = [
  {
    icon: "/icons/profile.webp",
    title: "Create your profile",
    text: "Students verify with a campus email; businesses with an SSM number. Trust on both sides, day one.",
  },
  {
    icon: "/icons/target.webp",
    title: "Match on a task",
    text: "Students browse paid tasks; businesses browse vetted talent. Either side can reach out first.",
  },
  {
    icon: "/icons/chat.webp",
    title: "Chat & deliver in Office",
    text: "Messages, drafts and big files stay in one thread, with a clear status from reach-out to done.",
  },
  {
    icon: "/icons/wallet.webp",
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

function TrustPill({
  icon,
  label,
  className,
  delay,
}: {
  icon: string;
  label: string;
  className?: string;
  delay?: string;
}) {
  return (
    <div
      className={`flex w-max items-center gap-2.5 whitespace-nowrap rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-ink shadow-card backdrop-blur transition-shadow hover:shadow-card-hover ${className ?? ""}`}
      style={delay ? { animationDelay: delay } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" aria-hidden className="h-8 w-8 object-contain" />
      {label}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 overflow-x-clip px-6 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
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

        {/* Orbit hero: bright gradient orb, spinning rings, floating 3D trust pills */}
        <div className="relative hidden h-[440px] lg:block" aria-hidden>
          {/* ambient glow spilling beyond the orb */}
          <div
            className="absolute inset-4 rounded-full opacity-80 blur-3xl"
            style={{ background: "linear-gradient(135deg,#D9CFFB 0%,#E9E3FD 40%,#FBD4B0 100%)" }}
          />
          {/* the orb — saturated brand gradient with a bright core */}
          <div
            className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              border: "1.5px solid rgba(124,98,242,0.30)",
              background:
                "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 46%), " +
                "radial-gradient(circle at 70% 82%, rgba(240,145,74,0.45) 0%, rgba(240,145,74,0) 56%), " +
                "radial-gradient(circle at 82% 18%, rgba(123,98,242,0.35) 0%, rgba(123,98,242,0) 52%), " +
                "linear-gradient(135deg, rgba(123,98,242,0.32) 0%, rgba(183,168,250,0.22) 45%, rgba(249,183,140,0.38) 100%)",
              boxShadow: "inset 0 -50px 80px rgba(240,145,74,0.18), 0 30px 60px rgba(78,63,227,0.10)",
            }}
          />
          {/* orbit rings the markers sit on */}
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2">
            <div className="anim-spin-slow h-full w-full rounded-full border-2 border-dashed border-brand-light/35" />
          </div>
          <div className="absolute left-1/2 top-1/2 h-[310px] w-[310px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/30" />
          {/* decorative nodes on the rings */}
          {ORBIT_DOTS.map((d) => (
            <span
              key={`${d.x},${d.y}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${d.className}`}
              style={{ left: `calc(50% + ${d.x}px)`, top: `calc(50% + ${d.y}px)` }}
            />
          ))}
          {/* trust pills anchored to marker dots on the rings */}
          {ORBIT_PILLS.map((p) => (
            <div
              key={p.label}
              className="absolute"
              style={{ left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)` }}
            >
              <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-light to-brand shadow-card ring-[3px] ring-white" />
              <TrustPill
                icon={p.icon}
                label={p.label}
                className={`absolute left-0 top-0 -translate-y-1/2 ${
                  p.side === "left" ? "-translate-x-[calc(100%_+_14px)]" : "translate-x-3.5"
                }`}
              />
            </div>
          ))}
          {/* student avatars chip, anchored to the inner ring */}
          <div className="absolute" style={{ left: "calc(50% - 150px)", top: "calc(50% + 40px)" }}>
            <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-accent to-accent-dark shadow-card ring-[3px] ring-white" />
            <div className="absolute left-0 top-0 flex w-max -translate-y-1/2 translate-x-3.5 items-center gap-2 whitespace-nowrap rounded-full bg-white/90 px-4 py-2.5 text-xs font-bold text-ink shadow-card backdrop-blur">
              <span className="flex -space-x-1.5">
                <span className="h-5 w-5 rounded-full bg-brand ring-2 ring-white" />
                <span className="h-5 w-5 rounded-full bg-accent ring-2 ring-white" />
                <span className="h-5 w-5 rounded-full bg-success ring-2 ring-white" />
              </span>
              Students from UM · USM · UiTM
            </div>
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={step.icon} alt="" aria-hidden className="mx-auto h-20 w-20 object-contain" />
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
            <div className="flex items-start justify-between">
              <span className="inline-block rounded-full bg-brand-tint px-3 py-1 text-[11px] font-extrabold tracking-wide text-brand">
                FOR STUDENTS
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/card.webp" alt="" aria-hidden className="-mt-2 h-14 w-14 object-contain" />
            </div>
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
            <div className="flex items-start justify-between">
              <span className="inline-block rounded-full bg-accent-tint px-3 py-1 text-[11px] font-extrabold tracking-wide text-accent-dark">
                FOR BUSINESSES
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/check.webp" alt="" aria-hidden className="-mt-2 h-14 w-14 object-contain" />
            </div>
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
          <TrustPill icon="/icons/shield.webp" label="Escrow held until approved" className="anim-float absolute left-10 top-8 hidden lg:flex" />
          <TrustPill icon="/icons/medal.webp" label="Verified campus talent" delay="1.6s" className="anim-float absolute bottom-8 right-10 hidden lg:flex" />
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="SkillBridge logo" className="h-5 w-5" />
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
