import SeoContentPage from "@/components/seo/SeoContentPage";
import { absoluteUrl, brandKeywords, siteDescription } from "@/lib/seo";

export const metadata = {
  title: "What Is Tasally? (تسالي) Full Platform Overview",
  description:
    "Understand what Tasally is, how Tasally daily games work, and why Tasally has become a complete destination for puzzle and brain game fans.",
  keywords: brandKeywords,
  alternates: {
    canonical: "/what-is-tasally",
    languages: {
      en: "/what-is-tasally",
      ar: "/تسالي",
    },
  },
  openGraph: {
    title: "What Is Tasally? (تسالي) Full Platform Overview",
    description: siteDescription,
    url: absoluteUrl("/what-is-tasally"),
  },
  twitter: {
    card: "summary_large_image",
    title: "What Is Tasally? (تسالي) Full Platform Overview",
    description: siteDescription,
  },
};

const relatedLinks = [
  { href: "/", label: "Tasally Homepage" },
  { href: "/games", label: "Tasally Games Directory" },
  { href: "/about-tasally", label: "About Tasally Brand" },
  { href: "/tasally-games", label: "Tasally Daily Games Guide" },
  { href: "/games/trivia", label: "Play Tasally Daily Trivia" },
  { href: "/games/numbers", label: "Play Tasally Numbers Puzzle" },
  { href: "/games/strands", label: "Play Tasally Strands Puzzle" },
  { href: "/daily-puzzle-archive", label: "Browse Tasally Archives" },
];

const faqs = [
  {
    question: "What is Tasally used for?",
    answer:
      "Tasally is used for playing daily puzzle and brain games online, tracking progress, and maintaining a daily challenge habit through multiple game formats in one place.",
  },
  {
    question: "Does Tasally support both Arabic and English users?",
    answer:
      "Yes. Tasally uses a bilingual brand identity with Tasally and تسالي, and supports language-aware SEO signals so both query families map to the same platform.",
  },
  {
    question: "Can I play different puzzle types on Tasally?",
    answer:
      "Yes. Tasally includes word puzzles, crossword, connections, trivia, number challenges, and additional daily logic games under one unified interface.",
  },
  {
    question: "Why does Tasally focus on daily gameplay?",
    answer:
      "Daily cadence increases consistency and creates a meaningful progression loop where players improve over time, track streaks, and return for new challenges every day.",
  },
];

const sections = [
  {
    heading: "Definition: What is Tasally?",
    subsections: [
      {
        heading: "Tasally as a daily puzzle platform",
        paragraphs: [
          "Tasally is a web platform centered on daily brain games. At its core, the product gives players one reliable destination to solve puzzles every day without downloads, account friction, or fragmented navigation. Rather than functioning as a single game, Tasally acts as a multi-game system where each category contributes to a complete daily challenge routine.",
          "When people ask, what is Tasally, the simplest answer is this: Tasally is a daily puzzle home for players who want variety, consistency, and measurable progress. The platform combines word-solving, logic, trivia, and number-based gameplay in one brand environment. This structure supports both newcomers and long-term puzzle enthusiasts.",
        ],
      },
      {
        heading: "Tasally for brand-first discovery",
        paragraphs: [
          "The platform is intentionally optimized for brand-first search behavior. Users searching for Tasally, Tasally games, Tasally puzzle, تسالي, or العاب تسالي should find consistent pages that clearly represent the same entity. This is achieved through canonical brand naming, uniform metadata, and cross-linked internal pages focused on branded intent.",
          "A unique brand term becomes more valuable when every indexed page reinforces the same meaning. Tasally pages are structured to send one clear signal to search engines: this domain is the official home of the Tasally puzzle ecosystem.",
        ],
      },
    ],
  },
  {
    heading: "How Tasally Works",
    subsections: [
      {
        heading: "Daily loop and progression",
        paragraphs: [
          "Tasally updates game experiences on a daily cycle. Players arrive, solve current puzzles, compare outcomes, and return for the next update. This loop is simple but powerful because it forms a habit. A daily cadence encourages consistent engagement, while leaderboards and achievements add long-term motivation.",
          "From a product perspective, a consistent loop improves retention and increases average depth per session. From an SEO perspective, a platform with repeat engagement and predictable fresh content tends to build stronger quality signals over time.",
        ],
      },
      {
        heading: "Game variety with one identity",
        paragraphs: [
          "Tasally includes multiple puzzle categories so players can choose based on mood and available time. A user may start with Wordle, continue with Connections, then finish with Trivia. This session flow creates a richer experience than one isolated game can provide.",
          "Even with multiple game types, the identity remains unified. The same design language, brand naming, and internal links connect all parts of the platform. This prevents brand dilution and helps users remember Tasally as a single trusted destination.",
        ],
      },
    ],
  },
  {
    heading: "Who Tasally Is For",
    paragraphs: [
      "Tasally is built for learners, casual players, competitive players, and anyone who enjoys daily mental stimulation. If you like quick word games in the morning, logic puzzles in short breaks, or trivia in the evening, the platform supports all of these routines.",
      "The platform is also useful for players who want progress visibility. Instead of random one-off gameplay, Tasally emphasizes continuity through archives, score history, and leaderboard participation. This transforms puzzle time from occasional entertainment into a structured personal challenge.",
      "For Arabic-speaking users and English-speaking users alike, Tasally presents a consistent brand story and clear navigation path. That combination improves usability and discoverability at the same time.",
    ],
  },
  {
    heading: "Why Tasally Matters in Puzzle Search",
    paragraphs: [
      "In a crowded puzzle market, clear brand meaning is a competitive advantage. Tasally focuses on this by aligning every technical and content signal around one message: this is the home for daily puzzle games under the Tasally name.",
      "When users repeatedly click, return, and search for the brand directly, search engines learn stronger entity association. Over time, that produces better ranking stability for branded queries and better visibility across related puzzle intents.",
    ],
  },
];

export default function WhatIsTasallyPage() {
  return (
    <SeoContentPage
      title="What Is Tasally?"
      description="Tasally (تسالي) is a complete daily puzzle and brain games platform designed for consistency, variety, and long-term player progress."
      path="/what-is-tasally"
      intro="If you discovered Tasally through search and want a complete explanation, this page gives a practical definition of the platform, how gameplay works, and why the Tasally brand is becoming a daily destination for puzzle players."
      sections={sections}
      faqs={faqs}
      relatedLinks={relatedLinks}
    />
  );
}
