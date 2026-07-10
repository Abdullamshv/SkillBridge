"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ME } from "@/src/graphql/queries";
import { RESEND_VERIFICATION } from "@/src/graphql/mutations";

/** Slim reminder shown to logged-in users who haven't confirmed their email. */
export function VerifyEmailBanner() {
  const { data } = useQuery(GET_ME);
  const [resend, { loading }] = useMutation(RESEND_VERIFICATION);
  const [sent, setSent] = useState(false);

  const me = data?.me;
  if (!me || me.isVerified) return null;

  return (
    <div className="mx-auto mt-4 flex w-full max-w-6xl items-center justify-between gap-3 rounded-2xl bg-accent-tint px-5 py-3 text-sm font-semibold text-accent-dark">
      <span>Confirm your email to finish setting up your account — check your inbox.</span>
      {sent ? (
        <span className="shrink-0 text-xs font-bold">Sent — check again ✓</span>
      ) : (
        <button
          onClick={async () => {
            await resend();
            setSent(true);
          }}
          disabled={loading}
          className="shrink-0 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-accent-dark transition-colors hover:bg-accent hover:text-white disabled:opacity-60"
        >
          Resend email
        </button>
      )}
    </div>
  );
}
