// The guides tree, mounted the way docs.11tydata.js mounts reference. Kept as
// its own data file rather than a branch inside that one, because Eleventy
// cascades per directory and the two trees are separate directories on both
// sides. Why the split exists at all: docs/project-docs-render.md.
import { docsMounts } from "../../data/docs-mount-loader.js"
import { projectCard } from "../../data/project-cards.js"

const projectOf = (data) => data.page.filePathStem.split("/").at(-2)
const treeOf = (data) => docsMounts[projectOf(data)]?.guides
const entryOf = (data) =>
  treeOf(data)?.flat.find((page) => page.slug === data.page.fileSlug)

export default {
  layout: "layouts/docs.njk",
  robots: "follow, index",
  eleventyComputed: {
    project: projectOf,
    // The layout reads shelves and source off `mount`, so it is handed the
    // guides tree wearing the mount's stamp rather than a second layout.
    mount: (data) => {
      const m = docsMounts[projectOf(data)]
      return m?.guides ? { ...m, ...m.guides, root: m.guides.root } : m
    },
    mountRoot: (data) => treeOf(data)?.root,
    mountLabel: "Guides",
    mountKind: "guides",
    projectPage: (data) => `/projects/${projectOf(data)}/`,
    ogImage: (data) => projectCard(projectOf(data))?.image,
    ogImageAlt: (data) => projectCard(projectOf(data))?.alt,
    docSlug: (data) => data.page.fileSlug,
    entry: entryOf,
    title: (data) =>
      `${entryOf(data)?.title ?? data.page.fileSlug}, ${projectOf(data)} guides | Kai Ase Siren`,
    description: (data) => entryOf(data)?.blurb,
    permalink: (data) =>
      `projects/${projectOf(data)}/guides/${data.page.fileSlug}/index.html`,
    canonical: (data) =>
      `/projects/${projectOf(data)}/guides/${data.page.fileSlug}/`,
    docsSchema: (data) => ({
      headline: entryOf(data)?.title ?? data.page.fileSlug,
      shelf: entryOf(data)?.shelf,
      slug: data.page.fileSlug,
    }),
    position: (data) => {
      const flat = treeOf(data)?.flat ?? []
      const at = flat.findIndex((page) => page.slug === data.page.fileSlug)
      return {
        prev: at > 0 ? flat[at - 1] : null,
        next: at > -1 && at < flat.length - 1 ? flat[at + 1] : null,
      }
    },
  },
}
