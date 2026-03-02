import Link from 'next/link';
import { homeFaqs } from '@/content/faqs';

export default function HomeFaqSection() {
  return (
    <section className="border-t border-[hsl(var(--border))] px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">FAQ</h2>
          <Link
            href="/faq"
            className="text-sm font-medium text-[hsl(var(--accent))] underline-offset-4 hover:underline"
          >
            See all FAQs
          </Link>
        </div>

        <div className="space-y-2">
          {homeFaqs.map((faq) => (
            <details key={faq.question} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-[hsl(var(--foreground))]">
                {faq.question}
              </summary>
              <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
