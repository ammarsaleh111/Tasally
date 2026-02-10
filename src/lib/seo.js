const DEFAULT_SITE_URL = "https://ammartimes.tech";

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

export const siteName = "Ammar Times";
export const siteDescription =
  "Play daily puzzle games including Wordle, Connections, Mini Crossword, Numbers, Trivia, Strands, Waffle, Combinations, and Spelling Bee.";
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
    name,
    description,
    genre,
    url: absoluteUrl(path),
    applicationCategory: "Game",
    operatingSystem: "Web browser",
    isAccessibleForFree: true,
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
  };
}

export const gameSeo = {
  wordle: {
    name: "Wordle",
    description: "Guess the daily word in six tries with color feedback.",
    path: "/games/wordle",
    genre: "Word game",
  },
  connections: {
    name: "Connections",
    description: "Group sixteen words into four themed sets.",
    path: "/games/connections",
    genre: "Word game",
  },
  crossword: {
    name: "Mini Crossword",
    description: "Solve the daily 5x5 crossword puzzle.",
    path: "/games/crossword",
    genre: "Crossword",
  },
  numbers: {
    name: "Numbers",
    description: "Use arithmetic operations to reach the target number.",
    path: "/games/numbers",
    genre: "Math puzzle",
  },
  trivia: {
    name: "Trivia",
    description: "Answer daily trivia questions across multiple topics.",
    path: "/games/trivia",
    genre: "Quiz",
  },
  strands: {
    name: "Strands",
    description: "Find themed words and uncover the daily spangram.",
    path: "/games/strands",
    genre: "Word search",
  },
  spelling: {
    name: "Spelling Bee",
    description: "Build as many words as possible from the honeycomb letters.",
    path: "/games/spelling",
    genre: "Word game",
  },
  waffle: {
    name: "Waffle",
    description: "Swap letters and solve the waffle grid in limited moves.",
    path: "/games/waffle",
    genre: "Word puzzle",
  },
  combinations: {
    name: "Combinations",
    description: "Combine fragments to build valid words and maximize score.",
    path: "/games/combinations",
    genre: "Word puzzle",
  },
};

