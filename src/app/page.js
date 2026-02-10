import Link from "next/link";
import HomePageClient from "./HomePageClient";
import { absoluteUrl, buildBreadcrumbJsonLd, siteDescription } from "@/lib/seo";

export const metadata = {
  title: "Daily Puzzle Games",
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Ammar Times | Daily Puzzle Games",
    description: siteDescription,
    url: absoluteUrl("/"),
  },
  twitter: {
    title: "Ammar Times | Daily Puzzle Games",
    description: siteDescription,
  },
};

export default function HomePage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([{ name: "Home", path: "/" }]);
  const homePageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Ammar Times Daily Puzzle Games",
    description: siteDescription,
    url: absoluteUrl("/"),
    about: [
      "Word games",
      "Crossword",
      "Trivia",
      "Math puzzle",
      "Daily puzzle challenge",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageJsonLd) }}
      />
      <HomePageClient />

      <section className="mx-auto max-w-5xl px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground">
          Daily word and puzzle games in one place
        </h2>
        <p className="mt-3 text-muted-foreground">
          Practice vocabulary, logic, and speed with fresh daily puzzles and unlimited replay modes.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link className="underline underline-offset-4" href="/games">
            Browse all games
          </Link>
          <Link className="underline underline-offset-4" href="/how-to-play">
            Learn game rules
          </Link>
          <Link className="underline underline-offset-4" href="/word-games">
            Explore word games
          </Link>
          <Link className="underline underline-offset-4" href="/puzzle-games">
            Explore puzzle categories
          </Link>
        </div>
      </section>
    </>
  );
}

