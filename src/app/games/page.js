import Link from "next/link";
import GamesPageClient from "./GamesPageClient";
import { absoluteUrl, buildBreadcrumbJsonLd } from "@/lib/seo";

export const metadata = {
  title: "Games Hub",
  description:
    "Play nine daily puzzle games: Wordle, Connections, Mini Crossword, Numbers, Trivia, Strands, Waffle, Combinations, and Spelling Bee.",
  alternates: {
    canonical: "/games",
  },
  openGraph: {
    title: "Games Hub | Ammar Times",
    description:
      "Choose from daily word games, number puzzles, trivia, and logic challenges.",
    url: absoluteUrl("/games"),
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
    name: "Ammar Times Games",
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

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-bold text-foreground">
          Explore all game modes
        </h2>
        <p className="mt-3 text-muted-foreground">
          Every title supports daily puzzle play, and several games include unlimited mode for extra practice.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {games.map((game) => (
            <Link
              key={game.path}
              href={game.path}
              className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-card"
            >
              {game.name}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

