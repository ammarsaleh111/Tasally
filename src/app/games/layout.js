import { absoluteUrl, siteDescription } from "@/lib/seo";

export const metadata = {
  title: "Tasally Games — Daily Puzzle & Brain Challenges",
  description:
    "Browse all Tasally daily puzzle games including Wordle, Connections, Mini Crossword, Numbers, Trivia, Strands, Waffle, Combinations, and Spelling Bee.",
  alternates: {
    canonical: "/games",
    languages: {
      en: "/games",
      ar: "/العاب-تسالي",
    },
  },
  openGraph: {
    title: "Tasally Games — Daily Puzzle & Brain Challenges",
    description:
      "Play daily puzzle games from one hub: word games, number puzzles, trivia, and more.",
    url: absoluteUrl("/games"),
  },
  twitter: {
    title: "Tasally Games — Daily Puzzle & Brain Challenges",
    description: siteDescription,
  },
};

export default function GamesLayout({ children }) {
  return children;
}

