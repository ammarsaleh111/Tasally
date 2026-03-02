import SeoContentPage from "@/components/seo/SeoContentPage";
import { absoluteUrl, brandKeywords, siteDescription } from "@/lib/seo";

export const metadata = {
  title: "About Tasally (تسالي) — Daily Puzzle & Brain Games Brand",
  description:
    "Learn the full Tasally story, how daily puzzle games are built, and why Tasally (تسالي) is becoming a trusted destination for word, logic, and brain games.",
  keywords: brandKeywords,
  alternates: {
    canonical: "/about-tasally",
    languages: {
      en: "/about-tasally",
      ar: "/تسالي",
    },
  },
  openGraph: {
    title: "About Tasally (تسالي) — Daily Puzzle & Brain Games Brand",
    description: siteDescription,
    url: absoluteUrl("/about-tasally"),
  },
  twitter: {
    card: "summary_large_image",
    title: "About Tasally (تسالي) — Daily Puzzle & Brain Games Brand",
    description: siteDescription,
  },
};

const relatedLinks = [
  { href: "/", label: "Tasally Homepage" },
  { href: "/games", label: "Play Tasally Puzzle Games" },
  { href: "/tasally-games", label: "Explore Tasally Games Hub" },
  { href: "/games/wordle", label: "Play Tasally Daily Word Game" },
  { href: "/games/crossword", label: "Play Tasally Daily Crossword" },
  { href: "/games/connections", label: "Play Tasally Connections Puzzle" },
  { href: "/daily-puzzle-archive", label: "Tasally Daily Puzzle Archive" },
];

const faqs = [
  {
    question: "What is Tasally (تسالي)?",
    answer:
      "Tasally is a daily puzzle and brain games platform with multiple game formats, including Wordle-style challenges, crossword puzzles, connections, trivia, and number games. It is built to deliver a consistent daily challenge experience in both English and Arabic brand contexts.",
  },
  {
    question: "Is Tasally free to use?",
    answer:
      "Yes. Tasally is accessible for free and focuses on a smooth no-download web experience. Players can open the platform instantly, play daily challenges, and track progress over time.",
  },
  {
    question: "How often does Tasally update puzzles?",
    answer:
      "Tasally updates daily challenges every day and keeps puzzle categories refreshed so players can return regularly for new brain-training sessions.",
  },
  {
    question: "Which games are available on Tasally?",
    answer:
      "Tasally includes Wordle, Connections, Crossword, Numbers, Trivia, Strands, Spelling Bee, Waffle, and Combinations, all organized in a single puzzle platform experience.",
  },
];

const sections = [
  {
    heading: "Tasally Brand Mission",
    subsections: [
      {
        heading: "Why Tasally exists",
        paragraphs: [
          "Tasally was created to make daily puzzle games easier to access, easier to enjoy, and easier to return to every day. Instead of switching between disconnected game sites, players can open one destination and start a complete brain game session immediately. The brand is intentionally short, memorable, and easy to search in both English and Arabic, which supports fast discovery and strong brand recognition.",
          "The Tasally mission is simple: deliver a daily habit that feels rewarding. Every puzzle is designed to support consistency, challenge, and progress tracking so players can build momentum over weeks and months. From casual five-minute sessions to longer streak-building sessions, Tasally offers a clear daily destination for people who enjoy word games, logic games, and mental exercise.",
        ],
      },
      {
        heading: "Bilingual brand identity",
        paragraphs: [
          "The platform consistently uses Tasally as the primary brand and تسالي as the Arabic form. This dual identity is implemented in page metadata, social previews, structured data, and internal navigation so search engines associate both language variants with the same domain authority. Consistent naming reduces ambiguity and increases the chance that brand queries map directly to official Tasally pages.",
          "For players, bilingual consistency creates trust. Whether a user searches for Tasally games, Tasally puzzle, تسالي العاب, or العاب تسالي, the same brand context appears with clear signals: daily puzzles, free web gameplay, and a unified game platform. This is essential for long-term SEO growth because brand clarity compounds over time through recurring impressions and repeat clicks.",
        ],
      },
    ],
  },
  {
    heading: "What Makes Tasally Different",
    subsections: [
      {
        heading: "Daily puzzle platform, not one game",
        paragraphs: [
          "Many puzzle websites focus on one flagship game only. Tasally is different because it combines nine daily puzzle categories in a single ecosystem, with one navigation structure and one player identity. This gives players variety without friction: they can solve a word challenge, move to a number puzzle, then finish with trivia in one session.",
          "By organizing daily games this way, Tasally increases session depth and repeat engagement. Search engines also benefit from this architecture because the domain contains a strong network of interlinked puzzle pages, each tied back to the same trusted brand entity.",
        ],
      },
      {
        heading: "Progress and social proof",
        paragraphs: [
          "Tasally supports achievements, progress history, and leaderboard visibility so gameplay has a long-term arc. These features are not decorative; they encourage repeat visits and richer user behavior signals. As a result, players spend more time on site and return daily, which strengthens both product retention and search performance indicators.",
          "A platform that rewards consistency is more likely to build a durable brand footprint. Over time, users remember the exact brand term and search for Tasally directly instead of generic puzzle queries. This direct-search behavior is a key indicator of brand dominance.",
        ],
      },
    ],
  },
  {
    heading: "How Tasally Supports Growth",
    paragraphs: [
      "Tasally growth comes from three pillars: technical quality, content coverage, and authority building. Technical quality ensures pages are crawlable, structured, and fast. Content coverage ensures users can land on relevant pages for both branded and informational queries. Authority building ensures external mentions and backlinks reinforce domain trust and discoverability.",
      "As the platform grows, new game pages and supporting educational pages continue to expand topical breadth while still reinforcing one central entity: Tasally. This combination is effective because it balances wide intent coverage with strict brand consistency.",
      "If you are looking for a long-term daily puzzle destination, Tasally is built for that purpose. The platform prioritizes clean user experience, clear game discovery, and recurring daily value so every session contributes to both player enjoyment and measurable progress.",
    ],
  },
];

export default function AboutTasallyPage() {
  return (
    <SeoContentPage
      title="About Tasally (تسالي)"
      description="Tasally is a daily puzzle and brain games platform built for consistent challenge, bilingual discovery, and long-term player engagement."
      path="/about-tasally"
      intro="Tasally (تسالي) is designed as a complete daily puzzle ecosystem where players can build a lasting brain-training habit. This page explains the brand, the platform direction, and what makes Tasally a trusted destination for daily word and logic challenges."
      sections={sections}
      faqs={faqs}
      relatedLinks={relatedLinks}
    />
  );
}
