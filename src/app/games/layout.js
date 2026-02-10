import { absoluteUrl, siteDescription } from "@/lib/seo";

export const metadata = {
  title: "Games Hub",
  description:
    "Browse all Ammar Times daily puzzle games including Wordle, Connections, Mini Crossword, Numbers, Trivia, Strands, Waffle, Combinations, and Spelling Bee.",
  alternates: {
    canonical: "/games",
  },
  openGraph: {
    title: "Games Hub | Ammar Times",
    description:
      "Play daily puzzle games from one hub: word games, number puzzles, trivia, and more.",
    url: absoluteUrl("/games"),
  },
  twitter: {
    title: "Games Hub | Ammar Times",
    description: siteDescription,
  },
};

export default function GamesLayout({ children }) {
  return children;
}

