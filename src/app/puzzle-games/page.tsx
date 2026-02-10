import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl, buildBreadcrumbJsonLd } from "@/lib/seo";

const puzzleCategories = [
  {
    heading: "Word Puzzles",
    items: ["Wordle", "Connections", "Mini Crossword", "Strands", "Spelling Bee", "Waffle", "Combinations"],
    link: "/word-games",
  },
  {
    heading: "Number and Logic Puzzles",
    items: ["Numbers"],
    link: "/games/numbers",
  },
  {
    heading: "Knowledge Puzzles",
    items: ["Trivia"],
    link: "/games/trivia",
  },
];

export const metadata: Metadata = {
  title: "Online Puzzle Games",
  description:
    "Play online puzzle games daily with multiple categories: word puzzles, math challenges, and trivia.",
  alternates: {
    canonical: "/puzzle-games",
  },
  openGraph: {
    title: "Online Puzzle Games | Ammar Times",
    description:
      "Play online puzzle games daily with multiple categories: word puzzles, math challenges, and trivia.",
    url: absoluteUrl("/puzzle-games"),
  },
};

export default function PuzzleGamesPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Puzzle Games", path: "/puzzle-games" },
  ]);
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Ammar Times Puzzle Categories",
    description:
      "Puzzle categories including word puzzles, number puzzles, and trivia.",
    url: absoluteUrl("/puzzle-games"),
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <h1 className="text-4xl font-bold text-foreground">Online Puzzle Games</h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        Choose puzzle formats by skill focus and play a fresh challenge every day.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {puzzleCategories.map((category) => (
          <section key={category.heading} className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">{category.heading}</h2>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {category.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link
              href={category.link}
              className="mt-4 inline-block rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-background"
            >
              Open category
            </Link>
          </section>
        ))}
      </div>
    </main>
  );
}
