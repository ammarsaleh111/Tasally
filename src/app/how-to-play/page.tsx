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
  title: "How To Play — Rules & Tips for All 9 Puzzle Games",
  description:
    "Learn rules, strategies, and quick-start tips for all 9 free daily puzzle games on Tasally — Wordle, Connections, Mini Crossword, Numbers, Trivia, Strands, Spelling Bee, Waffle, and Combinations.",
  alternates: {
    canonical: "/how-to-play",
  },
  keywords: [
    "how to play wordle",
    "connections game rules",
    "puzzle game tips",
    "daily puzzle help",
    "word game strategies",
  ],
  openGraph: {
    title: "How To Play — Rules & Tips for All 9 Puzzle Games | Tasally",
    description:
      "Learn rules, strategies, and quick-start tips for all 9 free daily puzzle games on Tasally.",
    url: absoluteUrl("/how-to-play"),
  },
  twitter: {
    card: "summary_large_image",
    title: "How To Play — Rules & Tips | Tasally",
    description:
      "Learn rules, strategies, and quick-start tips for all 9 free daily puzzle games on Tasally.",
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
          text: "Yes. Tasally publishes new daily puzzles for all nine game categories every single day.",
        },
      },
      {
        "@type": "Question",
        name: "Can I replay games in unlimited mode?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Several games, including Wordle and Trivia, offer unlimited or practice mode in addition to the daily challenge.",
        },
      },
      {
        "@type": "Question",
        name: "Which games are best for vocabulary practice?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Wordle, Connections, Mini Crossword, Strands, Spelling Bee, Waffle, and Combinations are all vocabulary-focused word games.",
        },
      },
      {
        "@type": "Question",
        name: "Is Tasally free to play?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. All nine puzzle games on Tasally are completely free to play with no downloads or subscriptions required.",
        },
      },
      {
        "@type": "Question",
        name: "How does Wordle on Tasally work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Guess the hidden 5-letter word in six tries. After each guess, tiles turn green (correct position), yellow (wrong position), or gray (not in the word).",
        },
      },
      {
        "@type": "Question",
        name: "What is the Connections game?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Connections presents sixteen words that must be sorted into four groups of four, each sharing a hidden theme. You have four mistakes before the game ends.",
        },
      },
      {
        "@type": "Question",
        name: "Can I play Tasally on my phone?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Tasally is a Progressive Web App (PWA) that works on any mobile browser. You can also install it to your home screen for an app-like experience.",
        },
      },
      {
        "@type": "Question",
        name: "How are scores tracked on Tasally?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Each game tracks your statistics, win streaks, and best scores locally. Sign in with Google to sync your progress and compete on group and global leaderboards.",
        },
      },
      {
        "@type": "Question",
        name: "What makes Tasally different from other puzzle sites?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tasally combines nine daily puzzle games in one place — word games, math puzzles, trivia, and more — with achievements, leaderboards, groups, and seasonal themes.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need to create an account?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. You can play all games as a guest. Creating an account with Google lets you save progress across devices, join groups, and appear on leaderboards.",
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
