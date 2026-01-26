"use client";

import React, { useState } from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import AuthModal from "./AuthModal";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState(false);

  if (status === "loading") {
    return (
      <span className="text-sm text-text-muted animate-pulse">...</span>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt=""
            width={28}
            height={28}
            className="rounded-full border border-border-default"
          />
        ) : (
          <span className="w-7 h-7 rounded-full bg-surface-hover flex items-center justify-center text-sm">
            {(session.user.name ?? session.user.email)?.[0]?.toUpperCase() ?? "U"}
          </span>
        )}
        <span className="text-sm font-medium text-foreground hidden sm:inline">
          {session.user.name ?? session.user.email?.split("@")[0]}
        </span>
        <button
          onClick={() => signOut()}
          className="text-xs text-text-muted hover:text-foreground transition-colors"
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
        className="text-sm font-semibold text-text-muted hover:text-foreground transition-colors"
      >
        Sign In
      </button>
      <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
