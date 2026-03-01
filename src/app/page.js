import Link from "next/link";
import HomePageClient from "./HomePageClient";
import { absoluteUrl, buildBreadcrumbJsonLd, buildSoftwareAppJsonLd, siteDescription } from "@/lib/seo";

export const metadata = {
  title: "Free Daily Puzzle & Brain Games Online",
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Tasally — Free Daily Puzzle & Brain Games Online",
    description: siteDescription,
    url: absoluteUrl("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Tasally — Free Daily Puzzle & Brain Games Online",
    description: siteDescription,
  },
};

export default function HomePage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([{ name: "Home", path: "/" }]);
  const softwareAppJsonLd = buildSoftwareAppJsonLd();
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
      <HomePageClient />
    </>
  );
}

