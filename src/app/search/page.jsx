import Link from "next/link";
import { headers } from "next/headers";
import { absoluteUrl, buildBreadcrumbJsonLd } from "@/lib/seo";

const searchIndex = [
  {
    title: "Tasally Games Hub",
    href: "/games",
    category: "Games Hub",
    description: "Browse all nine Tasally daily puzzle games from one page.",
    tags: ["tasally", "tasally games", "daily puzzles", "games hub"],
  },
  {
    title: "Tasally Brand Games Hub",
    href: "/tasally-games",
    category: "SEO Hub",
    description: "Discover the complete Tasally games collection and how to play daily.",
    tags: ["tasally games", "tasally puzzle", "brain games"],
  },
  {
    title: "Daily Puzzle Games",
    href: "/daily-puzzle-games",
    category: "SEO Hub",
    description: "Word, logic, numbers, and trivia daily challenges in one platform.",
    tags: ["daily puzzle games", "brain games", "daily challenges"],
  },
  {
    title: "Word Games Hub",
    href: "/word-games",
    category: "SEO Hub",
    description: "Play Wordle-style, Connections-style, Mini Crossword, and more.",
    tags: ["word games", "wordle", "crossword", "connections"],
  },
  {
    title: "About Tasally",
    href: "/about-tasally",
    category: "Content",
    description: "Learn about Tasally, its brand mission, and platform strategy.",
    tags: ["about tasally", "tasally brand", "tasally platform"],
  },
  {
    title: "What Is Tasally",
    href: "/what-is-tasally",
    category: "Content",
    description: "Understand what Tasally is and how the daily puzzle experience works.",
    tags: ["what is tasally", "tasally meaning", "tasally overview"],
  },
  {
    title: "Arabic Tasally Hub",
    href: "/العاب-تسالي",
    category: "Arabic Hub",
    description: "صفحة عربية لاكتشاف ألعاب تسالي اليومية بسهولة.",
    tags: ["تسالي العاب", "العاب تسالي", "العاب ذكاء"],
  },
  {
    title: "Arabic Daily Intelligence Games",
    href: "/العاب-ذكاء-يومية",
    category: "Arabic Hub",
    description: "العاب ذكاء يومية تشمل الكلمات والمنطق والأرقام.",
    tags: ["العاب ذكاء يومية", "تسالي كلمات", "العاب يومية"],
  },
  {
    title: "Tasally Arabic Brand Page",
    href: "/تسالي",
    category: "Arabic Hub",
    description: "تعريف شامل بمنصة تسالي وتجربة الألعاب اليومية.",
    tags: ["تسالي", "منصة تسالي", "تسالي الرسمية"],
  },
  {
    title: "Play Tasally Word Game (Wordle)",
    href: "/games/wordle",
    category: "Game",
    description: "Guess the hidden word in six tries with daily and practice modes.",
    tags: ["tasally wordle", "word game", "daily word game"],
  },
  {
    title: "Play Tasally Connections",
    href: "/games/connections",
    category: "Game",
    description: "Group words by theme and solve fresh daily category puzzles.",
    tags: ["tasally connections", "grouping puzzle", "daily connections"],
  },
  {
    title: "Play Tasally Mini Crossword",
    href: "/games/crossword",
    category: "Game",
    description: "Solve a fast daily mini crossword challenge online.",
    tags: ["tasally crossword", "mini crossword", "daily crossword"],
  },
  {
    title: "Play Tasally Numbers Game",
    href: "/games/numbers",
    category: "Game",
    description: "Combine six numbers and operators to hit the target.",
    tags: ["tasally numbers game", "math puzzle", "numbers challenge"],
  },
  {
    title: "Play Tasally Daily Trivia",
    href: "/games/trivia",
    category: "Game",
    description: "Answer daily quiz questions across mixed categories.",
    tags: ["tasally trivia", "quiz game", "daily trivia"],
  },
  {
    title: "Play Tasally Strands",
    href: "/games/strands",
    category: "Game",
    description: "Find themed hidden words and solve the daily grid.",
    tags: ["strands", "word search", "daily strands"],
  },
  {
    title: "Play Tasally Spelling Bee",
    href: "/games/spelling",
    category: "Game",
    description: "Build words from seven letters and climb rank tiers.",
    tags: ["spelling bee", "word puzzle", "tasally spelling"],
  },
  {
    title: "Play Tasally Waffle",
    href: "/games/waffle",
    category: "Game",
    description: "Swap letters to complete all words in limited moves.",
    tags: ["waffle puzzle", "letter swap", "daily waffle"],
  },
  {
    title: "Play Tasally Combinations",
    href: "/games/combinations",
    category: "Game",
    description: "Combine fragments into valid words and maximize score.",
    tags: ["combinations", "word fragments", "daily combinations"],
  },
];

