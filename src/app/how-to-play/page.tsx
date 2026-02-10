import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl, buildBreadcrumbJsonLd } from "@/lib/seo";

const gameGuides = [
  {
    name: "Wordle",
    href: "/games/wordle",
    rules: "Guess the hidden word in six tries using color feedback.",
  },
  {
    name: "Connections",
    href: "/games/connections",
    rules: "Sort sixteen words into four groups with shared themes.",
  },
  {
    name: "Mini Crossword",
    href: "/games/crossword",
    rules: "Fill the 5x5 grid using across and down clues.",
  },
  {
    name: "Numbers",
    href: "/games/numbers",
    rules: "Use arithmetic operations to hit the target number.",
  },
  {
    name: "Trivia",
    href: "/games/trivia",
    rules: "Answer daily quiz questions and improve your score.",
  },
  {
    name: "Strands",
    href: "/games/strands",
    rules: "Find themed words and uncover the spangram.",
  },
  {
    name: "Spelling Bee",
    href: "/games/spelling",
    rules: "Create as many valid words as possible from seven letters.",
  },
  {
    name: "Waffle",
    href: "/games/waffle",
    rules: "Swap letters to solve intersecting words within move limits.",
  },
  {
    name: "Combinations",
    href: "/games/combinations",
    rules: "Combine fragments to form valid words and maximize points.",
  },
];

export const metadata: Metadata = {
  title: "How To Play",
  description:
    "Learn rules, strategies, and quick-start tips for all Ammar Times daily puzzle games.",
  alternates: {
    canonical: "/how-to-play",
  },
  openGraph: {
    title: "How To Play | Ammar Times",
    description:
      "Learn rules, strategies, and quick-start tips for all Ammar Times daily puzzle games.",
    url: absoluteUrl("/how-to-play"),
  },
};

export default function HowToPlayPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "How To Play", path: "/how-to-play" },
  ]);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Are puzzles updated every day?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Ammar Times publishes new daily puzzles across its game categories.",
        },
      },
      {
        "@type": "Question",
        name: "Can I replay games in unlimited mode?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Several games offer unlimited mode for practice in addition to daily mode.",
        },
      },
      {
        "@type": "Question",
        name: "Which games are best for vocabulary practice?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Wordle, Connections, Mini Crossword, Strands, Spelling Bee, Waffle, and Combinations are all vocabulary-focused.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <h1 className="text-4xl font-bold text-foreground">How To Play Every Game</h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        Use this guide as a quick rules reference before each daily challenge.
        Each game has its own scoring style and strategy.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {gameGuides.map((game) => (
          <article key={game.href} className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold text-foreground">{game.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{game.rules}</p>
            <Link
              href={game.href}
              className="mt-4 inline-block rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-background"
            >
              Play {game.name}
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
