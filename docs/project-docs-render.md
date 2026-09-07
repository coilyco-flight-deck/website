# Project docs render

How a mount declared in [`docs-mounts.json`](../src/data/docs-mounts.json)
becomes pages. The [mount contract](project-docs-mount.md) covers what is
mounted and why; this covers the code that renders it.

Nothing in the render layer names a project. That was the state until
`coilysiren/website#136`, when adding a second mount meant editing five files.

## Adding a mount

Three steps, and none of them is a template or a route list.

1. An entry in `src/data/docs-mounts.json`, which the sync and the render layer
   both read.
2. `src/data/docs-manifest-<project>.js`, exporting `shelves` and the front
   door's `front` copy.
3. One import line in `src/data/docs-mount-routes.js`, because
   `cypress/routes.ts` pulls that file into a browser bundle whose bundler
   rejects top-level await, so those manifests cannot be resolved by name.

`src/docs-mount.test.ts` fails if a declared mount has no manifest, so a missed
step is a test failure rather than a broken page.

## Adding a guides tree

A project's `guides/` is a second, optional tree beside `docs/`. Upstream they
are separate types with separate caps, counted independently, and this side
keeps that split rather than folding guides into the docs shelf. A repo that
declares no guides mounts exactly as it did before the type existed.

Four steps, mirroring the three above:

1. A `guides` block on that project's entry in `src/data/docs-mounts.json`,
   naming `dir` and `target`.
2. `src/data/guides-manifest-<project>.js`, the same `shelves` and `front`
   shape as a docs manifest.
3. One import line and one `guideManifests` entry in
   `src/data/docs-mount-routes.js`, for the bundler reason above.
4. `just sync-project-docs`, which vendors every declared tree of a mount from
   the one clone.

`GUIDES_ROUTES` feeds `cypress/routes.ts` and `src/build-output.test.ts` the
way `DOCS_ROUTES` does, so a mounted guide is swept for accessibility and named
in the sitemap without a second list to keep.

## Cross-links between the two trees

`check_dead_links.py` resolves a relative link against the file's own
directory, so a guide reaches reference as `../docs/<name>.md` and a docs page
reaches a guide as `../guides/<name>.md`. `rewriteMountedLinks` in
`src/data/docs-mount-links.js` resolves that hop and sends the link to whichever
tree actually serves it.

That function is a module with its own test rather than a closure in
`eleventy.config.js`, because its failure is silent: matching on the filename
alone still emits a working link, just to the source repository or to the wrong
tree's page of the same name. Nothing downstream reports it, so the negative
cases are asserted instead.

## The manifest is the structure

`documentation-layout` permits `docs/*.md` with no subdirectories, so a repo
cannot express sections as folders and alphabetical order is the only order a
reader gets. mdBook answers the same constraint with `SUMMARY.md`, and
`src/data/docs-manifest-<project>.js` is that file, one per mount.

The section tree, the reading order, the sidebar, the front door, and prev and
next all derive from it. Adding a page is a one-line reviewable diff rather
than an accident of alphabetisation. Shelves are reader-task rather than
architecture: getting started, guides, reference, concepts, contributing.

Blurbs are lifted verbatim from the project's own `docs/index.md`, so the shelf
never invents a second description of a page.

## Where the project comes from

* **Doc pages** - `src/projects/docs/docs.11tydata.js` reads it from the path.
  Eleventy cascades a directory's data into its subdirectories, so every mount
  lives under `src/projects/docs/<project>/` and needs no data file of its own.
* **Front doors** - virtual templates registered in `eleventy.config.js`, one
  per mount, sharing `_includes/components/docs-front.njk`.
* **Link rewriting** - the `mountedDocLinks` transform reads the project out of
  the page URL, then resolves the source repo and the mounted slug set from
  that mount rather than from a closed-over constant.
* **Routes** - `src/data/docs-mount-routes.js` derives every emitted route from
  the manifests, so `cypress/routes.ts` cannot fall behind a sync.

## Two shapes that did not work

**Pagination for the front doors.** The obvious way to render one page per
mount, and only its first page reached `collections.all`. A second mount's
front door built correctly, carried the right canonical, and was missing from
the sitemap. Virtual templates have no such gap.

**Top-level await in the route module.** `cypress/routes.ts` imports it into a
browser bundle, and that bundler rejects top-level await, so the manifests
cannot be resolved by name there the way `docs-mount-loader.js` resolves them
on the Node side. Hence the one import line per mount.
