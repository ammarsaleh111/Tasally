"use client";

import React, { useState, useEffect } from "react";
import SiteHeader from "@/components/SiteHeader";

const VALID_GAMES = [
  { key: "wordle", label: "Wordle" },
  { key: "connections", label: "Connections" },
  { key: "crossword", label: "Crossword" },
  { key: "numbers", label: "Numbers" },
  { key: "trivia", label: "Trivia" },
  { key: "strands", label: "Strands" },
  { key: "spelling", label: "Spelling Bee" },
  { key: "waffle", label: "Waffle" },
  { key: "combinations", label: "Combinations" },
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
  const [period, setPeriod] = useState<Period>("daily");
  const [game, setGame] = useState("wordle");
  const [dailyData, setDailyData] = useState<DailyEntry[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError("");
      try {
        const url =
          period === "daily"
            ? `/api/leaderboard/daily?game=${game}`
            : `/api/leaderboard/monthly?game=${game}`;
        const res = await fetch(url);
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
  }, [period, game]);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background text-foreground px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">🏆 Leaderboard</h1>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <select
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="px-3 py-2 rounded bg-surface-default border border-border-default text-foreground"
            >
              {VALID_GAMES.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label}
                </option>
              ))}
            </select>

            <div className="flex rounded overflow-hidden border border-border-default">
              <button
                onClick={() => setPeriod("daily")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  period === "daily"
                    ? "bg-[hsl(var(--button-primary))] text-[hsl(var(--button-text))]"
                    : "bg-surface-default text-text-muted hover:bg-surface-hover"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setPeriod("monthly")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  period === "monthly"
                    ? "bg-[hsl(var(--button-primary))] text-[hsl(var(--button-text))]"
                    : "bg-surface-default text-text-muted hover:bg-surface-hover"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <p className="text-center text-text-muted animate-pulse">Loading...</p>
          ) : error ? (
            <p className="text-center text-red-400">{error}</p>
          ) : period === "daily" && dailyData.length === 0 ? (
            <p className="text-center text-text-muted">No entries yet for today.</p>
          ) : period === "monthly" && monthlyData.length === 0 ? (
            <p className="text-center text-text-muted">No entries yet this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border-default text-left text-text-muted text-sm">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Player</th>
                    {period === "daily" ? (
                      <>
                        <th className="py-2 px-3 text-right">Score</th>
                        <th className="py-2 px-3 text-right">Attempts</th>
                        <th className="py-2 px-3 text-right">Time</th>
                      </>
                    ) : (
                      <>
                        <th className="py-2 px-3 text-right">Total Score</th>
                        <th className="py-2 px-3 text-right">Games</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {period === "daily"
                    ? dailyData.map((entry) => (
                        <tr
                          key={entry.rank}
                          className="border-b border-border-default hover:bg-surface-hover transition-colors"
                        >
                          <td className="py-2 px-3 font-medium">
                            {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                          </td>
                          <td className="py-2 px-3">{entry.playerName}</td>
                          <td className="py-2 px-3 text-right font-mono">{entry.score}</td>
                          <td className="py-2 px-3 text-right">{entry.attempts ?? "-"}</td>
                          <td className="py-2 px-3 text-right text-text-muted">
                            {entry.durationMs ? `${Math.round(entry.durationMs / 1000)}s` : "-"}
                          </td>
                        </tr>
                      ))
                    : monthlyData.map((entry) => (
                        <tr
                          key={entry.rank}
                          className="border-b border-border-default hover:bg-surface-hover transition-colors"
                        >
                          <td className="py-2 px-3 font-medium">
                            {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                          </td>
                          <td className="py-2 px-3">{entry.playerName}</td>
                          <td className="py-2 px-3 text-right font-mono">{entry.totalScore}</td>
                          <td className="py-2 px-3 text-right">{entry.gamesPlayed}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-center text-xs text-text-muted mt-6">
            Only daily mode games from authenticated users are ranked.
          </p>
        </div>
      </main>
    </>
  );
}
