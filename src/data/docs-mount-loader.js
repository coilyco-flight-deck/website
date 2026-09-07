// Everything the render layer knows about a mounted project, resolved from
// `docs-mounts.json`. Adding one is an entry there plus its manifest, with no
// code change here. How it renders: docs/project-docs-render.md.
/**
 * @typedef {object} DocsShelf
 * @property {string} title
 * @property {DocsMountPage[]} pages
 */

/**
 * @typedef {object} DocsFront
 * @property {string} headline
 * @property {string} description
 * @property {string[]} lede
 * @property {string} caseStudy
 */

/**
 * @typedef {object} DocsStamp
 * @property {string} repo
 * @property {string} docs
 * @property {string} commit
 * @property {string} date
 * @property {string} syncedAt
 */

/**
 * @typedef {object} DocsMountPage
 * @property {string} slug
 * @property {string} title
 * @property {string} blurb
 * @property {string} shelf
 */

/**
 * @typedef {object} DocsShelf
 * @property {string} title
 * @property {DocsMountPage[]} pages
 */

/**
 * @typedef {object} DocsFront
 * @property {string} headline
 * @property {string} description
 * @property {string[]} lede
 * @property {string} caseStudy
 */

/**
 * @typedef {object} DocsStamp
 * @property {string} repo
 * @property {string} docs
 * @property {string} commit
 * @property {string} date
 * @property {string} syncedAt
 */

/**
 * @typedef {object} DocsMount
 * @property {string} project
 * @property {string} page Route of the project's case study.
 * @property {string} root Route of the docs front door.
 * @property {string} repo
 * @property {string} branch
 * @property {string} docsDir
 * @property {string} target
 * @property {DocsShelf[]} shelves
 * @property {DocsFront} front
 * @property {DocsMountPage[]} flat
 * @property {Set<string>} slugs
 * @property {DocsStamp} source
 * @property {DocsTree|null} guides Present only where the source repo opted in.
 */

/**
 * @typedef {object} DocsTree
 * @property {string} dir Directory in the source repo.
 * @property {string} target
 * @property {string} root Route this tree serves.
 * @property {DocsShelf[]} shelves
 * @property {DocsFront} front
 * @property {DocsMountPage[]} flat
 * @property {Set<string>} slugs
 */

import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const config = require("./docs-mounts.json")
const stamp = require("./docs-mount-source.json")

/** Flat reading order, which is what prev and next walk. */
const flatten = (shelves) =>
  shelves.flatMap((shelf) =>
    shelf.pages.map((page) => ({ ...page, shelf: shelf.title }))
  )

// Found by name rather than through a registry, so nothing central changes.
// No `guides` block means guides is null, and nothing reads it.
const loadTree = async (mount, spec) => {
  const { shelves, front } = await import(
    `./guides-manifest-${mount.project}.js`
  )
  const flat = flatten(shelves)
  return {
    dir: spec.dir,
    target: spec.target,
    root: `/projects/${mount.project}/guides/`,
    shelves,
    front,
    flat,
    slugs: new Set(flat.map((page) => page.slug)),
  }
}

const loadMounts = async () => {
  const entries = await Promise.all(
    config.mounts.map(async (mount) => {
      const { shelves, front } = await import(
        `./docs-manifest-${mount.project}.js`
      )
      const flat = flatten(shelves)
      const guides = mount.guides ? await loadTree(mount, mount.guides) : null
      return [
        mount.project,
        {
          project: mount.project,
          page: `/projects/${mount.project}/`,
          root: `/projects/${mount.project}/docs/`,
          repo: mount.repo,
          branch: mount.branch,
          docsDir: mount.docsDir,
          target: mount.target,
          shelves,
          front,
          flat,
          slugs: new Set(flat.map((page) => page.slug)),
          source: stamp[mount.project],
          guides,
        },
      ]
    })
  )
  return Object.fromEntries(entries)
}

/** @type {Record<string, DocsMount>} */
export const docsMounts = await loadMounts()

/** @type {DocsMount[]} */
export const docsMountList = Object.values(docsMounts)
