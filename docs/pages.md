# Site pages

What each route renders and where its source lives.

Page templates live at the root of [src/](../src/). Markdown content remains
under [src/pages/](../src/pages/) so the resume keeps its canonical source.

- **`index.njk`** - project-first home. It leads with Kai's platform thesis,
  then presents the Temporal Vibe Check in a responsive YouTube player before
  the shipped product cards. The player is lazy, so its resources load outside
  the core rendering path. Public repository cards point at their GitHub mirrors
  for sturdy public access. The homepage ends after the products rather than
  repeating Writing and hiring calls to action.
- **`about.njk`** - canonical About page pairing its concise bio opening with a
  single portrait, followed by the visual autobiography and themed collections.
- **`resume.md`** - canonical semantic resume source for both the public page
  and the generated PDF.
- **`cool-people.md`** - unlisted links page celebrating people whose work and
  communities have crossed paths with Kai.
- **`hiring.njk`** - recruiting surface linked from the primary
  navigation. It is a project-free information reference covering Kai's
  strongest role shapes, practical constraints, recruiter context, interview
  boundaries, and how she frames a short resume. The tenure section states the
  benchmark and offers the detail in conversation rather than explaining any
  departure, which `lore-self-capacity-and-tenure` keeps off a public surface.
- **`writing.njk`** - date-ordered listing of the promoted posts, and
  indexable. It is still unlinked from the homepage, which issue #98 owns.
- **`coilysiren-personal-gmail-privacy.md`** - privacy and contact notice for the `coilysiren-personal-gmail` OAuth client.
- **`404.njk`** - a fully designed not-found recovery page that preserves the
  real 404 response while carrying the homepage's visual system into clear
  routes to the About, Hiring, and Resume pages.
- **`posts/`** - long-form posts. A post is dark by default and joins the
  public set only by carrying `promoted: true` in its front matter, which
  drives listing, `robots`, the sitemap, and the syndication allowlist from one
  key. Unpromoted posts stay at their URLs and stay `noindex, nofollow`.
- **`projects/`** - one page per headline project, indexable and each declaring
  its own `canonical`. They deliberately do not inherit the site's page chrome:
  the layer is headed for standalone project domains, so matching
  coilysiren.me is not a requirement. `projects/umbra.njk` set the format, and
  `agent-compose` and `mcp-beaver` follow it.
