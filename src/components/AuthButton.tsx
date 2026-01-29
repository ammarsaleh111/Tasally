"use client";

import React, { useState } from "react";
import Link from "next/link";
import AuthModal from "./AuthModal";
import DisplayName from "./DisplayName";
import { getDisplayInitial } from "@/utils/nameUtils";
import { logout, useAppSession } from "@/utils/sessionManager";

export default function AuthButton() {
  const session = useAppSession();
  const [showModal, setShowModal] = useState(false);

  if (!session) {
    return (
      <span className="text-sm text-[hsl(var(--muted-foreground))] animate-pulse">...</span>
    );
  }

  const handleLogout = async () => {
    await logout();
    if (typeof window !== "undefined") {
      const target = session.role === "ADMIN" ? "/admin/login" : "/";
      window.location.href = target;
    }
  };

  if (session.role === "ADMIN") {
    const displayName = session.displayName ?? "Admin";
    const initial = getDisplayInitial(displayName) || "A";

    return (
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-[hsl(var(--surface-hover))] flex items-center justify-center text-sm font-medium text-[hsl(var(--foreground))]">
          {initial}
        </span>
        <DisplayName
          name={displayName}
          className="text-sm font-medium text-[hsl(var(--foreground))] hidden sm:inline"
        />
        <Link
          href="/admin"
          className="
            px-2.5 py-1.5 rounded-md
            text-xs font-medium
            text-[hsl(var(--muted-foreground))]
            hover:text-[hsl(var(--foreground))]
            hover:bg-[hsl(var(--surface-hover))]
            transition-all duration-200
          "
        >
          Dashboard
        </Link>
        <button
          onClick={handleLogout}
          className="
            px-3 py-1.5 rounded-md
            text-xs font-medium
            text-[hsl(var(--muted-foreground))]
            hover:text-[hsl(var(--foreground))]
            hover:bg-[hsl(var(--surface-hover))]
            transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]
          "
        >
          Sign Out
        </button>
      </div>
    );
  }

  if (session.role === "USER") {
    const displayName = session.displayName ?? "User";
    const initial = getDisplayInitial(displayName) || "U";

    return (
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-[hsl(var(--surface-hover))] flex items-center justify-center text-sm font-medium text-[hsl(var(--foreground))]">
          {initial}
        </span>
        <DisplayName
          name={displayName}
          className="text-sm font-medium text-[hsl(var(--foreground))] hidden sm:inline"
        />
        <button
          onClick={handleLogout}
          className="
            px-3 py-1.5 rounded-md
            text-xs font-medium
            text-[hsl(var(--muted-foreground))]
            hover:text-[hsl(var(--foreground))]
            hover:bg-[hsl(var(--surface-hover))]
            transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]
          "
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="
          px-4 py-2 rounded-lg
          text-sm font-semibold
          bg-[hsl(var(--accent))] 
          text-[hsl(var(--accent-foreground))]
          hover:bg-[hsl(var(--accent))]/90
          transition-all duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]
          shadow-sm hover:shadow-md
        "
      >
        Sign In
      </button>
      <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
