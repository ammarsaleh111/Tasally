import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl, buildBreadcrumbJsonLd } from "@/lib/seo";

const archiveLinks = [
  { label: "Wordle Archive", href: "/games/wordle" },
  { label: "Connections Archive", href: "/games/connections" },
  { label: "Crossword Archive", href: "/games/crossword" },
  { label: "Numbers Archive", href: "/games/numbers" },
  { label: "Trivia Archive", href: "/games/trivia" },
  { label: "Strands Archive", href: "/games/strands" },
  { label: "Spelling Bee Archive", href: "/games/spelling" },
  { label: "Waffle Archive", href: "/games/waffle" },
  { label: "Combinations Archive", href: "/games/combinations" },
];

export const metadata: Metadata = {
  title: "Daily Puzzle Archive — All 9 Games",
  description:
    "Browse every daily puzzle category on Tasally — Wordle, Connections, Crossword, Numbers, Trivia, Strands, Spelling Bee, Waffle, and Combinations. Continue your streak today.",
  alternates: {
    canonical: "/daily-puzzle-archive",
  },
  keywords: [
    "daily puzzle archive",
    "puzzle of the day",
    "daily brain games",
    "wordle today",
  ],
  openGraph: {
    title: "Daily Puzzle Archive | Tasally",
    description:
      "Browse every daily puzzle category on Tasally and continue your streak.",
    url: absoluteUrl("/daily-puzzle-archive"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Puzzle Archive | Tasally",
    description:
      "Browse every daily puzzle category on Tasally and continue your streak.",
  },
};

export default function DailyPuzzleArchivePage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Daily Puzzle Archive", path: "/daily-puzzle-archive" },
  ]);
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Daily Puzzle Archive",
    itemListElement: archiveLinks.map((link, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: link.label,
      url: absoluteUrl(link.href),
    })),
  };

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <h1 className="text-4xl font-bold text-foreground">Daily Puzzle Archive</h1>
      <p className="mt-4 text-muted-foreground">
        Use this page as a single navigation hub for all daily puzzle categories. Each game route
        loads the latest puzzle and supports repeat practice where available.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {archiveLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-background"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
