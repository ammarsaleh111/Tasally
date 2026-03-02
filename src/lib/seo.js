const PRIMARY_SITE_URL = "https://tasally.tech";
const DEFAULT_SITE_URL = PRIMARY_SITE_URL;

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
export const siteNameArabic = "تسالي";
export const siteTagline = "Your Daily Brain Challenge";
export const siteDescription =
  "Play daily puzzle games including Wordle, Crossword, Connections, Numbers & Trivia on Tasally. Your daily brain challenge.";
export const siteDescriptionArabic =
  "العب ألعاب ألغاز يومية مثل Wordle وCrossword وConnections وNumbers وTrivia على تسالي. تحدي يومي لعقلك.";
export const brandKeywords = [
  "tasally",
  "tasally games",
  "tasally puzzle",
  "tasally wordle",
  "tasally crossword",
  "tasally connections",
  "tasally numbers game",
  "tasally trivia",
  "tasally daily games",
  "tasally puzzle games",
  "تسالي",
  "تسالي العاب",
  "العاب تسالي",
  "تسالي كلمات",
  "تسالي ذكاء",
  "العاب ذكاء يومية",
  "العاب ذكاء تسالي",
  "daily games",
  "brain games",
  "puzzle platform",
];
export const siteUrl = PRIMARY_SITE_URL;
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
  genre = "Puzzle",
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Game",
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
    inLanguage: ["en", "ar"],
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
  const sameAs = [
    process.env.NEXT_PUBLIC_TASALLY_X,
    process.env.NEXT_PUBLIC_TASALLY_INSTAGRAM,
    process.env.NEXT_PUBLIC_TASALLY_FACEBOOK,
    process.env.NEXT_PUBLIC_TASALLY_YOUTUBE,
    process.env.NEXT_PUBLIC_TASALLY_LINKEDIN,
    process.env.NEXT_PUBLIC_TASALLY_GITHUB,
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    alternateName: [siteName, siteNameArabic],
    url: siteUrl,
    logo: absoluteUrl("/icons/icon-512.png"),
    description: siteDescription,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** WebSite schema with SearchAction for sitelinks search box */
export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    alternateName: [siteName, siteNameArabic],
    description: siteDescription,
    url: siteUrl,
    inLanguage: ["en", "ar"],
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
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

export function buildFaqJsonLd(faqs = []) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildHowToJsonLd({ name, description, path, steps = [], inLanguage = "en" }) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    url: absoluteUrl(path),
    inLanguage,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step,
      text: step,
    })),
  };
}

