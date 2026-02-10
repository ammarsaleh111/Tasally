"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import AuthModal from "@/components/AuthModal";
import DisplayName from "@/components/DisplayName";
import { useAppSession } from "@/utils/sessionManager";
import { 
  useSeasonIdentity, 
  SeasonPageHeader, 
  SeasonCard,
  SeasonTexturedCard,
  SeasonDivider,
  SeasonIcon 
} from "@/components/SeasonIdentity";

const VALID_GAMES = [
  { key: "wordle", label: "Wordle", icon: "📝" },
  { key: "connections", label: "Connections", icon: "🔗" },
  { key: "crossword", label: "Crossword", icon: "🔤" },
  { key: "numbers", label: "Numbers", icon: "🔢" },
  { key: "trivia", label: "Trivia", icon: "🧠" },
  { key: "strands", label: "Strands", icon: "🧵" },
  { key: "spelling", label: "Spelling Bee", icon: "🐝" },
  { key: "waffle", label: "Waffle", icon: "🧇" },
  { key: "combinations", label: "Combinations", icon: "🧩" },
];

type Period = "daily" | "monthly";

interface DailyEntry {
  rank: number;
  playerName: string;
  score: number;
  success: boolean;
  attempts: number | null;
  durationMs: number | null;
}

interface MonthlyEntry {
  rank: number;
  playerName: string;
  totalScore: number;
  gamesPlayed: number;
}

