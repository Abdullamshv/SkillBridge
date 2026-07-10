"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { VERIFY_EMAIL } from "@/src/graphql/mutations";
import { GET_ME } from "@/src/graphql/queries";
import { Navbar } from "@/src/components/Navbar";
import { Button } from "@/src/components/ui/Button";
import { friendlyError } from "@/src/lib/errors";

function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [error, setError] = useState<string | null>(null);
  const [verifyEmail] = useMutation(VERIFY_EMAIL, { refetchQueries: [{ query: GET_ME }] });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // React strict-mode double-invoke guard
    ran.current = true;
    if (!token) {
      setState("error");
      setError("The verification link is missing its token.");
      return;
    }
    verifyEmail({ variables: { token } })
      .then(() => setState("done"))
      .catch((err) => {
        setState("error");
        setError(friendlyError(err));
      });
  }, [token, verifyEmail]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-card">
          {state === "working" && (
            <>
              <div className="text-3xl" aria-hidden>⏳</div>
              <h1 className="mt-3 text-xl font-extrabold text-ink">Confirming your email…</h1>
            </>
          )}
          {state === "done" && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-tint text-xl text-success" aria-hidden>
                ✓
              </div>
              <h1 className="mt-4 text-xl font-extrabold text-ink">Email confirmed</h1>
              <p className="mt-2 text-sm text-muted">
                Your account is verified — you&apos;re all set.
              </p>
              <Button href="/home" className="mt-6">
                Go to the marketplace
              </Button>
            </>
          )}
          {state === "error" && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fdecec] text-xl text-[#c0392b]" aria-hidden>
                ✕
              </div>
              <h1 className="mt-4 text-xl font-extrabold text-ink">Verification failed</h1>
              <p className="mt-2 text-sm text-muted">{error}</p>
              <Button href="/home" variant="secondary" className="mt-6">
                Back to SkillBridge
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}
