import { absoluteUrl, buildBreadcrumbJsonLd, buildGameJsonLd, gameSeo } from "@/lib/seo";

const config = gameSeo.trivia;

export const metadata = {
  title: config.name + " Game",
  description: config.description,
  alternates: {
    canonical: config.path,
  },
  openGraph: {
    title: config.name + " | Ammar Times",
    description: config.description,
    url: absoluteUrl(config.path),
  },
  twitter: {
    title: config.name + " | Ammar Times",
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
