"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { GET_ME } from "@/src/graphql/queries";
import { Navbar } from "@/src/components/Navbar";
import { StudentHome } from "@/src/components/StudentHome";
import { SmeHome } from "@/src/components/SmeHome";

export default function HomePage() {
  const router = useRouter();
  const { data, loading } = useQuery(GET_ME);

  useEffect(() => {
    if (!loading && !data?.me) {
      router.replace("/auth?mode=signin");
    }
  }, [loading, data, router]);

  if (loading || !data?.me) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <p className="mt-10 text-center text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {data.me.role === "sme" ? <SmeHome /> : <StudentHome />}
    </div>
  );
}
