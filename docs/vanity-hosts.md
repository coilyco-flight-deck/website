# The coilyco.ai vanity hosts

How a project page reaches its `coilyco.ai` host. The short form is canon in
URLs, so the hosts are `umbra`, `acompose` and `beaver` while the project slugs
behind them stay `umbra`, `agent-compose` and `mcp-beaver`. Only the `from`
hostname differs; the rewrite target is still `/vanity/<slug>/`. The page itself is described in [project-page-system.md](project-page-system.md).

Each project page renders twice. `site.projectVariants` drives a two-item
pagination, so the canonical output stays at `/projects/<slug>/` and a twin
lands at `/vanity/<slug>/`. `base.njk` picks `nav-vanity.njk` and
`footer-vanity.njk` when `variant` is `vanity`, so the vanity host wears the
project rather than the site: the brand is the project and its claim, and every
link out is absolute, because that chrome is served under a hostname this site
does not own.

## The vanity host is canon

**A project is canonical on its own vanity host, at the short path.** So
`https://acompose.coilyco.ai/` is the canonical URL for agent-compose,
`https://acompose.coilyco.ai/docs/architecture/` for one of its docs pages, and
the `www.coilysiren.me/projects/agent-compose/...` copies carry a canonical tag
pointing at them. `sitemap.njk` and `llms.txt` name the vanity URL.

This reverses the earlier arrangement, in which every page pointed its canonical
at `www` and the vanity hosts existed only as chrome. That is what
[coilysiren/website#133](https://forgejo.coilysiren.me/coilyco-flight-deck/website/issues/133)
decided and it no longer holds for project pages: a project's identity is its
own name, and the URL a reader is handed should be the one search agrees is the
page. `#133`'s single-authority principle survives intact, because there is
still exactly one canonical URL per page. Only which host holds it moved.

`src/data/vanity-hosts.js` owns the map and derives the URL, so the canonical
tag, `og:url`, the JSON-LD, the sitemap and `llms.txt` all read from one place.
The twin is still skipped in the sitemap, now because it carries the same
canonical as the page it mirrors rather than because it defers to `www`.

**A canonical has to point at a 200, never a redirect**, which is what makes the
routing part of this rather than a tag change. Every path a canonical claims is
served by its host: the bare host serves the project page, `/docs/*` serves the
mounted reference, and `/guides/*` serves the guides tree where one is mounted.
`src/vanity-hosts.test.ts` asserts the map and `netlify.toml` against each
other, because a canonical pointing at a 301 is worse than no canonical and
neither file fails loudly on its own.

`netlify.toml` carries eight rules per host and their order is load-bearing,
because Netlify takes the first match. Shared assets pass through first,
`/fonts/*` among them, which is invisible in the HTML and reachable only from
`url()` inside `site.css`, and `/docs-rail.js`, which the docs pages request and
which sits under no asset directory. Then the short paths the canonicals name.
Then the bare host. The catch-all 301 to `www.coilysiren.me` stays last, so
anything the project does not own leaves for the main site instead of 404ing.

That assumption is no longer untested. The worry was that Netlify redirects
non-primary domains to the primary by default, `force = true` being documented
as overriding file shadowing rather than that redirect, so an alias 301'd before
the rewrite runs would never keep its vanity name. **It keeps it.** Measured
2026-09-06 against all three live hosts:

```
umbra.coilyco.ai      200, 0 redirects
acompose.coilyco.ai   200, 0 redirects
beaver.coilyco.ai     200, 0 redirects
```

Each serves the twin under its own hostname, carrying
`<meta name="robots" content="follow, index">` and a canonical to its
`https://www.coilysiren.me/projects/<slug>/` page. Both renamed hosts reach
their short form in exactly one hop.

`index` alongside a cross-domain canonical is the pairing this wants, and
`noindex` would have been the wrong reach: the two directives contradict, and
resolving that in favour of `noindex` can carry it to the canonical target.

**What stays unmeasured is the other half.** A cross-domain canonical is a hint
rather than a directive, and there is no Search Console property for
`coilyco.ai`, so nothing reports whether Google honours these. That it can
decline one is not hypothetical here: `website.coilysiren.me` carries a correct
canonical to `www` and Google indexes the alternate host anyway
(`teable:coilyco-flight-deck/website#7071`). Verification is tracked at
`teable:coilyco-flight-deck/infrastructure#7073`.

## Renamed hosts

`agent-compose.coilyco.ai` and `mcp-beaver.coilyco.ai` were the launch names and
were renamed the same day. They still resolve and still hold a certificate,
because the guarded Netlify wrap can add an alias but not remove one, so each
forwards to its short form with a single 301 rather than sitting on the site
root. An empty splat resolves to the bare host, which is why one rule covers the
root and every path beneath it.
