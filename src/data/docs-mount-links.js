// Rewriting the relative markdown links inside a mounted page. Lifted out of
// eleventy.config.js so the guides case can be tested directly: a wrong answer
// here emits a working link to the wrong place rather than an error, and
// nothing downstream notices. Contract: docs/project-docs-render.md.

const LINK = /href="(?!https?:)([^"#?]+)\.md(#[^"]*)?"/g

/**
 * Resolve a relative target the way the file that wrote it meant, against the
 * directory that file lives in. `check_dead_links.py` resolves the same way,
 * which is why a guide reaches reference as `../docs/<name>.md`.
 */
export const inRepo = (fromDir, target) =>
  new URL(target, `file:///${fromDir}/`).pathname.replace(/^\//, "")

/** The mounted trees of one project, keyed by the URL segment each serves. */
export const treesOf = (mount) => ({
  docs: { dir: mount.docsDir, root: mount.root, slugs: mount.slugs },
  guides: mount.guides
    ? {
        dir: mount.guides.dir,
        root: mount.guides.root,
        slugs: mount.guides.slugs,
      }
    : null,
})

/**
 * @param {string} content rendered HTML for one mounted page
 * @param {import("./docs-mount-loader.js").DocsMount} mount
 * @param {"docs"|"guides"} kind which tree the page being rendered sits in
 * @returns {string}
 */
export const rewriteMountedLinks = (content, mount, kind) => {
  const trees = treesOf(mount)
  const here = trees[kind]
  if (!here) return content
  const source = `${mount.repo}/src/branch/${mount.branch}/`
  return content.replace(LINK, (whole, target, anchor = "") => {
    const path = inRepo(here.dir, target)
    const cut = path.lastIndexOf("/")
    const dir = cut === -1 ? "" : path.slice(0, cut)
    const slug = path.slice(cut + 1).toLowerCase()
    // Matched on the directory the link resolves into, not on the filename
    // alone: two trees can hold the same slug, and only one of them is meant.
    for (const tree of Object.values(trees)) {
      if (tree && tree.dir === dir && tree.slugs.has(slug)) {
        return `href="${tree.root}${slug}/${anchor}"`
      }
    }
    return `href="${source}${path}.md" rel="noreferrer"`
  })
}
