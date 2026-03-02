import SeoContentPage from "@/components/seo/SeoContentPage";
import { absoluteUrl, brandKeywords, siteDescription } from "@/lib/seo";

export const metadata = {
  title: "Tasally Word Games — Daily Wordle, Connections & Mini Crossword",
  description:
    "Play Tasally word games daily: Wordle-style, Connections-style, Mini Crossword, Strands, Spelling Bee, Waffle, and Combinations in one premium puzzle hub.",
  keywords: [...brandKeywords, "tasally word games", "tasally wordle", "tasally crossword", "tasally connections"],
  alternates: {
    canonical: "/word-games",
    languages: {
      en: "/word-games",
      ar: "/العاب-ذكاء-يومية",
    },
  },
  openGraph: {
    title: "Tasally Word Games — Daily Wordle, Connections & Mini Crossword",
    description: siteDescription,
    url: absoluteUrl("/word-games"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Tasally Word Games — Daily Wordle, Connections & Mini Crossword",
    description: siteDescription,
  },
};

const relatedLinks = [
  { href: "/games/wordle", label: "Play Tasally Word Game (Wordle)" },
  { href: "/games/connections", label: "Play Tasally Connections" },
  { href: "/games/crossword", label: "Play Tasally Mini Crossword" },
  { href: "/games/numbers", label: "Play Tasally Numbers Game" },
  { href: "/games/trivia", label: "Play Tasally Daily Trivia" },
  { href: "/tasally-games", label: "Open Tasally Games Hub" },
  { href: "/daily-puzzle-games", label: "Explore Daily Puzzle Games" },
  { href: "/العاب-تسالي", label: "استكشف صفحة العاب تسالي" },
];

const faqs = [
  {
    question: "What are the best Tasally word games to start with?",
    answer:
      "Most players start with Tasally Wordle and Mini Crossword because both are quick to learn and ideal for a consistent daily habit.",
  },
  {
    question: "Is Tasally Connections part of the word-games hub?",
    answer:
      "Yes. Connections is a core Tasally word game and appears in the same hub as Wordle, Mini Crossword, Strands, Spelling Bee, Waffle, and Combinations.",
  },
  {
    question: "Are Tasally word games updated daily?",
    answer:
      "Yes. The platform is built around daily puzzle refreshes and repeat play across multiple word formats.",
  },
  {
    question: "Can I mix quick and deep word challenges on Tasally?",
    answer:
      "Yes. You can solve a fast Wordle-style round, then move to deeper gameplay like Connections, Strands, or Mini Crossword in one session.",
  },
  {
    question: "Why use one word-games hub instead of separate sites?",
    answer:
      "A single Tasally hub reduces friction, keeps progress in one place, and makes it easier to build a stable daily puzzle routine.",
  },
  {
    question: "Does Tasally support bilingual discovery for word games?",
    answer:
      "Yes. Tasally ships English and Arabic SEO landing pages so users can discover the platform from both language ecosystems.",
  },
];

const sections = [
  {
    heading: "Tasally Word Games Hub",
    subsections: [
      {
        heading: "One brand, multiple daily word formats",
        paragraphs: [
          "Tasally word games are designed as a connected ecosystem, not isolated pages. You can open the platform once and move across deduction, pattern matching, clue-solving, and letter-swap formats without losing context. This makes the daily routine smoother because each new game extends the same cognitive session rather than restarting it.",
          "For SEO discoverability, this structure helps users who search by specific game intent and users who search by brand. A query like tasally wordle should lead into the same authority graph as tasally crossword or tasally connections. The hub model reinforces that all of those experiences belong to one destination with consistent quality and fresh daily engagement.",
        ],
      },
      {
        heading: "Word games that train different skills",
        paragraphs: [
          "Wordle-style play improves fast deduction under tight guess limits. Connections-style play improves category reasoning and semantic grouping. Mini Crossword improves clue interpretation and retrieval speed. Strands improves theme recognition in a grid context. Spelling Bee, Waffle, and Combinations add vocabulary construction and letter positioning pressure in distinct ways.",
          "When those formats are played together, the player develops broader linguistic agility. Instead of mastering one repetitive mechanic, you build a layered skill stack that transfers from one puzzle style to another. Tasally’s variety is not cosmetic; it is a deliberate way to improve retention and progression while still feeling fun and lightweight.",
        ],
      },
    ],
  },
  {
    heading: "How to Play Word Games on Tasally",
    subsections: [
      {
        heading: "A practical daily sequence",
        paragraphs: [
          "Start with a short warm-up game such as Wordle or Mini Crossword to get immediate momentum. After that, switch to Connections or Strands for deeper thematic and grouping reasoning. If you still have time, end with Waffle or Combinations to reinforce letter arrangement and lexical flexibility.",
          "This sequence balances speed and depth. It keeps cognitive load high enough to feel rewarding, but not so heavy that daily consistency becomes difficult. The best long-term improvement comes from regular sessions, not occasional marathons.",
        ],
      },
      {
        heading: "Tactics that improve results",
        paragraphs: [
          "In Wordle, prioritize informative opening guesses and adapt based on elimination. In Connections, map potential categories before submitting. In Mini Crossword, use easy intersections first to unlock hard clues. In Strands, anchor around the theme before chasing long paths. In Spelling Bee and Combinations, mine roots and suffix families before brute-force attempts.",
          "These tactics reduce random guessing and make each puzzle run measurable. Tasally players who track process quality, not just win/loss outcomes, usually improve faster across all word games.",
        ],
      },
    ],
  },
  {
    heading: "Why Tasally for Daily Word Games",
    paragraphs: [
      "Tasally strengthens brand trust by combining reliable daily refreshes, clear internal linking, and cohesive UX across all game types. Players are not dropped into disconnected microsites or inconsistent interfaces. The same visual system, account context, and progress mindset follow you across the entire word-games collection.",
      "That consistency matters for discoverability and for user satisfaction. Searchers who find one Tasally page can quickly access the rest of the ecosystem through descriptive links and shared semantics. Instead of competing pages cannibalizing each other, each route supports a wider brand entity centered on Tasally as the destination for premium daily word challenges.",
      "For users specifically searching tasally wordle, tasally crossword, tasally connections, or tasally word games, this page works as a high-intent navigation layer that routes directly to play while still providing useful context on game selection and routine building.",
    ],
  },
  {
    heading: "Build a Sustainable Word-Game Habit",
    paragraphs: [
      "A strong habit begins with predictability. Choose a fixed window each day, start with one quick puzzle, then graduate to one deeper puzzle. Keep the total session short enough that you can repeat it even on busy days. Tasally’s game mix is ideal for this because you can scale difficulty without leaving the platform.",
      "Weekly review also helps. Notice which formats feel easy and which feel slower, then rotate emphasis accordingly. If clue solving is strong but category grouping is weak, prioritize Connections. If vocabulary speed is strong but positional reasoning is weak, prioritize Waffle and Mini Crossword intersections.",
      "Over time, this habit creates tangible progress in both speed and confidence. The platform’s structure supports that progression by keeping everything discoverable, fast, and aligned with daily intent.",
    ],
  },
];

export default function WordGamesPage() {
  return (
    <SeoContentPage
      title="Tasally Word Games"
      description="A complete daily word-games guide for Tasally players, covering puzzle types, play sequence, strategy, and high-intent game links."
      path="/word-games"
      intro="This page helps users searching for Tasally word games discover the right starting point quickly, understand how each format works, and build a reliable daily routine across Wordle-style, Connections-style, and crossword-style gameplay."
      sections={sections}
      faqs={faqs}
      relatedLinks={relatedLinks}
    />
  );
}
