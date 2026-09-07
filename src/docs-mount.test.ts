import { readFileSync, readdirSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { docsMounts } from "./data/docs-mount-loader.js"

// The two ways the sync goes quiet: it stops running, or it brings back a
// page the manifest does not know. See docs/project-docs-sync.md.
const config = JSON.parse(
  readFileSync("src/data/docs-mounts.json", "utf8")
) as {
  mounts: {
    project: string
    target: string
    exclude: string[]
    guides?: { dir: string; target: string; exclude?: string[] }
  }[]
}
const stamp = JSON.parse(
  readFileSync("src/data/docs-mount-source.json", "utf8")
) as Record<string, { commit: string; date: string; syncedAt: string }>

// The workflow runs daily. Two weeks absorbs a paused runner or a quiet week
// without letting a copy that nobody is refreshing pass for a current one.
const STALE_AFTER_DAYS = 14
const DAY_MS = 24 * 60 * 60 * 1000

describe("project docs mount", () => {
  it("stamps every declared mount", () => {
    for (const mount of config.mounts) {
      const entry = stamp[mount.project]
      expect(entry, `no stamp for ${mount.project}`).toBeTruthy()
      expect(entry?.commit).toMatch(/^[0-9a-f]{7,40}$/)
    }
  })

  it("was synced recently enough to trust", () => {
    for (const mount of config.mounts) {
      const syncedAt = Date.parse(`${stamp[mount.project]?.syncedAt}T00:00:00Z`)
      expect(
        Number.isNaN(syncedAt),
        `${mount.project} syncedAt is unparseable`
      ).toBe(false)
      const age = Math.floor((Date.now() - syncedAt) / DAY_MS)
      expect(
        age,
        `${mount.project} was last synced ${age} days ago. Run the "Sync project docs" workflow, or "just sync-project-docs" locally, and commit the result.`
      ).toBeLessThanOrEqual(STALE_AFTER_DAYS)
    }
  })

  it("keeps every manifest and its vendored files in agreement", () => {
    for (const mount of config.mounts) {
      const onDisk = readdirSync(mount.target)
        .filter((name) => name.endsWith(".md"))
        .map((name) => name.replace(/\.md$/, ""))
        .sort()
      const inManifest = docsMounts[mount.project]!.flat.map(
        (page) => page.slug
      ).sort()
      // A page added upstream has no shelf, title, or reading position until
      // the manifest names it, which is the one-line diff this asks for.
      expect(
        onDisk,
        `src/data/docs-manifest-${mount.project}.js does not match what the sync vendored`
      ).toEqual(inManifest)
    }
  })

  it("hands every page the stamp the sync wrote", () => {
    for (const mount of config.mounts) {
      const loaded = docsMounts[mount.project]
      expect(loaded!.source.repo).toContain("forgejo.coilysiren.me")
      expect(loaded!.source.commit).toBe(stamp[mount.project]?.commit)
    }
  })

  // Guides are opt-in, so these assert the shape where a mount declares one
  // and assert the absence where it does not. teable:coilyco-flight-deck/website#7079.
  it("resolves a guides tree exactly where one is declared", () => {
    for (const mount of config.mounts) {
      const loaded = docsMounts[mount.project]
      if (!mount.guides) {
        expect(
          loaded!.guides,
          `${mount.project} declares no guides and must resolve none`
        ).toBeNull()
        continue
      }
      const tree = loaded!.guides
      expect(
        tree,
        `no guides manifest resolved for ${mount.project}`
      ).toBeTruthy()
      expect(tree!.root).toBe(`/projects/${mount.project}/guides/`)
      expect(tree!.dir).toBe(mount.guides.dir)
      expect(tree!.shelves.length).toBeGreaterThan(0)
      expect(
        tree!.front?.headline,
        `${mount.project} guides front.headline`
      ).toBeTruthy()
    }
  })

  it("keeps every guides manifest and its vendored files in agreement", () => {
    for (const mount of config.mounts) {
      if (!mount.guides) continue
      const onDisk = readdirSync(mount.guides.target)
        .filter((name) => name.endsWith(".md"))
        .map((name) => name.replace(/\.md$/, ""))
        .sort()
      const inManifest = docsMounts[mount.project]!.guides!.flat.map(
        (page) => page.slug
      ).sort()
      expect(
        onDisk,
        `src/data/guides-manifest-${mount.project}.js does not match what the sync vendored`
      ).toEqual(inManifest)
    }
  })

  // coilysiren/website#136: a manifest that is missing, misnamed, or short a
  // `front` block fails here rather than at build time.
  it("resolves every declared mount from config alone", () => {
    for (const mount of config.mounts) {
      const loaded = docsMounts[mount.project]
      expect(loaded, `no manifest resolved for ${mount.project}`).toBeTruthy()
      if (!loaded) continue
      expect(loaded.shelves.length).toBeGreaterThan(0)
      expect(
        loaded.front?.headline,
        `${mount.project} front.headline`
      ).toBeTruthy()
      expect(loaded.root).toBe(`/projects/${mount.project}/docs/`)
    }
  })
})
