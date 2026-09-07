# Project docs sync

The [docs mount](project-docs-mount.md) used to be a hand `cp`, so it drifted
from the repositories it claims to reproduce. Indexing a drifting copy
manufactures the failure `#133` names: if a page and a repository disagree
about what a project is, the repository wins and the page is the bug.

`scripts/sync-project-docs.py` clones each source repo shallow, copies what the
exclusion list permits, and writes the stamp. `just sync-project-docs` runs it
by hand and `.forgejo/workflows/sync-project-docs.yml` daily, pushing only on
change, the pattern `sync-repo-registry.yml` already uses in `agentic-os-kai`.

Committed vendor rather than a build-time fetch, so the build stays hermetic
and offline, local dev and CI agree, and every content change arrives as a
reviewable diff. Submodules cannot express the per-file exclusion list.

The only transformation is the filename: `CONTRIBUTING.md` mounts as
`contributing.md`, because the route is the slug. Bytes are untouched.

## One place declares a mount

`src/data/docs-mounts.json` carries source, target, and exclusions per project.
It also holds the lists for repos not mounted yet, so the must-not-mount set
decided on `coilysiren/inbox#438` survives until those mounts land: planning
artifacts in agent-compose.

The stamp is generated into `src/data/docs-mount-source.json` and read where
Eleventy renders it. The manifest stays hand-written structure, so a generated
file and a reviewed one never share a path.

## Two ways a sync goes quiet

A failing run alerts Telegram, the path the test and mirror jobs already use.

A run that stops happening says nothing, so `src/docs-mount.test.ts` fails the
ordinary gate once the stamp is over 14 days old. Daily runs mean a fortnight
absorbs a paused runner without letting an unrefreshed copy pass for current.

That test also fails when the vendored files and the manifest disagree. A page
added upstream arrives with the next sync carrying no shelf, title, or reading
position until the manifest names it, which is the one-line diff it exists for.

Neither needs the Actions tab.

## Guides come from the same clone

A mount with a `guides` block vendors two directories from one shallow clone,
each into its own target, each with its own exclusion list. The stamp gains a
`guides` URL beside `docs`. A mount without the block is untouched: one
directory, one target, the same stamp it always wrote.
