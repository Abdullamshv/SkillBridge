"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ME } from "@/src/graphql/queries";
import { LOGOUT } from "@/src/graphql/mutations";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data, loading, client } = useQuery(GET_ME);
  const [logout] = useMutation(LOGOUT);

  const user = data?.me;

  async function handleLogout() {
    await logout();
    await client.resetStore();
    router.push("/");
  }

  const navLink = (href: string, label: string) => {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
          active ? "bg-brand-tint text-brand" : "text-muted hover:text-ink"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-[74px] max-w-6xl items-center gap-7 px-6">
        <Link href={user ? "/home" : "/"} className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-gradient-to-br from-brand to-brand-light text-[17px] font-extrabold text-white">
            S
          </div>
          <span className="text-lg font-extrabold tracking-tight text-ink">SkillBridge</span>
        </Link>

        {user && (
          <nav className="flex flex-1 items-center gap-1.5">
            {navLink("/home", "Home")}
            {user.role === "sme" && navLink("/my-tasks", "My tasks")}
            {navLink("/office", "Office")}
            {navLink("/wallet", "Wallet")}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <span className="text-sm font-semibold text-muted">
                {user.username} · {user.role === "sme" ? "Business" : "Student"}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-bold text-ink hover:bg-brand-tint"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth?mode=signin"
                className="rounded-full px-4 py-2 text-sm font-bold text-muted hover:text-ink"
              >
                Log in
              </Link>
              <Link
                href="/auth?mode=signup"
                className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-light"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
