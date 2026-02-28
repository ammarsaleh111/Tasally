import Link from "next/link";
import HomePageClient from "./HomePageClient";
import { absoluteUrl, buildBreadcrumbJsonLd, siteDescription } from "@/lib/seo";

export const metadata = {
  title: "Daily Puzzle Games",
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Ammar Times | Daily Puzzle Games",
    description: siteDescription,
    url: absoluteUrl("/"),
  },
  twitter: {
    title: "Ammar Times | Daily Puzzle Games",
    description: siteDescription,
  },
};

export default function HomePage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([{ name: "Home", path: "/" }]);
  const homePageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Ammar Times Daily Puzzle Games",
    description: siteDescription,
    url: absoluteUrl("/"),
    about: [
      "Word games",
      "Crossword",
      "Trivia",
      "Math puzzle",
      "Daily puzzle challenge",
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
      <HomePageClient />
    </>
  );
}

