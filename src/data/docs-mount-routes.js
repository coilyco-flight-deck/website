// Every route the docs mount emits. A new mount adds one import and one entry
// below, for the reason in docs/project-docs-render.md.
import config from "./docs-mounts.json" with { type: "json" }
import * as agentCompose from "./docs-manifest-agent-compose.js"
import * as housecast from "./docs-manifest-housecast.js"
import * as mcpBeaver from "./docs-manifest-mcp-beaver.js"
import * as umbra from "./docs-manifest-umbra.js"

const manifests = {
  "agent-compose": agentCompose,
  housecast,
  "mcp-beaver": mcpBeaver,
  umbra,
}

// One entry per project that declares a `guides` block in docs-mounts.json.
const guideManifests = {}

export const DOCS_ROUTES = config.mounts.flatMap(({ project }) => [
  `/projects/${project}/docs/`,
  ...manifests[project].shelves.flatMap((shelf) =>
    shelf.pages.map((page) => `/projects/${project}/docs/${page.slug}/`)
  ),
])

// Opt-in, so empty until a repo declares one. Separate from DOCS_ROUTES
// because upstream counts and caps the two types separately.
export const GUIDES_ROUTES = config.mounts
  .filter(({ guides }) => guides)
  .flatMap(({ project }) => [
    `/projects/${project}/guides/`,
    ...guideManifests[project].shelves.flatMap((shelf) =>
      shelf.pages.map((page) => `/projects/${project}/guides/${page.slug}/`)
    ),
  ])