const defaultSuggestions = [
  "tasally games",
  "tasally wordle",
  "tasally crossword",
  "tasally connections",
  "daily puzzle games",
  "العاب تسالي",
  "العاب ذكاء يومية",
];

const featuredHubs = [
  { href: "/games", label: "Tasally Games Hub" },
  { href: "/tasally-games", label: "Tasally Brand Hub" },
  { href: "/daily-puzzle-games", label: "Daily Puzzle Games" },
  { href: "/word-games", label: "Word Games Hub" },
  { href: "/العاب-تسالي", label: "صفحة العاب تسالي" },
  { href: "/العاب-ذكاء-يومية", label: "صفحة العاب ذكاء يومية" },
];

export const metadata = {
  title: "Tasally Search",
  description: "Search Tasally games and SEO guides by keyword.",
  alternates: {
    canonical: "/search",
    languages: {
      en: "/search",
      ar: "/العاب-ذكاء-يومية",
    },
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Tasally Search",
    description: "Find Tasally game pages and puzzle guides quickly.",
    url: absoluteUrl("/search"),
  },
};

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const headerStore = await headers();
  const acceptLanguage = (headerStore.get("accept-language") || "").toLowerCase();
  const query = (params?.q || "").toString().trim().toLowerCase();
  const hasArabicChars = /[\u0600-\u06FF]/.test(query);
  const isArabic = params?.lang === "ar" || acceptLanguage.includes("ar") || hasArabicChars;

  const filtered = query
    ? searchIndex.filter((entry) => {
        const haystack = `${entry.title} ${entry.description} ${entry.tags.join(" ")}`.toLowerCase();
        return haystack.includes(query);
      })
    : searchIndex;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Search", path: "/search" },
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <h1 className="text-4xl font-bold text-foreground">{isArabic ? "ابحث في تسالي" : "Search Tasally"}</h1>
      <p className="mt-3 text-muted-foreground">
        {isArabic
          ? "ابحث بالكلمات المفتاحية عن ألعاب تسالي، الصفحات العربية، وأدلة اللعب اليومية."
          : "Use keyword search for Tasally games, SEO hubs, and public content pages."}
      </p>

      <form className="mt-6" action="/search" method="get">
        <label htmlFor="q" className="block text-sm font-medium text-foreground">Search query</label>
        <div className="mt-2 flex gap-2">
          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="tasally wordle"
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          <button className="rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-background" type="submit">
            Search
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {!query && (
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">
              {isArabic ? "اقتراحات بحث سريعة" : "Popular Search Suggestions"}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {defaultSuggestions.map((suggestion) => (
                <Link
                  key={suggestion}
                  href={`/search?q=${encodeURIComponent(suggestion)}`}
                  className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-background"
                >
                  {suggestion}
                </Link>
              ))}
            </div>
            <h3 className="mt-4 text-sm font-semibold text-foreground">
              {isArabic ? "روابط مهمة" : "Helpful Hubs"}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {featuredHubs.map((hub) => (
                <Link
                  key={hub.href}
                  href={hub.href}
                  className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-background"
                >
                  {hub.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {filtered.length ? (
          filtered.map((entry) => (
            <article key={entry.href} className="rounded-xl border border-border bg-card p-4">
              <h2 className="font-semibold text-foreground">
                <Link href={entry.href} className="hover:underline">{entry.title}</Link>
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">{entry.category} • {entry.tags.join(" • ")}</p>
              <p className="mt-2 text-sm text-foreground/80">{entry.description}</p>
            </article>
          ))
        ) : (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            {isArabic
              ? "لا توجد نتائج مباشرة. جرّب: تسالي العاب، العاب ذكاء يومية، أو tasally crossword."
              : "No direct matches found. Try: tasally games, tasally crossword, tasally trivia, or العاب تسالي."}
          </p>
        )}
      </div>
    </main>
  );
}
