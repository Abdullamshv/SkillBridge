"use client";

import { Navbar } from "@/src/components/Navbar";

export default function OfficePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-ink">Office is coming soon</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Reaching out already works behind the scenes — your message was saved.
          The full chat thread, 5-step progress tracker and file sharing land in
          the next build phase.
        </p>
      </div>
    </div>
  );
}
