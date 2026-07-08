"use client";

import { Navbar } from "@/src/components/Navbar";

export default function WalletPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-ink">Wallet is coming soon</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Earnings, escrow holds and the monthly chart land once the ledger is
          wired up in the next build phase.
        </p>
      </div>
    </div>
  );
}
