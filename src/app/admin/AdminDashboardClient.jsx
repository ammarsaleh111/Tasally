'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import DisplayName from '@/components/DisplayName';
import { logout, useAppSession } from '@/utils/sessionManager';

const STATS_POLL_MS = 20000;
const USERS_POLL_MS = 30000;
const PAGE_SIZE = 25;

export default function AdminDashboardClient() {
  const router = useRouter();
  const session = useAppSession();

  // Stats
  const [stats, setStats] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Users list
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [usersQuery, setUsersQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState(null);

  // Logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ─── Fetch stats ───
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' });
      if (res.status === 401 || res.status === 403) {
        router.replace('/admin/login');
        return;
      }
      if (!res.ok) throw new Error('Stats fetch failed');
      const data = await res.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  }, [router]);

  // ─── Fetch users ───
  const loadUsers = useCallback(
    async (query = '', page = 1) => {
      try {
        setIsUsersLoading(true);
        const params = new URLSearchParams();
        if (query) params.set('query', query);
        params.set('page', String(page));
        params.set('limit', String(PAGE_SIZE));

        const res = await fetch(`/api/admin/users?${params}`, { cache: 'no-store' });
        if (res.status === 401 || res.status === 403) {
          router.replace('/admin/login');
          return;
        }
        if (!res.ok) throw new Error('Users fetch failed');
        const data = await res.json();
        setUsers(data.users ?? []);
        setPagination(data.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
      } catch (err) {
        console.error('Failed to load users', err);
      } finally {
        setIsUsersLoading(false);
      }
    },
    [router]
  );

  // ─── Effects ───
  useEffect(() => {
    loadStats();
    const iv = setInterval(loadStats, STATS_POLL_MS);
    return () => clearInterval(iv);
  }, [loadStats]);

  useEffect(() => {
    const h = setTimeout(() => setDebouncedQuery(usersQuery.trim()), 300);
    return () => clearTimeout(h);
  }, [usersQuery]);

  useEffect(() => {
    setCurrentPage(1);
    loadUsers(debouncedQuery, 1);
  }, [loadUsers, debouncedQuery]);

  useEffect(() => {
    const iv = setInterval(() => loadUsers(debouncedQuery, currentPage), USERS_POLL_MS);
    return () => clearInterval(iv);
  }, [loadUsers, debouncedQuery, currentPage]);

  useEffect(() => {
    if (!session) return;
    if (session.role !== 'ADMIN') {
      router.replace('/login?next=/admin');
    }
  }, [session?.role, router]);

  // ─── Page navigation ───
  const goToPage = (page) => {
    setCurrentPage(page);
    loadUsers(debouncedQuery, page);
  };

  // ─── Delete handlers ───
  const handleDeleteUser = (user) => {
    setDeleteConfirm(user);
    setDeleteInput('');
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm || deleteInput.trim() !== 'DELETE') return;

    try {
      setDeletingId(deleteConfirm.id);
      setDeleteError(null);

      const res = await fetch(`/api/admin/users/${encodeURIComponent(deleteConfirm.id)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === 'CANNOT_DELETE_GUEST') {
          setDeleteError('Guest accounts cannot be deleted.');
          setDeletingId(null);
          return;
        }
        throw new Error(body.error || 'Delete failed');
      }

      // Refresh data
      await Promise.all([loadStats(), loadUsers(debouncedQuery, currentPage)]);
      setDeleteConfirm(null);
      setDeletingId(null);
      setDeleteInput('');
    } catch (err) {
      console.error('Delete failed:', err);
      setDeleteError('Failed to delete user. Please try again.');
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
    setDeleteInput('');
    setDeleteError(null);
  };

  // ─── Logout ───
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.replace('/admin/login');
    } catch (err) {
      console.error('Logout failed', err);
      setIsLoggingOut(false);
    }
  };

  // ─── Loading state ───
  if (!stats || !lastUpdated) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-button-primary mx-auto mb-4" />
            <p className="text-text-muted">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const isDeleteArmed = deleteInput.trim() === 'DELETE';

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border-2 border-wordle-absent rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-wordle-absent">⚠️ Delete user permanently?</h2>

            {deleteConfirm.userType === 'guest' ? (
              <div className="bg-surface-hover rounded-lg p-4 mb-4 text-center">
                <p className="text-wordle-absent font-bold text-lg mb-2">Cannot delete guest</p>
                <p className="text-text-muted text-sm">
                  Guest accounts cannot be deleted. Only registered users can be removed.
                </p>
              </div>
            ) : (
              <>
                <p className="text-foreground mb-2">
                  All progress, game data, group memberships, and leaderboard entries will be deleted forever.
                </p>
                <div className="bg-surface-hover rounded-lg p-4 mb-4">
                  <DisplayName
                    name={deleteConfirm.displayName || 'Anonymous'}
                    className="font-bold text-foreground"
                  />
                  <p className="text-xs text-text-muted font-mono mt-1">{deleteConfirm.id}</p>
                </div>

                {deleteError && (
                  <div className="bg-wordle-absent/10 border border-wordle-absent/30 rounded-lg p-3 mb-4 text-sm text-wordle-absent">
                    {deleteError}
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm text-text-muted mb-2">
                    Type <span className="font-bold text-wordle-absent">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-wordle-absent/60"
                    placeholder="DELETE"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                disabled={!!deletingId}
                className="flex-1 px-4 py-2 bg-card border border-card-border hover:bg-surface-hover text-foreground rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteConfirm.userType === 'guest' ? 'Close' : 'Cancel'}
              </button>
              {deleteConfirm.userType !== 'guest' && (
                <button
                  onClick={confirmDelete}
                  disabled={!!deletingId || !isDeleteArmed}
                  className="flex-1 px-4 py-2 bg-wordle-absent hover:bg-red-700 text-button-text rounded-lg transition-colors disabled:opacity-50 font-bold"
                >
                  {deletingId ? 'Deleting...' : 'Delete Forever'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ─── Header ─── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-text-muted text-sm">
              Last updated: {lastUpdated?.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/leaderboard"
              className="px-5 py-2 bg-wordle-correct/10 text-wordle-correct border border-wordle-correct/30 hover:bg-wordle-correct/20 rounded-lg transition-colors font-medium"
            >
              🏆 Global Leaderboard
            </Link>
            <Link
              href="/admin/themes"
              className="px-5 py-2 bg-info/10 text-info border border-info/30 hover:bg-info/20 rounded-lg transition-colors font-medium"
            >
              🎨 Themes
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-5 py-2 bg-wordle-absent hover:bg-red-700 text-button-text rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </button>
            <Link
              href="/games"
              className="px-5 py-2 bg-card hover:bg-surface-hover text-foreground border border-card-border rounded-lg transition-colors"
            >
              ← Back to Games
            </Link>
          </div>
        </div>

        {/* ─── Stats Cards (REAL DATA) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Users" value={stats.totalUsers} icon="👥" />
          <StatCard label="Guests" value={stats.totalGuests} icon="👤" />
          <StatCard label="Registered Users" value={stats.totalRegistered} icon="🔑" />
        </div>

        {/* ─── Users Panel ─── */}
        <div className="bg-card border border-card-border rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold">
                Registered Users
                <span className="text-sm text-text-muted font-normal ml-2">
                  {pagination.total} total
                  {debouncedQuery && ` (filtered)`}
                </span>
              </h2>
              <p className="text-sm text-text-muted">Search by displayed name only</p>
            </div>
            <div className="w-full md:w-80">
              <input
                type="text"
                value={usersQuery}
                onChange={(e) => setUsersQuery(e.target.value)}
                dir="auto"
                placeholder="Search by displayed name..."
                className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-button-primary/60"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left py-3 px-4 font-bold">#</th>
                  <th className="text-left py-3 px-4 font-bold">Displayed Name</th>
                  <th className="text-left py-3 px-4 font-bold">User Type</th>
                  <th className="text-left py-3 px-4 font-bold">Status</th>
                  <th className="text-left py-3 px-4 font-bold">Created At</th>
                  <th className="text-right py-3 px-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => {
                  const rowNum = (pagination.page - 1) * pagination.limit + idx + 1;
                  const isGuest = user.userType === 'guest';
                  const isDeleting = deletingId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-border-default hover:bg-surface-hover transition-colors"
                    >
                      <td className="py-3 px-4 text-text-muted">{rowNum}</td>
                      <td className="py-3 px-4 font-medium">
                        <DisplayName name={user.displayName} />
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            isGuest
                              ? 'bg-wordle-present/20 text-wordle-present'
                              : 'bg-wordle-correct/20 text-wordle-correct'
                          }`}
                        >
                          {isGuest ? '👤 Guest' : '🔑 Registered'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-wordle-correct/10 text-wordle-correct rounded-full text-xs">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-muted">{formatDate(user.createdAt)}</td>
                      <td className="text-right py-3 px-4">
                        {isGuest ? (
                          <span className="text-xs text-text-muted italic">Guest — cannot delete</span>
                        ) : (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={isDeleting}
                            className="px-3 py-1 bg-wordle-absent hover:bg-red-700 text-button-text text-xs rounded transition-colors disabled:opacity-50"
                            title="Delete registered user"
                          >
                            {isDeleting ? '⏳' : '🗑️ Delete'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="text-center py-8 text-text-muted">
                {isUsersLoading
                  ? 'Loading users...'
                  : debouncedQuery
                  ? 'No users match that name'
                  : 'No users found'}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-default">
              <p className="text-sm text-text-muted">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 bg-card border border-card-border hover:bg-surface-hover text-foreground rounded-lg text-sm transition-colors disabled:opacity-40"
                >
                  ← Prev
                </button>
                {generatePageNumbers(pagination.page, pagination.totalPages).map((p) =>
                  p === '...' ? (
                    <span key={`ellipsis-${Math.random()}`} className="px-2 py-1 text-text-muted text-sm">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        p === pagination.page
                          ? 'bg-button-primary text-button-text font-bold'
                          : 'bg-card border border-card-border hover:bg-surface-hover text-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= pagination.totalPages}
                  className="px-3 py-1 bg-card border border-card-border hover:bg-surface-hover text-foreground rounded-lg text-sm transition-colors disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Helper Components ─── */

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold text-foreground">{value}</div>
          <div className="text-sm text-text-muted mt-1">{label}</div>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

/* ─── Utilities ─── */

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString();
}

function generatePageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push('...', total);
  } else if (current >= total - 3) {
    pages.push(1, '...');
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return pages;
}
