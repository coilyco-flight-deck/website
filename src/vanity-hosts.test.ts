import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { VANITY_HOSTS, canonicalFor } from "./data/vanity-hosts.js"

// The map claims a canonical; netlify.toml decides what that URL serves. Why
// they are asserted against each other: docs/vanity-hosts.md.
const toml = readFileSync("netlify.toml", "utf8")
// Assembled: the pinned check-code-comments misreads an inline glob as a
// block comment. Remove with the pin bump, website#7083.
const ANY = "/" + "*"
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
      expect(toml, `${host}/docs glob must serve ${slug} docs`).toMatch(
        rule(`${host}/docs${ANY}`, `/projects/${slug}/docs/:splat`)
      )
      // the rail script the docs pages request, which is not under /styles/
      expect(toml, `${host} must pass /docs-rail.js through`).toMatch(
        rule(`${host}/docs-rail.js`, "/docs-rail.js")
      )
      // Every in-page link is a /projects/<slug>/ path, so without this the
      // canonical page walks its own reader off the canonical host.
      expect(
        toml,
        `${host} must serve its own /projects/${slug}/ paths`
      ).toMatch(
        rule(`${host}/projects/${slug}${ANY}`, `/projects/${slug}/:splat`)
      )
    }
  })

  it("keeps each host's catch-all last, since Netlify takes the first match", () => {
    for (const host of Object.values(VANITY_HOSTS)) {
      const hostRules = [...toml.matchAll(/from = "(https:[^"]+)"/g)]
        .map((m) => m[1] ?? "")
        .filter((f) => f.startsWith(`${host}/`))
      expect(hostRules.at(-1), `${host} catch-all is not last`).toBe(
        `${host}${ANY}`
      )
    }
  })
})
