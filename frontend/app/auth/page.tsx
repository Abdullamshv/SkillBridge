"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LOGIN, REGISTER } from "@/src/graphql/mutations";
import { GET_ME } from "@/src/graphql/queries";
import { Navbar } from "@/src/components/Navbar";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"signup" | "signin">(
    params.get("mode") === "signin" ? "signin" : "signup"
  );
  const [role, setRole] = useState<"student" | "sme">(
    params.get("role") === "sme" ? "sme" : "student"
  );
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [register, { loading: registering }] = useMutation(REGISTER, {
    refetchQueries: [{ query: GET_ME }],
  });
  const [login, { loading: loggingIn }] = useMutation(LOGIN, {
    refetchQueries: [{ query: GET_ME }],
  });

  const loading = registering || loggingIn;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "signup") {
        await register({ variables: { username, email, password, role } });
      } else {
        await login({ variables: { username, password } });
      }
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
          <div className="mb-6 flex rounded-full bg-bg p-1">
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
                mode === "signup" ? "bg-white text-ink shadow-sm" : "text-muted"
              }`}
            >
              Sign up
            </button>
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
                mode === "signin" ? "bg-white text-ink shadow-sm" : "text-muted"
              }`}
            >
              Sign in
            </button>
          </div>

          {mode === "signup" && (
            <div className="mb-6 flex rounded-full border border-border p-1">
              <button
                onClick={() => setRole("student")}
                className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
                  role === "student" ? "bg-brand text-white" : "text-muted"
                }`}
              >
                I&apos;m a Student
              </button>
              <button
                onClick={() => setRole("sme")}
                className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
                  role === "sme" ? "bg-brand text-white" : "text-muted"
                }`}
              >
                I&apos;m a Business
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted">Username</label>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-brand"
                placeholder="yourname"
              />
            </div>
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted">Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-brand"
                  placeholder="you@example.com"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted">Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-brand"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

            {mode === "signup" && (
              <p className="text-xs text-faint">
                We&apos;ll send a verification link to your email after you sign up.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand py-3 text-sm font-bold text-white hover:bg-brand-light disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}
