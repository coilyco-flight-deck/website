// One data file for every mounted project, because Eleventy cascades a
// directory's data down. Why that shape: docs/project-docs-render.md.
import { docsMounts } from "../../data/docs-mount-loader.js"
import { projectCard } from "../../data/project-cards.js"

const projectOf = (data) => data.page.filePathStem.split("/").at(-2)
const entryOf = (data) =>
  docsMounts[projectOf(data)]?.flat.find(
    (page) => page.slug === data.page.fileSlug
  )

export default {
  layout: "layouts/docs.njk",
  robots: "follow, index",
  eleventyComputed: {
    // Vendored verbatim, so nothing here adds front matter to the source
    // files. Title, shelf, and position come from the manifest by filename.
    project: projectOf,
    mount: (data) => docsMounts[projectOf(data)],
    // Named rather than hardcoded in the layout, so the guides tree reuses it.
    mountRoot: (data) => `/projects/${projectOf(data)}/docs/`,
    mountLabel: "Docs",
    mountKind: "docs",
    projectPage: (data) => `/projects/${projectOf(data)}/`,
    // A docs page shares its project's social card, so a link to one previews
    // as that project rather than as the site.
    ogImage: (data) => projectCard(projectOf(data))?.image,
    ogImageAlt: (data) => projectCard(projectOf(data))?.alt,
    docSlug: (data) => data.page.fileSlug,
    entry: entryOf,
    title: (data) =>
      `${entryOf(data)?.title ?? data.page.fileSlug}, ${projectOf(data)} docs | Kai Ase Siren`,
    // The blurb is Kai's own line from the project's own index, so the meta
    // description is lifted rather than written a second time.
    description: (data) => entryOf(data)?.blurb,
    permalink: (data) =>
      `projects/${projectOf(data)}/docs/${data.page.fileSlug}/index.html`,
    canonical: (data) =>
      `/projects/${projectOf(data)}/docs/${data.page.fileSlug}/`,
    // Identical bytes sit on two git hosts, so this copy carries the frame
    // they cannot: the project it belongs to and where it sits in the order.
    docsSchema: (data) => ({
      headline: entryOf(data)?.title ?? data.page.fileSlug,
      shelf: entryOf(data)?.shelf,
      slug: data.page.fileSlug,
    }),
    position: (data) => {
      const flat = docsMounts[projectOf(data)]?.flat ?? []
      const at = flat.findIndex((page) => page.slug === data.page.fileSlug)
      return {
        prev: at > 0 ? flat[at - 1] : null,
        next: at > -1 && at < flat.length - 1 ? flat[at + 1] : null,
      }
    },
  },
}
