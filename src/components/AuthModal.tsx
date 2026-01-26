"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { signIn, useSession } from "next-auth/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type View = "login" | "register" | "guest";

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { data: session, status } = useSession();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "authenticated" && isOpen) {
      onClose();
      onSuccess?.();
    }
  }, [status, isOpen, onClose, onSuccess]);

  if (!isOpen) return null;

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (view === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Registration failed");
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid credentials");
      }

      await linkGuestIfNeeded();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: window.location.href });
    } catch {
      setError("Google sign-in failed");
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("ammar_guest_id");
      if (!existing) {
        localStorage.setItem("ammar_guest_id", crypto.randomUUID());
      }
    }
    onClose();
  };

  const linkGuestIfNeeded = async () => {
    if (typeof window === "undefined") return;
    const guestId = localStorage.getItem("ammar_guest_id");
    if (!guestId) return;

    try {
      const res = await fetch("/api/link-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId }),
      });

      if (res.ok) {
        localStorage.removeItem("ammar_guest_id");
      }
    } catch (e) {
      console.warn("Failed to link guest:", e);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[hsl(var(--card))] rounded-2xl shadow-xl p-6 w-full max-w-sm relative animate-fade-in-up mx-4">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4 text-[hsl(var(--foreground))]">
          {view === "login" ? "Sign In" : view === "register" ? "Create Account" : "Continue as Guest"}
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {view !== "guest" && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-3">
            {view === "register" && (
              <input
                type="text"
                placeholder="Display Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
            />
            <input
              type="password"
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 rounded bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded bg-[hsl(var(--success))] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "..." : view === "login" ? "Sign In" : "Register"}
            </button>
          </form>
        )}

        <div className="mt-4 space-y-2">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2 rounded border border-[hsl(var(--border))] bg-[hsl(var(--surface-hover))] text-[hsl(var(--foreground))] font-medium flex items-center justify-center gap-2 hover:bg-[hsl(var(--card))] transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <button
            onClick={handleContinueAsGuest}
            className="w-full py-2 rounded border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))] transition-colors"
          >
            Continue as Guest
          </button>
        </div>

        <div className="mt-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {view === "login" ? (
            <>
              No account?{" "}
              <button onClick={() => setView("register")} className="text-[hsl(var(--foreground))] underline">
                Register
              </button>
            </>
          ) : view === "register" ? (
            <>
              Already have an account?{" "}
              <button onClick={() => setView("login")} className="text-[hsl(var(--foreground))] underline">
                Sign In
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
