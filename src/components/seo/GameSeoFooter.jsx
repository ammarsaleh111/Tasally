import {
  buildFaqJsonLd,
  buildHowToJsonLd,
  buildWebPageJsonLd,
  gameSeoContent,
} from "@/lib/seo";

export default function GameSeoFooter({ gameKey, gameName, path, description }) {
  const content = gameSeoContent[gameKey];
  if (!content) return null;

  const faqJsonLd = buildFaqJsonLd(content.faqs);
  const howToJsonLd = buildHowToJsonLd({
    name: `How to play ${gameName} on Tasally`,
    description: content.intro,
    path,
    steps: content.howToSteps,
  });
  const webPageJsonLd = buildWebPageJsonLd({
    name: `Tasally ${gameName}`,
    description,
    path,
    inLanguage: "en",
  });

  return (
    <section className="mx-auto mt-8 max-w-6xl px-4 pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      <article className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <h2 className="text-xl font-semibold text-foreground">How to Play {gameName}</h2>
        <p className="mt-2 leading-7 text-foreground/90">{content.intro}</p>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground/90">
          {content.howToSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold text-foreground">{gameName} FAQ</h3>
          {content.faqs.map((faq) => (
            <details key={faq.question} className="rounded-xl border border-border bg-background p-4">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">{faq.question}</summary>
              <p className="mt-2 text-sm leading-6 text-foreground/90">{faq.answer}</p>
            </details>
          ))}
        </div>
      </article>
    </section>
  );
}
