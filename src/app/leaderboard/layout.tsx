import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tasally Leaderboard — Daily & Monthly Puzzle Rankings",
  description:
    "Track daily and monthly rankings across all Tasally puzzle games and compare your progress with players worldwide.",
  alternates: {
    canonical: "/leaderboard",
    languages: {
      en: "/leaderboard",
      ar: "/العاب-تسالي",
    },
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
