import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl, buildBreadcrumbJsonLd } from "@/lib/seo";

const wordGames = [
  {
    title: "Wordle",
    href: "/games/wordle",
    summary: "Daily word guessing with fast feedback loops.",
  },
  {
    title: "Connections",
    href: "/games/connections",
    summary: "Category matching for vocabulary and lateral thinking.",
  },
  {
    title: "Mini Crossword",
    href: "/games/crossword",
    summary: "Short crossword format designed for quick daily practice.",
  },
  {
    title: "Strands",
    href: "/games/strands",
    summary: "Word-search style gameplay with themed clues.",
  },
  {
    title: "Spelling Bee",
    href: "/games/spelling",
    summary: "Build many words from a constrained letter set.",
  },
  {
    title: "Waffle",
    href: "/games/waffle",
    summary: "Swap letters into place to solve intersecting words.",
  },
  {
    title: "Combinations",
    href: "/games/combinations",
    summary: "Build larger words from fragments for higher scores.",
  },
];

export const metadata: Metadata = {
  title: "Daily Word Games",
  description:
    "Discover daily word games on Ammar Times, from Wordle-style puzzles to crosswords and spelling challenges.",
  alternates: {
    canonical: "/word-games",
  },
  openGraph: {
    title: "Daily Word Games | Ammar Times",
    description:
      "Discover daily word games on Ammar Times, from Wordle-style puzzles to crosswords and spelling challenges.",
    url: absoluteUrl("/word-games"),
  },
};

export default function WordGamesPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Word Games", path: "/word-games" },
  ]);
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Ammar Times Word Games",
    itemListElement: wordGames.map((game, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: game.title,
      url: absoluteUrl(game.href),
    })),
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <h1 className="text-4xl font-bold text-foreground">Daily Word Games</h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        Ammar Times includes multiple daily word game formats so players can train vocabulary,
        pattern recognition, and clue solving in different ways.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {wordGames.map((game) => (
          <article key={game.href} className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">{game.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{game.summary}</p>
            <Link
              href={game.href}
              className="mt-4 inline-block rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-background"
            >
              Play now
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
