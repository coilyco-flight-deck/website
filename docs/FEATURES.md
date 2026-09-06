# Features

Baseline inventory of what `coilyco-flight-deck/website`
([www.coilysiren.me](https://www.coilysiren.me)) ships today. Update a section when a
feature is added, removed, or reshaped, so the diff shows scope drift.

## What ships

- **Stack** - Eleventy, Nunjucks, Markdown, and Sass, output as locally served
  core HTML, CSS, and fonts without a framework runtime or hydration. See [the
  stack](stack.md).
- **Homepage demos** - self-hosted clips of agent sessions sit below the
  shipped products: Gem's cut of Sprite and Vera untangling a shadowed PATH,
  and the terminal-splitting beaver. Each plays once it scrolls into view and
  loads nothing before that. They replaced the Temporal Vibe Check YouTube
  embed, so the site reaches no third-party origin at all.
- **Image weight budget** - every deferred image carries its intrinsic
  dimensions from the file header at build time, so the reserved box makes
  `loading="lazy"` actually defer. `/about/` went from 35MB to about 1MB, and
  `cypress/e2e/weight.cy.ts` holds a per-route transfer ceiling that only ever
  moves down.
- **Brand palette** - every structural colour sits on one hue in OKLCH, and
  leaves it only where the meaning is locked to a hue: a refusal, a cost, a
  grant. Variety comes from lightness rather than hue, which is what the
  section caps and the `/404` recovery tiles now use. Derivation, the audit
  that preceded it, and the focus-ring contrast defect it closed:
  [brand](brand.md).
- **Pages** - route-by-route inventory in [site pages](pages.md).
- **Project pages** - one page per headline project at `/projects/<name>/`,
  carrying its own visual system rather than the site's page chrome because
  these are headed for standalone domains. `umbra`, `agent-compose`,
  `mcp-beaver`, and `housecast` are live. Each
  emits `SoftwareSourceCode` structured data whose author points at the
  homepage `Person`, and they share one shared stack chain from
  `src/data/stack.js`. See [project pages](project-pages.md).
- **Vanity project hosts** - each project page also renders under
  `<slug>.coilyco.ai` with project chrome instead of the site's, proxied by a
  Netlify rewrite so the vanity name stays in the address bar. The twin keeps
  the canonical of the page it mirrors, so the hosts do not split search
  authority and the sitemap names each URL once. See
  [vanity hosts](vanity-hosts.md).
- **Project docs mount** - a project's own `docs/` mounted verbatim under its
  page, with the section tree, reading order, and prev and next all derived
  from one manifest, re-vendored daily from the source repository by
  `sync-project-docs`. umbra, agent-compose, mcp-beaver, and housecast are
  mounted, and the pages are indexed. See [the mount](project-docs-mount.md)
  and [its sync](project-docs-sync.md).
- **Discovery metadata** - one canonical host across tags, sitemap, `robots.txt`
  and `llms.txt`, a `sitemap.xml` generated from the indexable routes, and
  `Person` structured data on the homepage and About page. See [static
  generation](static-generation.md).
- **Post promotion** - `promoted: true` on a post drives its `/writing/`
  listing, its `robots`, its sitemap entry, the Atom feed, and the syndication
  allowlist from one key. Posts are dark by default. Promoted posts carry
  `BlogPosting` structured data and a machine-readable date. See [site
  pages](pages.md).
- **Atom feed** - `/feed.xml` carries the promoted posts and is advertised
  site-wide for autodiscovery. No feed plugin and no new dependency. See
  [static generation](static-generation.md).
- **Social card** - a committed 1200x630 default `og:image` with a per-page
  override, so link previews render as a card rather than bare text. No
  generator and no build step. See [social card](social-card.md).
- **Templates and data** - layouts, includes, and data files in
  [templates and data](templates.md).
- **Build scripts** - `build-resume.py` renders the printable resume and
  `clean-output.mjs` clears stale output, both under [scripts/](../scripts/).
- **CI workflows** - every workflow and its trigger in
  [CI workflows](ci-workflows.md).

## Tests, deploy, baseline

- **Tests** - build-output contracts run browser-free under vitest, and
  Cypress covers the invariants that need a real browser: layout, and an
  `axe-core` pass over every emitted route. What is asserted, and what is
  deliberately not, in [verification](verification.md). Accessibility has its
  own page: [accessibility](accessibility.md). A transfer budget per route
  guards the site's no-framework, locally-served shape.
- **Deploy** - how a merge reaches production: [deploy](deploy.md).
- **Managed pre-commit block** from agentic-os plus a local offline
  `trufflehog` hook.

## See also

- [README.md](../README.md) - human-facing intro and local-dev quickstart.
- [staging.md](staging.md) - staging image boundary and local verification.
- [AGENTS.md](../AGENTS.md) - agent-facing operating rules.
- [justfile](../justfile) - dev verbs.
- [.ward/ward.yaml](../.ward/ward.yaml) - catalog metadata only.

Cross-reference convention from [coilyco-bridge/agentic-os-kai#313](https://github.com/coilyco-bridge/agentic-os-kai/issues/313).