export default function LeaderboardPage() {
  const session = useAppSession();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("daily");
  const [game, setGame] = useState("wordle");
  const [dailyData, setDailyData] = useState<DailyEntry[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [authNotice, setAuthNotice] = useState("");
  const [hadAuthenticated, setHadAuthenticated] = useState(false);

  const selectedGame = VALID_GAMES.find(g => g.key === game);
  const isAuthenticated = session?.role === "USER";
  const isAdmin = session?.role === "ADMIN";
  const isAllowed = isAuthenticated || isAdmin;
  const isLoadingSession = !session;

  useEffect(() => {
    if (isLoadingSession) {
      setLoading(true);
      return;
    }

    if (isAllowed) {
      setHadAuthenticated(true);
      setAuthNotice("");
      return;
    }

    if (!isAllowed) {
      setDailyData([]);
      setMonthlyData([]);
      setLoading(false);
      setError("");

      if (hadAuthenticated) {
        setAuthNotice("Your session expired. Please log in again to continue.");
        setAuthView("login");
        setShowAuthModal(true);
      }
    }
  }, [isAllowed, isLoadingSession, hadAuthenticated]);

  useEffect(() => {
    if (isLoadingSession) {
      setLoading(true);
      return;
    }

    if (!isAllowed) {
      setDailyData([]);
      setMonthlyData([]);
      setLoading(false);
      setError("");
      if (session?.role === "GUEST") {
        router.replace("/login?next=/leaderboard");
        setShowAuthModal(true);
        setAuthView("login");
      }
      return;
    }

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError("");
      try {
        const url =
          period === "daily"
            ? `/api/leaderboard/daily?game=${game}`
            : `/api/leaderboard/monthly?game=${game}`;
        const res = await fetch(url);
        if (res.status === 401) {
          setAuthNotice("Your session expired. Please log in again to continue.");
          setAuthView("login");
          setShowAuthModal(true);
          setDailyData([]);
          setMonthlyData([]);
          return;
        }
        if (!res.ok) throw new Error("Failed to load leaderboard");
        const data = await res.json();
        if (period === "daily") {
          setDailyData(data.leaderboard);
          setMonthlyData([]);
        } else {
          setMonthlyData(data.leaderboard);
          setDailyData([]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // 10-second auto-polling for leaderboard refresh
    const interval = setInterval(() => {
      // Refetch without setting loading to avoid flicker
      (async () => {
        try {
          const url =
            period === "daily"
              ? `/api/leaderboard/daily?game=${game}`
              : `/api/leaderboard/monthly?game=${game}`;
          const res = await fetch(url);
          if (!res.ok) return;
          const data = await res.json();
          if (period === "daily") {
            setDailyData(data.leaderboard);
          } else {
            setMonthlyData(data.leaderboard);
          }
        } catch {
          // ignore polling errors
        }
      })();
    }, 10_000);

    return () => clearInterval(interval);
  }, [isAllowed, isLoadingSession, period, game, session?.role, router]);


  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { emoji: "🥇", color: "text-yellow-500" };
    if (rank === 2) return { emoji: "🥈", color: "text-gray-400" };
    if (rank === 3) return { emoji: "🥉", color: "text-amber-600" };
    return { emoji: rank.toString(), color: "text-[hsl(var(--muted-foreground))]" };
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <SiteHeader />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Seasonal Header */}
        <div className="text-center mb-8">
          <SeasonPageHeader 
            title="Leaderboard"
            subtitle="See how you rank against other players"
            showBadge={true}
          />
        </div>

        {/* Seasonal Divider */}
        <SeasonDivider variant="icons" className="mb-6" />

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          {/* Game Select */}
          <div className="relative">
            <select
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="
                appearance-none cursor-pointer
                px-4 py-2.5 pr-10 rounded-xl
                bg-[hsl(var(--card))] 
                border border-[hsl(var(--border))]
                text-[hsl(var(--foreground))]
                font-medium text-sm
                focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/50
                transition-all duration-200
              "
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
              }}
            >
              {VALID_GAMES.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.icon} {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* Period Tabs */}
          <div className="flex rounded-xl overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <button
              onClick={() => setPeriod("daily")}
              className={`
                px-5 py-2.5 text-sm font-medium transition-all duration-200
                ${period === "daily"
                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-hover))]"
                }
              `}
            >
              📅 Daily
            </button>
            <button
              onClick={() => setPeriod("monthly")}
              className={`
                px-5 py-2.5 text-sm font-medium transition-all duration-200
                ${period === "monthly"
                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-hover))]"
                }
              `}
            >
              📆 Monthly
            </button>
          </div>
        </div>

        {/* Current Game Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] text-sm font-medium">
            <span className="text-lg">{selectedGame?.icon}</span>
            <span>{selectedGame?.label}</span>
            <span className="text-[hsl(var(--muted-foreground))]">•</span>
            <span className="text-[hsl(var(--muted-foreground))]">{period === "daily" ? "Today" : "This Month"}</span>
          </span>
        </div>

        {/* Content - Seasonal Card */}
        {isLoadingSession ? (
          <SeasonTexturedCard className="overflow-hidden">
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-[hsl(var(--accent))] border-t-transparent rounded-full animate-spin" />
                <p className="text-[hsl(var(--muted-foreground))] text-sm animate-pulse">Checking session...</p>
              </div>
            </div>
          </SeasonTexturedCard>
        ) : !isAllowed ? (
          <SeasonTexturedCard className="overflow-hidden">
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--accent))]/10 flex items-center justify-center text-2xl">
                🔒
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-[hsl(var(--foreground))]">Login Required</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-md">
                  To view the leaderboard and compete with other players, please log in or create an account.
                </p>
                {authNotice && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{authNotice}</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  onClick={() => {
                    setAuthView("login");
                    setShowAuthModal(true);
                  }}
                  className="px-6 py-2.5 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-semibold hover:opacity-90 transition-opacity"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setAuthView("register");
                    setShowAuthModal(true);
                  }}
                  className="px-6 py-2.5 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-semibold hover:bg-[hsl(var(--surface-hover))] transition-colors"
                >
                  Create Account
                </button>
                <button
                  onClick={handleBack}
                  className="px-6 py-2.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-hover))] transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          </SeasonTexturedCard>
        ) : (
          <SeasonTexturedCard className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-[hsl(var(--accent))] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[hsl(var(--muted-foreground))] text-sm animate-pulse">Loading rankings...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-4xl">????</span>
                <p className="text-[hsl(var(--destructive))] font-medium">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-[hsl(var(--accent))] hover:underline"
                >
                  Try Again
                </button>
              </div>
            ) : (period === "daily" && dailyData.length === 0) || (period === "monthly" && monthlyData.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-5xl">????</span>
                <p className="text-[hsl(var(--muted-foreground))] font-medium flex items-center gap-2">
                  <SeasonIcon index={0} />
                  No entries yet for {period === "daily" ? "today" : "this month"}.
                  <SeasonIcon index={1} />
                </p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Be the first to submit a score!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-hover))]/50">
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-16">
                        Rank
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                        Player
                      </th>
                      {period === "daily" ? (
                        <>
                          <th className="py-3 px-4 text-right text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                            Score
                          </th>
                          <th className="py-3 px-4 text-right text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden sm:table-cell">
                            Attempts
                          </th>
                          <th className="py-3 px-4 text-right text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden md:table-cell">
                            Time
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="py-3 px-4 text-right text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                            Total Score
                          </th>
                          <th className="py-3 px-4 text-right text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                            Games
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border))]">
                    {period === "daily"
                      ? dailyData.map((entry) => (
                          <LeaderboardRow key={entry.rank} entry={entry} period={period} getRankDisplay={getRankDisplay} />
                        ))
                      : monthlyData.map((entry) => (
                          <MonthlyLeaderboardRow key={entry.rank} entry={entry} getRankDisplay={getRankDisplay} />
                        ))}
                  </tbody>
                </table>
              </div>
            )}
          </SeasonTexturedCard>
        )}


        {/* Seasonal Divider */}
        <SeasonDivider variant="gradient" className="mt-6 mb-4" />

        {/* Footer Note */}
        <p className="text-center text-xs text-[hsl(var(--muted-foreground))] flex items-center justify-center gap-2">
          <SeasonIcon index={2} />
          Only daily mode games are ranked. Sign in to display your name on the leaderboard!
          <SeasonIcon index={3} />
        </p>


      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          setAuthNotice("");
        }}
        initialView={authView}
      />
      </main>
    </div>
  );
}

