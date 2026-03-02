import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";

const gameLinks = [
  { href: "/games/wordle", label: "Play Tasally Daily Word Game" },
  { href: "/games/connections", label: "Play Tasally Connections Puzzle" },
  { href: "/games/crossword", label: "Play Tasally Daily Crossword" },
  { href: "/games/numbers", label: "Play Tasally Numbers Puzzle" },
  { href: "/games/trivia", label: "Play Tasally Daily Trivia" },
  { href: "/games/strands", label: "Play Tasally Strands Game" },
  { href: "/games/spelling", label: "Play Tasally Spelling Bee" },
  { href: "/games/waffle", label: "Play Tasally Waffle Puzzle" },
  { href: "/games/combinations", label: "Play Tasally Combinations" },
];

export const metadata: Metadata = {
  title: "Tasally Learning Log — Daily Brain Progress",
  description:
    "Track your daily puzzle learning path on Tasally and jump directly to each game to continue improving.",
  alternates: {
    canonical: "/learning-log",
    languages: {
      en: "/learning-log",
      ar: "/العاب-تسالي",
    },
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Tasally Learning Log — Daily Brain Progress",
    description:
      "Track your puzzle learning path and continue your Tasally daily games.",
    url: absoluteUrl("/learning-log"),
  },
};

export default function LearningLogPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <h1 className="text-4xl font-bold text-foreground">Tasally Learning Log</h1>
      <p className="mt-4 leading-8 text-foreground/90">
        Use this page as a simple checkpoint for your daily growth. Move through the games below to
        keep your brain training routine consistent.
      </p>

      <section className="mt-8 space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Continue With Today’s Games</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {gameLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground hover:bg-background"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
