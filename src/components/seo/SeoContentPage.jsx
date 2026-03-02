import Link from "next/link";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@/lib/seo";

export default function SeoContentPage(props) {
  const {
    title,
    description,
    path,
    language = "en",
    intro,
  } = props;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: language === "ar" ? "الرئيسية" : "Home", path: "/" },
    { name: title, path },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    name: title,
    description,
    path,
    inLanguage: language,
  });

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />

      <article className="space-y-6">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">{title}</h1>
          <p className="text-lg text-muted-foreground">{description}</p>
          <p className="text-base leading-8 text-foreground/90">{intro}</p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-2xl font-semibold text-foreground">
            {language === "ar" ? "مركز الأسئلة الشائعة" : "Central FAQ Hub"}
          </h2>
          <p className="mt-2 leading-7 text-foreground/90">
            {language === "ar"
              ? "تم تجميع الشروحات والأسئلة التفصيلية في صفحة واحدة لسهولة التصفح بدون ازدحام المحتوى."
              : "Detailed explanatory content and FAQs are centralized on one clean page to keep this route lightweight."}
          </p>
          <Link
            href="/faq"
            className="mt-4 inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background"
          >
            {language === "ar" ? "عرض جميع الأسئلة الشائعة" : "See all FAQs"}
          </Link>
        </section>

      </article>
    </main>
  );
}
