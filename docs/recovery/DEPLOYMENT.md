# Deployment

Netlify's repository configuration uses Node.js 22, `npm run build`, the `.next` output, and the Next.js runtime adapter. The builds and production smoke tests in this report ran locally. The deployed environment variable scopes, remote database connectivity, adapter output, redirects, and both live domains still require verification.

The cloud proxy returned HTTP 403 during the CONNECT request to both `tasally.tech` and `tasally.netlify.app`. The saved draft requests both sites and `api.github.com` in its restricted egress list. In environment settings, review and save the draft and publish the development environment. Then repeat the live checks with the resulting access.

The Git recovery branch is `fix/cloud-production-recovery`. The scoped Git proxy allowed a fast-forward of the existing PR #2 branch from its original database fix to the recovery commits. The GitHub API origin blocked draft-PR creation via `gh`. The public GitHub workflow pages provide CI status. [PR #2](https://github.com/ammarsaleh111/Tasally/pull/2) [Recovery branch comparison](https://github.com/ammarsaleh111/Tasally/compare/master...fix/cloud-production-recovery)
