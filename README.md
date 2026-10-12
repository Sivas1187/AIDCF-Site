# AIDCF website

Source for [aidcf.org](https://aidcf.org), the public website of the **AI Data Centre Facilities Assurance Framework (AIDCF)**.

The framework itself lives in [Sivas1187/AIDCF](https://github.com/Sivas1187/AIDCF), which is the canonical source. This site explains the framework and lets a reader explore the synthetic reference case. It does not hold any framework content of its own.

## How the content stays honest

- **Generated, not copied.** Every count, name, gate, decision state and synthetic-case result on the site comes from `src/data/*.json`. Those files are written by `scripts/build-content.mjs` from the AIDCF repository.
- **Pinned to a commit.** `source.json` names the AIDCF release and the exact commit. The content script reads every file from git at that commit, never from the working tree, and CI fails if `src/data/` no longer matches it.
- **Hashed.** `src/data/manifest.json` records the SHA-256 of every source file used. The whitepaper PDF hash is shown on the site.
- **Status from the source.** The repository status, the proposed state of registry v1.1, the validation counts and the conformance results are read from the AIDCF files. A few status sentences have no source file to read (whether a pilot host, expert panel or inter-rater trial exists yet). Those are written in `src/app/page.tsx` and must be updated by hand when the situation changes.

## Pages

| Path | Content |
|---|---|
| `/` | Problem, simplified assurance chain, doctrine, decision states, 15 domains, 15 critical gates, synthetic-case summary, validation status, research and citation, about |
| `/case/` | The AIDCF-015 v1.3 synthetic case: decision question, interactive dependency graph with five failure scenarios, gate results and the computed decision |
| `/privacy/` | Privacy notice (no analytics, no cookies) |
| `/accessibility/` | Accessibility statement (target WCAG 2.2 AA) |

## Working on the site

Requires Node 22 and a checkout of the AIDCF repository.

```bash
npm ci
git clone https://github.com/Sivas1187/AIDCF ../aidcf   # full history; any branch

npm run content        # regenerate src/data/ from ../aidcf (or set AIDCF_SRC)
npm run dev            # local preview at http://localhost:3000
npm run build          # static export to out/, then CSP and _headers
npm run check:site     # links, anchors, metadata, pinned files, headline figures
```

To move the site to a new AIDCF release or commit, `git -C ../aidcf pull`, edit the commit in `source.json`, run `npm run content`, review the diff in `src/data/`, and commit both together.

## Checks

CI (`.github/workflows/ci.yml`) runs on every push:

1. the generated content matches the pinned AIDCF commit;
2. TypeScript type check;
3. static build;
4. link, anchor, metadata and pinned-file checks;
5. browser QA with Chromium (`scripts/qa.mjs`): an axe-core WCAG 2.x A/AA scan in light and dark mode at desktop and phone widths, a horizontal-overflow check, scripted use of the case explorer, and a pass with the Content-Security-Policy enforced.

## Security

The site is plain static files: no server code, database, forms, cookies, analytics or third-party scripts.

- `scripts/postbuild.mjs` adds a Content-Security-Policy to every page that allows only the site's own scripts and the hashed inline bootstrap scripts.
- It also writes `out/_headers` for Cloudflare Pages with HSTS, `X-Frame-Options`, `frame-ancestors 'none'`, `nosniff`, a referrer policy and a permissions policy.

## Deploying on Cloudflare

The site deploys as a Cloudflare Worker that serves the static files in `out/` (Workers static assets). `wrangler.jsonc` declares this, so Cloudflare does not try to convert the project into a server-rendered Next.js app.

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository** → select this repository.
2. Build settings:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Root directory: `/`
3. Every push to `main` builds and deploys to the `*.workers.dev` address. Review the site there first.
4. When ready, open the Worker → **Settings** → **Domains & Routes** → **Add** → **Custom domain**, and add `aidcf.org`. Add `www.aidcf.org` the same way, then create a redirect rule (**Rules** → **Redirect Rules**, "Redirect from WWW to root" template) so `www` sends visitors to `https://aidcf.org` with a 301.

`out/_headers` supplies the security headers, and `not_found_handling` serves the site's 404 page.

## Licence

Site code is Apache 2.0. Site text and the generated content in `src/data/` are CC BY 4.0. See [LICENSE](LICENSE).
