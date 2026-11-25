# Rollback

For local development, switch back to the prior checkout or revert the relevant recovery commit on a new branch. The local PostgreSQL container and runtime data live separately from tracked application files. Keep them when investigating an issue so comparisons use the same fixtures.

For a future Netlify release, identify the verified prior deploy and use Netlify's deploy rollback mechanism. Record the chosen deploy and retest the custom domain and the Netlify subdomain, including the health endpoint, JavaScript MIME type, sign-in, and daily puzzle access. If a worker update was deployed, verify a fresh session and a session with the previous worker installed.

The cloud recovery uses disposable test SQL. Production migrations require their own forward recovery plan, a verified backup, and a Neon branch rehearsal before release. Preserve accounts, results, and migrations during a code rollback.