export function buildWebPageJsonLd({ name, description, path, inLanguage = "en" }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: absoluteUrl(path),
    inLanguage,
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: siteUrl,
    },
    about: {
      "@type": "Organization",
      name: siteName,
      alternateName: [siteNameArabic],
      url: siteUrl,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Game SEO Registry (keyword-rich descriptions ≤ 160 chars)          */
/* ------------------------------------------------------------------ */

export const gameSeo = {
  wordle: {
    name: "Wordle",
    description: "Play Tasally Wordle free online with daily puzzles and practice rounds. Guess the hidden word in six tries with smart color feedback.",
    path: "/games/wordle",
    genre: "Word game",
    keywords: ["wordle", "daily wordle", "word guessing game", "wordle online free", "5 letter word game"],
  },
  connections: {
    name: "Connections",
    description: "Play Tasally Connections online free. Group sixteen words into four sets and solve a fresh daily challenge with crisp, replayable logic.",
    path: "/games/connections",
    genre: "Word game",
    keywords: ["connections game", "word grouping game", "daily connections puzzle", "connections online free"],
  },
  crossword: {
    name: "Mini Crossword",
    description: "Solve Tasally Mini Crossword online free. Enjoy a quick daily 5×5 crossword and return for a new clue set every day.",
    path: "/games/crossword",
    genre: "Crossword",
    keywords: ["mini crossword", "daily crossword", "crossword online free", "quick crossword puzzle", "5x5 crossword"],
  },
  numbers: {
    name: "Numbers",
    description: "Play Tasally Numbers Game online with daily and practice modes. Combine six numbers and operators to hit the exact target efficiently.",
    path: "/games/numbers",
    genre: "Math puzzle",
    keywords: ["numbers game", "math puzzle", "number puzzle online", "arithmetic challenge", "daily math game"],
  },
  trivia: {
    name: "Trivia",
    description: "Play Tasally Daily Trivia free online with a fresh 10-question quiz and practice mode for extra rounds across mixed categories.",
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

export const gameSeoContent = {
  wordle: {
    intro:
      "Tasally Wordle mixes a clean daily challenge with flexible practice rounds, so you can keep momentum whether you have two minutes or twenty.",
    howToSteps: [
      "Start with a balanced opening word that uses common vowels and consonants.",
      "Read tile colors after each guess to lock known letters and positions.",
      "Switch strategy quickly: remove dead letters and test high-value patterns.",
      "Solve the daily puzzle, then use practice mode to sharpen consistency.",
    ],
    faqs: [
      {
        question: "Does Tasally Wordle include both daily and practice play?",
        answer:
          "Yes. Tasally Wordle supports a daily puzzle flow and additional practice rounds so you can keep training without waiting for the next day.",
      },
      {
        question: "How many guesses do I get in Tasally Wordle?",
        answer:
          "You get six guesses. Color feedback after each attempt helps narrow letters and positions quickly.",
      },
      {
        question: "What is the best starting strategy for Tasally Wordle?",
        answer:
          "Choose an opener with common letters, then pivot based on confirmed and eliminated characters instead of repeating uncertain patterns.",
      },
    ],
  },
  connections: {
    intro:
      "Tasally Connections rewards clear categorization and patience. The best runs come from scanning relationships before committing to a four-word set.",
    howToSteps: [
      "Scan all sixteen words and note obvious pairs before selecting anything.",
      "Build a probable category of four words and submit only when confident.",
      "Use near-miss feedback to refine the category boundary.",
      "Finish all four groups while preserving mistakes for tougher sets.",
    ],
    faqs: [
      {
        question: "What is the objective in Tasally Connections?",
        answer:
          "You need to sort sixteen words into four correct themed groups, with limited mistakes.",
      },
      {
        question: "Is Tasally Connections a daily puzzle?",
        answer:
          "Yes. The core experience is designed around daily play with consistent challenge progression.",
      },
      {
        question: "How can I improve at Connections puzzles?",
        answer:
          "Delay early submissions, map possible themes first, and resolve overlapping words only after easier groups are confirmed.",
      },
    ],
  },
  crossword: {
    intro:
      "Tasally Mini Crossword gives you a quick but meaningful clue-solving loop designed for daily repetition and steady vocabulary growth.",
    howToSteps: [
      "Start with the shortest clues to fill reliable anchors quickly.",
      "Use intersecting letters to unlock harder across and down answers.",
      "Cycle between clue lists when one path stalls.",
      "Review the full grid before finalizing to remove avoidable errors.",
    ],
    faqs: [
      {
        question: "How large is Tasally Mini Crossword?",
        answer:
          "Tasally uses a compact mini-grid format that is fast to complete while still delivering meaningful clue variety.",
      },
      {
        question: "Is there a new crossword every day?",
        answer:
          "Yes. You can return daily for a fresh mini crossword challenge.",
      },
      {
        question: "Who should play Tasally Mini Crossword?",
        answer:
          "It works well for both beginners and regular solvers who want a short, high-quality daily puzzle.",
      },
    ],
  },
  numbers: {
    intro:
      "Tasally Numbers Game combines arithmetic planning with puzzle efficiency, offering both daily targets and replayable practice sessions.",
    howToSteps: [
      "Review the target first and estimate a high-level route before combining numbers.",
      "Use multiplication and division early when they simplify the search space.",
      "Track intermediate results to avoid dead-end expressions.",
      "Finish the daily target, then run practice rounds to improve speed.",
    ],
    faqs: [
      {
        question: "Does Tasally Numbers Game support practice mode?",
        answer:
          "Yes. Alongside daily puzzles, Tasally Numbers includes practice rounds so you can work on faster arithmetic decision-making.",
      },
      {
        question: "How many numbers are used in each puzzle?",
        answer:
          "Each challenge starts with six numbers and a target value you must reach using valid operations.",
      },
      {
        question: "What is the best approach for high scores?",
        answer:
          "Plan two to three operations ahead and prioritize operations that keep numbers flexible for later steps.",
      },
    ],
  },
  trivia: {
    intro:
      "Tasally Daily Trivia is built for quick knowledge checks, with timed rounds that reward both accuracy and pacing.",
    howToSteps: [
      "Read each question fully before selecting an answer.",
      "Prioritize certainty over speed on close options.",
      "Track your category weaknesses after each session.",
      "Use practice mode to improve weak categories between daily rounds.",
    ],
    faqs: [
      {
        question: "How many questions are in Tasally Daily Trivia?",
        answer:
          "The daily set contains ten questions across mixed topics for a balanced challenge.",
      },
      {
        question: "Can I replay Trivia after the daily round?",
        answer:
          "Yes. Tasally also offers practice rounds so you can keep building speed and category coverage.",
      },
      {
        question: "How is Trivia performance tracked?",
        answer:
          "Tasally tracks progress through score, accuracy, and streak-style consistency metrics.",
      },
    ],
  },
  strands: {
    intro:
      "Tasally Strands combines themed discovery with pattern scanning, making it ideal for players who enjoy word-search style reasoning.",
    howToSteps: [
      "Read the puzzle theme and identify probable vocabulary families.",
      "Find short anchor words first to reveal board structure.",
      "Trace longer paths once the theme direction becomes clear.",
      "Locate the spangram to lock the final puzzle context.",
    ],
    faqs: [
      {
        question: "What makes Tasally Strands different?",
        answer:
          "Strands adds thematic logic to a word-search grid, so solving requires both vocabulary and category inference.",
      },
      {
        question: "Is Strands updated daily on Tasally?",
        answer:
          "Yes. A new strands challenge is published each day.",
      },
      {
        question: "How do I solve Strands faster?",
        answer:
          "Use the theme to reduce search space, confirm short words first, and then chain into longer terms.",
      },
    ],
  },
  spelling: {
    intro:
      "Tasally Spelling Bee focuses on flexible vocabulary building, encouraging depth through progressive score targets and repeated daily practice.",
    howToSteps: [
      "Start with short, high-frequency words to build momentum.",
      "Use the center letter in every valid entry.",
      "Look for suffix and prefix families to extend your list.",
      "Aim for longer words and pangrams to maximize score.",
    ],
    faqs: [
      {
        question: "How does Tasally Spelling Bee scoring work?",
        answer:
          "You earn points by building valid words from the letter hive, with longer words and special finds worth more.",
      },
      {
        question: "Is there a daily Spelling Bee puzzle?",
        answer: "Yes. Tasally refreshes the challenge daily to support consistent vocabulary practice.",
      },
      {
        question: "What is the best way to improve?",
        answer:
          "Group letters into roots, then expand with common suffixes and prefixes to uncover higher-value entries.",
      },
    ],
  },
  waffle: {
    intro:
      "Tasally Waffle is a letter-swapping puzzle that rewards planning, not randomness, through constrained moves and intersecting word logic.",
    howToSteps: [
      "Identify letters that are already in correct positions.",
      "Plan swaps that improve both row and column words at once.",
      "Avoid one-off swaps that break nearly solved intersections.",
      "Finish within move limits by prioritizing multi-letter gains.",
    ],
    faqs: [
      {
        question: "What is the goal in Tasally Waffle?",
        answer:
          "You must swap letters into the correct waffle grid positions to complete all intersecting words using limited moves.",
      },
      {
        question: "Is Waffle available daily on Tasally?",
        answer:
          "Yes. The puzzle is refreshed daily for repeatable challenge and progression.",
      },
      {
        question: "How can I reduce wasted swaps?",
        answer:
          "Prioritize swaps that solve multiple lines simultaneously instead of fixing isolated letters first.",
      },
    ],
  },
  combinations: {
    intro:
      "Tasally Combinations tests your ability to merge fragments into complete words while balancing speed, accuracy, and vocabulary depth.",
    howToSteps: [
      "Scan all available fragments and identify likely roots.",
      "Pair stems with suffix candidates before submitting.",
      "Use solved words to infer remaining fragment patterns.",
      "Optimize score by building longer valid combinations first.",
    ],
    faqs: [
      {
        question: "What is Tasally Combinations about?",
        answer:
          "You combine word fragments to create valid words and maximize your score in a daily puzzle format.",
      },
      {
        question: "Who is this game best for?",
        answer:
          "Combinations is ideal for players who enjoy vocabulary construction and pattern assembly challenges.",
      },
      {
        question: "How do I score better in Combinations?",
        answer:
          "Target longer words early, then use discovered roots to unlock additional valid pairs.",
      },
    ],
  },
};

