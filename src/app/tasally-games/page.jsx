import SeoContentPage from "@/components/seo/SeoContentPage";
import { absoluteUrl, brandKeywords, siteDescription } from "@/lib/seo";

export const metadata = {
  title: "Tasally Games — Play Daily Word, Logic & Brain Challenges",
  description:
    "Discover all Tasally games in one place: daily Wordle, Crossword, Connections, Numbers, Trivia, Strands, Spelling Bee, Waffle, and Combinations.",
  keywords: brandKeywords,
  alternates: {
    canonical: "/tasally-games",
    languages: {
      en: "/tasally-games",
      ar: "/العاب-تسالي",
    },
  },
  openGraph: {
    title: "Tasally Games — Play Daily Word, Logic & Brain Challenges",
    description: siteDescription,
    url: absoluteUrl("/tasally-games"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Tasally Games — Play Daily Word, Logic & Brain Challenges",
    description: siteDescription,
  },
};

const relatedLinks = [
  { href: "/games", label: "Open All Tasally Games" },
  { href: "/games/wordle", label: "Play Tasally Word Game (Wordle)" },
  { href: "/games/connections", label: "Play Tasally Connections" },
  { href: "/games/crossword", label: "Play Tasally Mini Crossword" },
  { href: "/games/numbers", label: "Play Tasally Numbers Game" },
  { href: "/games/trivia", label: "Play Tasally Daily Trivia" },
  { href: "/games/spelling", label: "Play Tasally Spelling Bee" },
  { href: "/games/waffle", label: "Play Tasally Waffle Puzzle" },
  { href: "/games/combinations", label: "Play Tasally Combinations" },
  { href: "/العاب-تسالي", label: "Arabic Tasally Games Hub" },
];

const faqs = [
  {
    question: "How many games does Tasally include?",
    answer:
      "Tasally currently includes nine daily puzzle games: Wordle, Connections, Crossword, Numbers, Trivia, Strands, Spelling Bee, Waffle, and Combinations.",
  },
  {
    question: "Are Tasally games updated every day?",
    answer:
      "Yes. Tasally games are designed around daily play, with fresh puzzle sessions and recurring challenge loops to keep gameplay engaging.",
  },
  {
    question: "Which Tasally game should new players start with?",
    answer:
      "New players often start with Wordle or Crossword for quick onboarding, then expand to Connections, Trivia, and Numbers for broader challenge variety.",
  },
  {
    question: "Do Tasally games support long-term progress?",
    answer:
      "Yes. Tasally games support streaks, achievements, archives, and leaderboard tracking so players can build measurable progress over time.",
  },
  {
    question: "How should I structure my first week on Tasally?",
    answer:
      "Start with Wordle and Mini Crossword daily, then rotate in Connections, Numbers, and Trivia to build broader puzzle stamina without overload.",
  },
];

const sections = [
  {
    heading: "Tasally Games Overview",
    subsections: [
      {
        heading: "One platform, nine daily games",
        paragraphs: [
          "Tasally games are organized as a complete daily puzzle collection rather than separate disconnected products. That means players get one entry point and one account context for all major puzzle categories. You can solve word challenges, logic grouping puzzles, number-based tasks, and trivia rounds in a single session without losing flow.",
          "This format is useful for players who want both routine and variety. Instead of repeating one exact mechanic forever, Tasally rotates your cognitive workload across language, memory, pattern recognition, arithmetic, and general knowledge. The result is a broader and more rewarding brain-training experience.",
        ],
      },
      {
        heading: "Why game diversity improves retention",
        paragraphs: [
          "A multi-game platform naturally increases session depth. When one puzzle ends, another puzzle style is immediately available. This encourages players to stay longer and come back more frequently because boredom is reduced and challenge types feel fresh from day to day.",
          "For search growth, this diversity creates stronger topical breadth. Each game route has its own intent profile while still reinforcing one domain authority. Tasally gains coverage for multiple puzzle query families while preserving brand focus.",
        ],
      },
    ],
  },
  {
    heading: "Game Categories in Tasally",
    subsections: [
      {
        heading: "Word and language games",
        paragraphs: [
          "Wordle, Connections, Strands, Spelling Bee, Waffle, and Combinations cover different language challenges. Some emphasize deduction, others reward vocabulary breadth, and others test pattern assembly. Together, they provide layered word-game progression suitable for beginners and advanced players.",
          "Because these games are daily, players build intuition over time. Pattern recognition, letter placement strategy, and vocabulary speed improve naturally through repeat exposure.",
        ],
      },
      {
        heading: "Logic, numbers, and knowledge",
        paragraphs: [
          "Crossword, Numbers, and Trivia complement word-first gameplay with broader cognitive modes. Crossword supports clue interpretation and concise inference. Numbers focuses on arithmetic strategy and planning. Trivia emphasizes recall speed and category range.",
          "This category balance is one of Tasally’s core strengths. Players can choose the puzzle style that matches their current energy level while still staying inside the same trusted platform.",
        ],
      },
    ],
  },
  {
    heading: "How to Build a Daily Tasally Routine",
    paragraphs: [
      "A practical routine starts with one quick game, such as Wordle or Trivia, to warm up your attention. Then move to a deeper challenge like Connections or Crossword. Finish with either Numbers or a second word challenge for variety. This sequence takes a short amount of time but exercises different mental systems.",
      "Players who follow a daily routine often improve speed and consistency quickly. Tasally supports this by offering archives, visible progress signals, and rankings. Instead of one-off puzzle sessions, your gameplay becomes part of a measurable long-term pattern.",
      "If your goal is to find the best way to play Tasally games, the most effective strategy is consistency. Short daily sessions beat occasional long sessions for both improvement and enjoyment.",
    ],
  },
  {
    heading: "How to Play Tasally Games Efficiently",
    paragraphs: [
      "Start with one fast game to warm up, then move to one depth-oriented challenge. This keeps sessions practical while still delivering measurable progress.",
      "A reliable pattern is Wordle or Trivia first, then Connections or Mini Crossword, and finally Numbers if you want arithmetic strategy in the same routine.",
    ],
  },
  {
    heading: "Why Tasally",
    paragraphs: [
      "Tasally combines daily freshness, game variety, and one consistent platform identity. That mix gives players both immediate fun and a long-term routine they can maintain.",
      "By connecting all puzzle formats under one brand and domain, Tasally also creates stronger discoverability for users searching by game type or by brand.",
    ],
  },
  {
    heading: "Tasally Games and Brand Search",
    paragraphs: [
      "When users search for Tasally games, they are usually looking for a direct way to start playing immediately. That is why this page and related game pages keep navigation simple and links explicit. You can jump straight to each game route without extra steps.",
      "As more players search for the exact Tasally brand and click official pages, search engines receive stronger confidence that Tasally represents a distinct puzzle entity. This improves branded ranking stability and helps new players discover the platform faster.",
    ],
  },
];

export default function TasallyGamesPage() {
  return (
    <SeoContentPage
      title="Tasally Games"
      description="Tasally games combine nine daily puzzle categories into one platform for consistent brain training, repeat play, and strong puzzle variety."
      path="/tasally-games"
      intro="This page is your complete guide to Tasally games. It explains every category, how to choose what to play first, and how to build a reliable daily puzzle routine across word, logic, and knowledge challenges."
      sections={sections}
      faqs={faqs}
      relatedLinks={relatedLinks}
    />
  );
}