// Seasonal Leaderboard Row Component
function LeaderboardRow({ entry, period, getRankDisplay }: { entry: DailyEntry; period: Period; getRankDisplay: (rank: number) => { emoji: string; color: string } }) {
  const { pack } = useSeasonIdentity();
  const rankDisplay = getRankDisplay(entry.rank);
  
  return (
    <tr
      className={`
        transition-colors duration-200
        hover:bg-[hsl(var(--surface-hover))]
        ${entry.rank <= 3 ? 'bg-[hsl(var(--accent))]/5' : ''}
      `}
    >
      <td className="py-4 px-4">
        <span className={`font-bold text-lg ${rankDisplay.color}`}>
          {rankDisplay.emoji}
        </span>
        {/* Seasonal decoration for top 3 */}
        {pack && entry.rank <= 3 && (
          <span className="ml-1 text-sm opacity-50">{pack.microIcons[entry.rank - 1]}</span>
        )}
      </td>
      <td className="py-4 px-4">
        <DisplayName
          name={entry.playerName}
          className="font-medium text-[hsl(var(--foreground))]"
        />
      </td>
      <td className="py-4 px-4 text-right">
        <span className="font-mono font-bold text-[hsl(var(--accent))]">
          {entry.score.toLocaleString()}
        </span>
      </td>
      <td className="py-4 px-4 text-right text-[hsl(var(--muted-foreground))] hidden sm:table-cell">
        {entry.attempts ?? "-"}
      </td>
      <td className="py-4 px-4 text-right text-[hsl(var(--muted-foreground))] text-sm hidden md:table-cell">
        {entry.durationMs ? `${Math.round(entry.durationMs / 1000)}s` : "-"}
      </td>
    </tr>
  );
}

function MonthlyLeaderboardRow({ entry, getRankDisplay }: { entry: MonthlyEntry; getRankDisplay: (rank: number) => { emoji: string; color: string } }) {
  const { pack } = useSeasonIdentity();
  const rankDisplay = getRankDisplay(entry.rank);
  
  return (
    <tr
      className={`
        transition-colors duration-200
        hover:bg-[hsl(var(--surface-hover))]
        ${entry.rank <= 3 ? 'bg-[hsl(var(--accent))]/5' : ''}
      `}
    >
      <td className="py-4 px-4">
        <span className={`font-bold text-lg ${rankDisplay.color}`}>
          {rankDisplay.emoji}
        </span>
        {pack && entry.rank <= 3 && (
          <span className="ml-1 text-sm opacity-50">{pack.microIcons[entry.rank - 1]}</span>
        )}
      </td>
      <td className="py-4 px-4">
        <DisplayName
          name={entry.playerName}
          className="font-medium text-[hsl(var(--foreground))]"
        />
      </td>
      <td className="py-4 px-4 text-right">
        <span className="font-mono font-bold text-[hsl(var(--accent))]">
          {entry.totalScore.toLocaleString()}
        </span>
      </td>
      <td className="py-4 px-4 text-right text-[hsl(var(--muted-foreground))]">
        {entry.gamesPlayed}
      </td>
    </tr>
  );
}
