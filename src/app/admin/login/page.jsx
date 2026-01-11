'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle');
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkExistingSession = async () => {
      try {
        const res = await fetch('/api/admin/login');
        const data = await res.json();
        if (mounted && data.authenticated) {
          router.replace('/admin');
        }
      } catch (err) {
        console.warn('Failed to check admin session', err);
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    checkExistingSession();
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setStatus('loading');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || 'Unable to sign in');
      }

      router.replace('/admin');
    } catch (err) {
      setError(err.message || 'Unable to sign in');
      setStatus('idle');
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-gray-500">Checking access…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Admin Access</h1>
          <p className="text-gray-500 mb-8">Sign in with the dedicated admin credentials to manage live stats.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="admin-username">
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={event => setUsername(event.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="current-password"
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {status === 'loading' ? 'Signing in…' : 'Access Dashboard'}
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-6">
            Tip: update ADMIN_USERNAME / ADMIN_PASSWORD env vars and redeploy to rotate credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
