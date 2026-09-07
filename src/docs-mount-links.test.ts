import { describe, expect, it } from "vitest"
import { inRepo, rewriteMountedLinks } from "./data/docs-mount-links.js"

// The failure here is silent: a wrong hop still emits a working link, just to
// the wrong place. teable:coilyco-flight-deck/website#7079.
type Tree = { dir: string; root: string; slugs: Set<string> }
type Mount = {
  repo: string
  branch: string
  docsDir: string
  root: string
  slugs: Set<string>
  guides: Tree | null
}

const mount: Mount = {
  repo: "https://forgejo.example/org/proj",
  branch: "main",
  docsDir: "docs",
  root: "/projects/proj/docs/",
  slugs: new Set(["architecture", "features"]),
  guides: {
    dir: "guides",
    root: "/projects/proj/guides/",
    slugs: new Set(["first-role", "features"]),
  },
}

const link = (href: string) => `<a href="${href}">x</a>`
// Anything that leaves for the source repo is marked, so the expectation is
// the whole tag rather than the href alone.
const away = (href: string) => `<a href="${href}" rel="noreferrer">x</a>`
const rewrite = (html: string, m: Mount, kind: "docs" | "guides") =>
  rewriteMountedLinks(html, m as never, kind)
const from = (kind: "docs" | "guides", href: string) =>
  rewrite(link(href), mount, kind).match(/href="([^"]*)"/)![1]

describe("mounted link rewriting", () => {
  it("resolves a relative target against the directory that wrote it", () => {
    expect(inRepo("guides", "../docs/architecture")).toBe("docs/architecture")
    expect(inRepo("docs", "architecture")).toBe("docs/architecture")
    expect(inRepo("docs", "../guides/first-role")).toBe("guides/first-role")
  })

  it("sends a guide's ../docs/ link to the mounted docs page", () => {
    expect(from("guides", "../docs/architecture.md")).toBe(
      "/projects/proj/docs/architecture/"
    )
  })

  it("sends a docs page's ../guides/ link to the mounted guide", () => {
    expect(from("docs", "../guides/first-role.md")).toBe(
      "/projects/proj/guides/first-role/"
    )
  })

  it("keeps a sibling link inside its own tree", () => {
    expect(from("docs", "features.md")).toBe("/projects/proj/docs/features/")
    expect(from("guides", "features.md")).toBe(
      "/projects/proj/guides/features/"
    )
  })

  // The reason the match is on directory and not on filename alone: both trees
  // here carry a "features" slug, and only one of them is the one meant.
  it("does not let one tree answer for the other's slug", () => {
    expect(from("guides", "../docs/features.md")).toBe(
      "/projects/proj/docs/features/"
    )
    expect(from("docs", "../guides/features.md")).toBe(
      "/projects/proj/guides/features/"
    )
  })

  it("carries the anchor across", () => {
    expect(from("guides", "../docs/features.md#caps")).toBe(
      "/projects/proj/docs/features/#caps"
    )
  })

  it("leaves for the source repo at the resolved path when nothing is mounted", () => {
    expect(from("guides", "../docs/repository-plan.md")).toBe(
      "https://forgejo.example/org/proj/src/branch/main/docs/repository-plan.md"
    )
    expect(from("docs", "nowhere.md")).toBe(
      "https://forgejo.example/org/proj/src/branch/main/docs/nowhere.md"
    )
  })

  it("is inert on a project that declares no guides", () => {
    const plain: Mount = { ...mount, guides: null }
    expect(rewrite(link("features.md"), plain, "docs")).toBe(
      link("/projects/proj/docs/features/")
    )
    // Nothing serves /guides/ there, so the tree lookup finds no home for it.
    expect(rewrite(link("../guides/first-role.md"), plain, "docs")).toBe(
      away(
        "https://forgejo.example/org/proj/src/branch/main/guides/first-role.md"
      )
    )
  })

  it("leaves absolute and external links alone", () => {
    for (const href of ["https://example.com/x.md", "/projects/proj/docs/x/"]) {
      expect(rewrite(link(href), mount, "docs")).toBe(link(href))
    }
  })
})
