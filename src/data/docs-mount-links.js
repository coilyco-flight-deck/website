// Relative markdown links inside a mounted page. Why this is a module with a
// test rather than a closure: docs/project-docs-render.md.

const LINK = /href="(?!https?:)([^"#?]+)\.md(#[^"]*)?"/g

/** Resolve a target against the directory that wrote it, as the validator does. */
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

/** Rewrite one mounted page's links; `kind` is the tree that page sits in. */
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
    // On the resolved directory, not the filename: two trees can share a slug.
    for (const tree of Object.values(trees)) {
      if (tree && tree.dir === dir && tree.slugs.has(slug)) {
        return `href="${tree.root}${slug}/${anchor}"`
      }
    }
    return `href="${source}${path}.md" rel="noreferrer"`
  })
}
