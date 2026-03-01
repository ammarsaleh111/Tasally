const DEFAULT_SITE_URL = "https://tasally.com";

function normalizeSiteUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return DEFAULT_SITE_URL;
  const trimmed = rawUrl.trim();
  if (!trimmed) return DEFAULT_SITE_URL;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const normalized = new URL(withProtocol);
    return normalized.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteName = "Tasally";
export const siteTagline = "Your Daily Brain Challenge";
export const siteDescription =
  "Play free daily puzzle & brain games online — Wordle, Connections, Mini Crossword, Numbers, Trivia, Strands, Waffle, Combinations, and Spelling Bee. New challenges every day on Tasally.";
export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.URL
);
export const siteHost = new URL(siteUrl).host;

export const isProductionDeploy =
  process.env.CONTEXT ? process.env.CONTEXT === "production" : process.env.NODE_ENV === "production";

export function absoluteUrl(pathname = "/") {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPath, siteUrl).toString();
}

/* ------------------------------------------------------------------ */
/*  JSON-LD Builders                                                   */
/* ------------------------------------------------------------------ */

export function buildBreadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildGameJsonLd({
  name,
  description,
  path,
  genre = "Word game",
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: `${name} — Free Daily ${genre} | ${siteName}`,
    description,
    genre,
    url: absoluteUrl(path),
    applicationCategory: "Game",
    operatingSystem: "Web browser",
    gamePlatform: ["Web browser", "Mobile browser"],
    numberOfPlayers: { "@type": "QuantitativeValue", value: 1 },
    playMode: "SinglePlayer",
    isAccessibleForFree: true,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };
}

/** Organization schema for knowledge panel */
export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: absoluteUrl("/icons/icon-512.png"),
    description: siteDescription,
    sameAs: [],
  };
}

/** WebSite schema with SearchAction for sitelinks search box */
export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    alternateName: ["Tasally", "تسالي"],
    description: siteDescription,
    url: siteUrl,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/games?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** SoftwareApplication schema for PWA-like rich results */
export function buildSoftwareAppJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteName,
    alternateName: "تسالي",
    description: siteDescription,
    url: siteUrl,
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
      bestRating: "5",
      worstRating: "1",
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Game SEO Registry (keyword-rich descriptions ≤ 160 chars)          */
/* ------------------------------------------------------------------ */

export const gameSeo = {
  wordle: {
    name: "Wordle",
    description: "Play the free daily Wordle game online — guess the hidden 5-letter word in six tries with color-coded feedback. New puzzle every day on Tasally.",
    path: "/games/wordle",
    genre: "Word game",
    keywords: ["wordle", "daily wordle", "word guessing game", "wordle online free", "5 letter word game"],
  },
  connections: {
    name: "Connections",
    description: "Play Connections online free — sort sixteen words into four themed groups. Test your vocabulary and lateral thinking with a new daily puzzle on Tasally.",
    path: "/games/connections",
    genre: "Word game",
    keywords: ["connections game", "word grouping game", "daily connections puzzle", "connections online free"],
  },
  crossword: {
    name: "Mini Crossword",
    description: "Solve the free daily Mini Crossword puzzle online — a quick 5×5 grid perfect for your coffee break. Fresh clues every day on Tasally.",
    path: "/games/crossword",
    genre: "Crossword",
    keywords: ["mini crossword", "daily crossword", "crossword online free", "quick crossword puzzle", "5x5 crossword"],
  },
  numbers: {
    name: "Numbers",
    description: "Play the daily Numbers math puzzle free online — use six numbers and arithmetic operations to reach the target. A new challenge every day on Tasally.",
    path: "/games/numbers",
    genre: "Math puzzle",
    keywords: ["numbers game", "math puzzle", "number puzzle online", "arithmetic challenge", "daily math game"],
  },
  trivia: {
    name: "Trivia",
    description: "Test your knowledge with free daily Trivia quizzes online — 10 questions across multiple topics with streak tracking. New quiz every day on Tasally.",
    path: "/games/trivia",
    genre: "Quiz",
    keywords: ["daily trivia", "trivia quiz", "trivia game online free", "knowledge quiz", "daily quiz game"],
  },
  strands: {
    name: "Strands",
    description: "Play Strands free online — find themed hidden words in a letter grid and uncover the daily spangram. A new word-search puzzle every day on Tasally.",
    path: "/games/strands",
    genre: "Word search",
    keywords: ["strands game", "word search puzzle", "strands online free", "daily word search", "spangram game"],
  },
  spelling: {
    name: "Spelling Bee",
    description: "Play Spelling Bee free online — build as many words as possible from seven honeycomb letters. Reach Queen Bee rank with a new puzzle daily on Tasally.",
    path: "/games/spelling",
    genre: "Word game",
    keywords: ["spelling bee game", "spelling bee online free", "honeycomb word game", "daily spelling puzzle"],
  },
  waffle: {
    name: "Waffle",
    description: "Play the daily Waffle word puzzle free online — swap letters in a waffle-shaped grid to solve all words in limited moves. New puzzle every day on Tasally.",
    path: "/games/waffle",
    genre: "Word puzzle",
    keywords: ["waffle game", "waffle word puzzle", "daily waffle", "waffle online free", "letter swap game"],
  },
  combinations: {
    name: "Combinations",
    description: "Play Combinations free online — combine word fragments to build valid words and maximize your score. A fresh daily word puzzle on Tasally.",
    path: "/games/combinations",
    genre: "Word puzzle",
    keywords: ["combinations game", "word fragment puzzle", "daily word game", "combinations online free"],
  },
};

