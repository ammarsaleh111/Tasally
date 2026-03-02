import HomePageClient from "./HomePageClient";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildSoftwareAppJsonLd,
  buildWebPageJsonLd,
  siteDescription,
} from "@/lib/seo";
import { homeFaqs } from "@/content/faqs";

export const metadata = {
  title: "Tasally (تسالي) — Daily Wordle, Connections & Mini Crossword Games",
  description:
    "Play Tasally daily puzzle games free: Wordle-style, Connections-style, Mini Crossword, Numbers Game, and Daily Trivia. Fresh challenges every day.",
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      ar: "/تسالي",
      "x-default": "/",
    },
  },
  openGraph: {
    title: "Tasally (تسالي) — Daily Wordle, Connections & Mini Crossword Games",
    description:
      "Play free daily puzzle games on Tasally including Wordle, Connections, Mini Crossword, Numbers, and Trivia.",
    url: absoluteUrl("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Tasally (تسالي) — Daily Wordle, Connections & Mini Crossword Games",
    description:
      "Play free daily puzzle games on Tasally including Wordle, Connections, Mini Crossword, Numbers, and Trivia.",
  },
};

export default function HomePage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([{ name: "Home", path: "/" }]);
  const softwareAppJsonLd = buildSoftwareAppJsonLd();
  const faqJsonLd = buildFaqJsonLd(homeFaqs);
  const webPageJsonLd = buildWebPageJsonLd({
    name: "Tasally Home",
    description: siteDescription,
    path: "/",
    inLanguage: "en",
  });
  const homePageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tasally — Free Daily Puzzle & Brain Games Online",
    description: siteDescription,
    url: absoluteUrl("/"),
    about: [
      "Word games",
      "Crossword puzzles",
      "Trivia quizzes",
      "Math puzzles",
      "Daily brain challenges",
      "Spelling Bee",
      "Word search",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <HomePageClient />
    </>
  );
}

