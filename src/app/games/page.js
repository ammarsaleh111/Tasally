import Link from "next/link";
import GamesPageClient from "./GamesPageClient";
import { absoluteUrl, buildBreadcrumbJsonLd } from "@/lib/seo";

export const metadata = {
  title: "Play 9 Free Daily Puzzle Games Online",
  description:
    "Choose from nine free daily puzzle games — Wordle, Connections, Mini Crossword, Numbers, Trivia, Strands, Waffle, Combinations, and Spelling Bee. No download required.",
  alternates: {
    canonical: "/games",
    languages: {
      en: "/games",
      ar: "/العاب-تسالي",
    },
  },
  openGraph: {
    title: "Play 9 Free Daily Puzzle Games Online | Tasally",
    description:
      "Choose from daily word games, number puzzles, trivia quizzes, and logic challenges — all free, all online, new puzzles every day.",
    url: absoluteUrl("/games"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Play 9 Free Daily Puzzle Games Online | Tasally",
    description:
      "Choose from daily word games, number puzzles, trivia quizzes, and logic challenges — all free, all online, new puzzles every day.",
  },
};

const games = [
  { name: "Wordle", path: "/games/wordle" },
  { name: "Connections", path: "/games/connections" },
  { name: "Mini Crossword", path: "/games/crossword" },
  { name: "Numbers", path: "/games/numbers" },
  { name: "Trivia", path: "/games/trivia" },
  { name: "Strands", path: "/games/strands" },
  { name: "Spelling Bee", path: "/games/spelling" },
  { name: "Waffle", path: "/games/waffle" },
  { name: "Combinations", path: "/games/combinations" },
];

export default function GamesPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Games", path: "/games" },
  ]);
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Tasally Games",
    itemListElement: games.map((game, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: game.name,
      url: absoluteUrl(game.path),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <GamesPageClient />
    </>
  );
}

