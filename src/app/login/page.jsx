"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import AuthModal from "@/components/AuthModal";
import { useAppSession } from "@/utils/sessionManager";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useAppSession();
  const [showModal, setShowModal] = useState(true);

  const nextPath = useMemo(() => {
    const nextParam = searchParams.get("next");
    return nextParam && nextParam.startsWith("/") ? nextParam : "/";
  }, [searchParams]);

  useEffect(() => {
    if (!session) return;

    if (nextPath.startsWith("/admin")) {
      router.replace(`/admin/login?redirect=${encodeURIComponent(nextPath)}`);
      return;
    }

    if (session.role === "USER") {
      router.replace(nextPath);
    }
  }, [session, nextPath, router]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <SiteHeader />
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-3">Sign In</h1>
        <p className="text-[hsl(var(--muted-foreground))] mb-6">
          Continue to your account to access leaderboards and saved progress.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="
            inline-flex items-center justify-center
            px-5 py-2.5 rounded-lg
            text-sm font-semibold
            bg-[hsl(var(--accent))]
            text-[hsl(var(--accent-foreground))]
            hover:bg-[hsl(var(--accent))]/90
            transition-all duration-200
          "
        >
          Open Sign In
        </button>
      </div>
      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          if (nextPath.startsWith("/admin")) return;
          router.replace(nextPath);
        }}
        initialView="login"
      />
    </div>
  );
}
