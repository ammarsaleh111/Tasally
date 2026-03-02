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
  title: "Tasally Blog — Puzzle Strategy & Daily Game Tips",
  description:
    "Read Tasally puzzle strategy updates and jump directly to play every daily game category.",
  alternates: {
    canonical: "/blog",
    languages: {
      en: "/blog",
      ar: "/العاب-تسالي",
    },
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Tasally Blog — Puzzle Strategy & Daily Game Tips",
    description:
      "Read strategy notes and continue playing Tasally daily puzzles.",
    url: absoluteUrl("/blog"),
  },
};

export default function BlogPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <h1 className="text-4xl font-bold text-foreground">Tasally Blog</h1>
      <p className="mt-4 leading-8 text-foreground/90">
        Tasally posts puzzle strategy insights and player improvement notes here. Use the links below
        to immediately apply tips in your daily games.
      </p>

      <section className="mt-8 space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Play Tasally Games</h2>
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
