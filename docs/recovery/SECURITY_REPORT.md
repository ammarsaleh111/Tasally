# Security Report

- Legacy player deletion now requires a valid admin session. The local regression test checks that an anonymous request receives HTTP 401.
- A linked identity is available only through its authenticated account. Cookie-based resolution accepts unlinked guest identities, which preserves guest play and account linking.
- Result posts carry a scoped identity binding when available. The APIs check it against the active request, and both offline replay paths require a matching owner. Previous unowned client entries are retained locally without automatic submission. Unowned worker entries expire under the existing seven-day policy. The RSC cache now follows the public page allowlist.
- The additional service-worker test verifies that logged-out, different-owner, and unowned entries are held and that a matching entry is sent. The owner key is scoped to the app session and stored as JSON so startup sanitation preserves it. Browser coverage of upgrades, account switching, and the full offline matrix is tracked in the test report.

Remaining review includes ownership of legacy profile and activity writes, guest identity credential design, cross-tab retry idempotency for non-daily results, and successful administrator login and Google OAuth in an appropriately configured environment.

The initial `npm audit --omit=dev` reported 15 findings, including five classified critical. The recovery branch updated Next.js, Auth.js, Drizzle, bcrypt, Zod, and the affected source-map dependency. A repeat production dependency audit reported zero vulnerabilities. Next.js 16.4.6 exposed a Unicode prerender segment bug. The Arabic public URLs use encoded rewrites to ASCII prerender paths, and the Arabic FAQ retains a redirect to `/faq`.
