import { absoluteUrl, buildBreadcrumbJsonLd, buildGameJsonLd, gameSeo } from "@/lib/seo";

const config = gameSeo.waffle;

export const metadata = {
  title: `Tasally ${config.name} — Daily Letter Swap Puzzle`,
  description: config.description,
  alternates: {
    canonical: config.path,
    languages: {
      en: config.path,
      ar: "/العاب-تسالي",
    },
  },
  keywords: config.keywords,
  openGraph: {
    title: `Tasally ${config.name} — Daily Letter Swap Puzzle`,
    description: config.description,
    url: absoluteUrl(config.path),
  },
  twitter: {
    card: "summary_large_image",
    title: `Tasally ${config.name} — Daily Letter Swap Puzzle`,
    description: config.description,
  },
};

export default function Layout({ children }) {
  const gameJsonLd = buildGameJsonLd(config);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Games", path: "/games" },
    { name: config.name, path: config.path },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
