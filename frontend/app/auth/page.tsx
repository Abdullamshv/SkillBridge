"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LOGIN, LOGIN_WITH_GOOGLE, REGISTER } from "@/src/graphql/mutations";
import { GET_ME } from "@/src/graphql/queries";
import { Navbar } from "@/src/components/Navbar";
import { Button } from "@/src/components/ui/Button";
import { friendlyError } from "@/src/lib/errors";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type GoogleGsi = {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void;
      renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
};

/** Official Google Identity Services button — only rendered when
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID is configured. */
function GoogleSignIn({
  role,
  onError,
}: {
  role: string | undefined;
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const divRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef(role);
  roleRef.current = role;
  const [loginWithGoogle] = useMutation(LOGIN_WITH_GOOGLE, {
    refetchQueries: [{ query: GET_ME }],
  });

  useEffect(() => {
    const init = () => {
      const g = (window as unknown as { google?: GoogleGsi }).google;
      if (!g?.accounts?.id || !divRef.current) return;
      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp) => {
          try {
            await loginWithGoogle({
              variables: { idToken: resp.credential, role: roleRef.current },
            });
            router.push("/home");
          } catch (err) {
            onError(friendlyError(err));
          }
        },
      });
      g.accounts.id.renderButton(divRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 340,
      });
    };

    if ((window as unknown as { google?: GoogleGsi }).google?.accounts?.id) {
      init();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
  }, [loginWithGoogle, router, onError]);

  return <div ref={divRef} className="flex justify-center" />;
}

const COPY = {
  student: {
    chip: "STUDENT ACCOUNT",
    switchLabel: "I'm a business instead",
    title: "Join as a student",
    sub: "Start earning from real tasks — and keep 100% of every payout.",
    emailLabel: "Campus email",
    emailPlaceholder: "you@siswa.um.edu.my",
    emailHint: "We verify campus emails — that's what keeps the talent pool vetted.",
    submit: "Create student account",
  },
  sme: {
    chip: "BUSINESS ACCOUNT",
    switchLabel: "I'm a student instead",
    title: "Join as a business",
    sub: "Post tasks, hire campus-vetted talent, pay one flat 2% fee.",
    emailLabel: "Work email",
    emailPlaceholder: "you@company.my",
    emailHint: "Add your SSM number after signup to get the verified badge.",
    submit: "Create business account",
  },
} as const;

function SocialButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled
      title="Coming soon"
      className="flex w-full items-center justify-center gap-2.5 rounded-full border border-border bg-white py-2.5 text-sm font-bold text-ink opacity-60"
    >
      {icon}
      {label}
    </button>
  );
}

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
  const copy = COPY[role];

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
      setError(friendlyError(err));
    }
  }

  const inputClass =
    "w-full rounded-xl border border-transparent bg-bg px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:bg-white";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-card">
          {mode === "signup" ? (
            <div className="mb-5 flex items-center justify-between">
              <span
                className={`rounded-full px-3 py-1 text-[10.5px] font-extrabold tracking-wide ${
                  role === "student" ? "bg-brand-tint text-brand" : "bg-accent-tint text-accent-dark"
                }`}
              >
                {copy.chip}
              </span>
              <button
                onClick={() => setRole(role === "student" ? "sme" : "student")}
                className="text-xs font-bold text-brand hover:text-brand-light"
              >
                {copy.switchLabel}
              </button>
            </div>
          ) : null}

          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            {mode === "signup" ? copy.title : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {mode === "signup" ? copy.sub : "Sign in to pick up where you left off."}
          </p>

          <div className="mt-6 space-y-3">
            {GOOGLE_CLIENT_ID ? (
              <GoogleSignIn role={mode === "signup" ? role : undefined} onError={setError} />
            ) : (
              <SocialButton
                label="Continue with Google"
                icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.2-2.1 3.7-5.1 3.7-8.9z" />
                  <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.1 0-5.8-2.1-6.7-5H1.4v3C3.4 21.4 7.4 24 12 24z" />
                  <path fill="#FBBC05" d="M5.3 14.4c-.3-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4v-3H1.4C.5 8.3 0 10.1 0 12s.5 3.7 1.4 5.4l3.9-3z" />
                  <path fill="#EA4335" d="M12 4.7c1.8 0 3 .7 3.7 1.4l3.3-3.2C16.9 1 14.2 0 12 0 7.4 0 3.4 2.6 1.4 6.6l3.9 3c.9-2.8 3.6-4.9 6.7-4.9z" />
                </svg>
                }
              />
            )}
          </div>

          <div className="my-5 flex items-center gap-3 text-[10px] font-extrabold tracking-widest text-faint">
            <span className="h-px flex-1 bg-border" />
            OR
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink">Username</label>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                placeholder="yourname"
              />
            </div>
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">{copy.emailLabel}</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder={copy.emailPlaceholder}
                />
                <p className="mt-1.5 flex items-start gap-1 text-[11px] font-medium text-success">
                  <span aria-hidden>✓</span> {copy.emailHint}
                </p>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink">Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="8+ characters"
              />
            </div>

            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full py-3">
              {loading ? "Please wait…" : mode === "signup" ? copy.submit : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs font-semibold text-muted">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="font-bold text-brand hover:text-brand-light">
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to SkillBridge?{" "}
                <button onClick={() => setMode("signup")} className="font-bold text-brand hover:text-brand-light">
                  Create an account
                </button>
              </>
            )}
          </p>

          {mode === "signup" && (
            <p className="mt-3 text-center text-[10.5px] leading-relaxed text-faint">
              By continuing you agree to SkillBridge&apos;s Terms and acknowledge the escrow payment policy.
            </p>
          )}
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
