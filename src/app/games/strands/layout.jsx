import { absoluteUrl, buildBreadcrumbJsonLd, buildGameJsonLd, gameSeo } from "@/lib/seo";

const config = gameSeo.strands;

export const metadata = {
  title: `Play ${config.name} Free Online`,
  description: config.description,
  alternates: {
    canonical: config.path,
  },
  keywords: config.keywords,
  openGraph: {
    title: `Play ${config.name} Free Online | Tasally`,
    description: config.description,
    url: absoluteUrl(config.path),
  },
  twitter: {
    card: "summary_large_image",
    title: `Play ${config.name} Free Online | Tasally`,
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
