"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { GET_ME, GET_WALLET_STATS } from "@/src/graphql/queries";
import { Navbar } from "@/src/components/Navbar";
import { Card } from "@/src/components/ui/Card";
import { StatCard } from "@/src/components/ui/StatCard";
import { formatRM } from "@/src/lib/format";

const CHART_MAX_PX = 158;

export default function WalletPage() {
  const router = useRouter();
  const { data: meData, loading: meLoading } = useQuery(GET_ME);
  const me = meData?.me;
  const { data, loading } = useQuery(GET_WALLET_STATS, { skip: !me });

  useEffect(() => {
    if (!meLoading && !me) router.replace("/auth?mode=signin");
  }, [meLoading, me, router]);

  if (meLoading || !me || loading || !data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <p className="mt-10 text-center text-sm text-muted">Loading…</p>
      </div>
    );
  }

  const stats = data.walletStats;
  const isStudent = me.role === "student";
  const max = Math.max(...stats.months.map((m) => parseFloat(m.value)), 1);

  const cards = isStudent
    ? [
        {
          big: formatRM(stats.thisMonthTotal),
          label: "earned this month",
          sub: "you keep 100% — no fees on your side",
        },
        {
          big: formatRM(stats.escrowHeld),
          label: "held in escrow",
          sub: "releases when work is approved",
        },
        {
          big: formatRM(stats.activeTotal),
          label: "from active projects",
          sub: `${stats.activeCount} task${stats.activeCount === 1 ? "" : "s"} in progress`,
        },
      ]
    : [
        {
          big: formatRM(stats.thisMonthTotal),
          label: "spent this month",
          sub: `includes ${formatRM(stats.feesThisMonth)} in platform fees`,
        },
        {
          big: formatRM(stats.escrowHeld),
          label: "funded in escrow",
          sub: "released to students on your approval",
        },
        {
          big: formatRM(stats.activeTotal),
          label: "committed to active projects",
          sub: `${stats.activeCount} task${stats.activeCount === 1 ? "" : "s"} in progress`,
        },
      ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-extrabold text-ink">Wallet</h1>

        <div
          className={`mt-4 rounded-2xl px-5 py-4 text-sm font-bold ${
            isStudent ? "bg-success-tint text-success" : "bg-brand-tint text-brand"
          }`}
        >
          {isStudent
            ? "RM 0 paid in platform fees — students always keep 100% of the task price."
            : `Flat 2% is the only fee you pay — ${formatRM(stats.feesThisMonth)} this month. Nothing hidden.`}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <StatCard key={c.label} big={c.big} label={c.label} sub={c.sub} />
          ))}
        </div>

        <Card className="mt-6 p-6">
          <h2 className="text-base font-extrabold text-ink">
            {isStudent ? "Earnings by month" : "Spend by month"}
          </h2>
          <p className="mt-1 text-xs font-semibold text-muted">
            {isStudent ? "What you took home, month by month" : "Task prices plus the flat 2% fee, month by month"}
          </p>

          <figure
            role="img"
            aria-label={`${isStudent ? "Earnings" : "Spend"} for the last 6 months: ${stats.months
              .map((m) => `${m.label} ${formatRM(m.value)}`)
              .join(", ")}`}
            className="mt-6 flex items-end justify-around gap-3"
            style={{ minHeight: CHART_MAX_PX + 48 }}
          >
            {stats.months.map((m, i) => {
              const current = i === stats.months.length - 1;
              const h = Math.max(Math.round((parseFloat(m.value) / max) * CHART_MAX_PX), 4);
              return (
                <div key={m.label} className="flex flex-col items-center gap-1.5">
                  <span className={`text-xs ${current ? "font-extrabold text-ink" : "font-semibold text-faint"}`}>
                    {formatRM(m.value)}
                  </span>
                  <div
                    className="w-[46px] transition-[height] duration-300"
                    style={{
                      height: h,
                      borderRadius: "12px 12px 5px 5px",
                      background: current
                        ? "linear-gradient(180deg,#F0914A,#E07F35)"
                        : "#DDD9F5",
                    }}
                  />
                  <span className={`text-xs font-bold ${current ? "text-ink" : "text-faint"}`}>{m.label}</span>
                </div>
              );
            })}
          </figure>
        </Card>
      </div>
    </div>
  );
}
