import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { VANITY_HOSTS, canonicalFor } from "./data/vanity-hosts.js"

// The map decides what a canonical tag claims; netlify.toml decides what that
// URL actually serves. A canonical pointing at a 301 is worse than none, so
// these two are asserted against each other rather than trusted to agree.
const toml = readFileSync("netlify.toml", "utf8")
const rule = (from: string, to: string) =>
  new RegExp(
    `from = "${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s*\\n\\s*to = "${to.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    )}"\\s*\\n\\s*status = 200`
  )

describe("vanity hosts are canonical for their projects", () => {
  it("derives the short path on the project's own host", () => {
    expect(canonicalFor("/projects/umbra/", "https://x")).toBe(
      "https://umbra.coilyco.ai/"
    )
    expect(canonicalFor("/projects/umbra/docs/a/", "https://x")).toBe(
      "https://umbra.coilyco.ai/docs/a/"
    )
    expect(canonicalFor("/projects/umbra/guides/a/", "https://x")).toBe(
      "https://umbra.coilyco.ai/guides/a/"
    )
  })

  it("leaves every non-project route on the main site", () => {
    for (const route of ["/", "/about/", "/writing/", "/posts/x/"]) {
      expect(canonicalFor(route, "https://www.coilysiren.me")).toBe(
        `https://www.coilysiren.me${route}`
      )
    }
    // An unmapped project falls back rather than inventing a host.
    expect(canonicalFor("/projects/nope/", "https://www.coilysiren.me")).toBe(
      "https://www.coilysiren.me/projects/nope/"
    )
  })

  it("serves every canonical it claims, at 200 rather than a redirect", () => {
    for (const [slug, host] of Object.entries(VANITY_HOSTS)) {
      // the project page itself, at the bare host
      expect(toml, `${host}/ must serve ${slug}`).toMatch(
        rule(`${host}/`, `/vanity/${slug}/index.html`)
      )
      // the docs short path the canonical tags now point at
      expect(toml, `${host}/docs/* must serve ${slug} docs`).toMatch(
        rule(`${host}/docs/*`, `/projects/${slug}/docs/:splat`)
      )
      // the rail script the docs pages request, which is not under /styles/
      expect(toml, `${host} must pass /docs-rail.js through`).toMatch(
        rule(`${host}/docs-rail.js`, "/docs-rail.js")
      )
    }
  })

  it("keeps each host's catch-all last, since Netlify takes the first match", () => {
    for (const host of Object.values(VANITY_HOSTS)) {
      const froms = [...toml.matchAll(/from = "(https:\/\/[^"]+)"/g)]
        .map((m) => m[1] ?? "")
        .filter((f) => f.startsWith(`${host}/`))
      expect(froms.at(-1), `${host} catch-all is not last`).toBe(`${host}/*`)
    }
  })
})
