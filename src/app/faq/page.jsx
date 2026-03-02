import Link from "next/link";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo";
import { fullFaqItems, fullFaqSections } from "@/content/faqs";

export const metadata = {
  title: "Tasally FAQ — تسالي الأسئلة الشائعة",
  description:
    "Browse Tasally FAQs for brand, Wordle-like, Connections, Mini Crossword, Numbers, Trivia, and bilingual English/Arabic guidance.",
  alternates: {
    canonical: "/faq",
    languages: {
      en: "/faq",
      ar: "/الأسئلة-الشائعة",
      "x-default": "/faq",
    },
  },
  openGraph: {
    title: "Tasally FAQ — تسالي الأسئلة الشائعة",
    description:
      "All Tasally FAQs in one place, including game-specific questions and Arabic/English sections.",
    url: absoluteUrl("/faq"),
  },
};

export default function FaqPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "FAQ", path: "/faq" },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    name: "Tasally FAQ",
    description:
      "Central Tasally FAQ page with English and Arabic answers for brand and game-specific questions.",
    path: "/faq",
    inLanguage: "en",
  });

  const faqJsonLd = buildFaqJsonLd(fullFaqItems);

  const englishSections = fullFaqSections.filter((section) => section.lang === "en");
  const arabicSections = fullFaqSections.filter((section) => section.lang === "ar");

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="rounded-2xl border border-border bg-card p-6 sm:p-7">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Tasally FAQ (الأسئلة الشائعة)</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
          This page centralizes Tasally FAQ content for brand, game guidance, and bilingual support in one clean hub.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {englishSections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-md border border-border px-3 py-1.5 text-foreground hover:bg-background"
            >
              {section.title}
            </a>
          ))}
        </div>
      </header>

      <section className="mt-6 space-y-5">
        <h2 className="text-2xl font-semibold text-foreground">English Sections</h2>
        {englishSections.map((section) => (
          <article id={section.id} key={section.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h3 className="text-xl font-semibold text-foreground">{section.title}</h3>
            {section.description ? (
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{section.description}</p>
            ) : null}

            <div className="mt-4 space-y-3">
              {section.items.map((faq) => (
                <details key={faq.question} className="rounded-xl border border-border bg-background p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">{faq.question}</summary>
                  <p className="mt-2 text-sm leading-7 text-foreground/90">{faq.answer}</p>
                </details>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8 space-y-5" dir="rtl">
        <h2 className="text-2xl font-semibold text-foreground">القسم العربي</h2>
        {arabicSections.map((section) => (
          <article id={section.id} key={section.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h3 className="text-xl font-semibold text-foreground">{section.title}</h3>
            {section.description ? (
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{section.description}</p>
            ) : null}

            <div className="mt-4 space-y-3">
              {section.items.map((faq) => (
                <details key={faq.question} className="rounded-xl border border-border bg-background p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">{faq.question}</summary>
                  <p className="mt-2 text-sm leading-7 text-foreground/90">{faq.answer}</p>
                </details>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground">Quick Navigation</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link href="/" className="rounded-md border border-border px-3 py-1.5 hover:bg-background">
            Back to Home
          </Link>
          <Link href="/games" className="rounded-md border border-border px-3 py-1.5 hover:bg-background">
            Browse Games
          </Link>
        </div>
      </section>
    </main>
  );
}
