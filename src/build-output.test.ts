import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { ROUTES } from "../cypress/routes"
import { DOCS_ROUTES, GUIDES_ROUTES } from "./data/docs-mount-routes.js"

// These assert what Eleventy emitted, not how it renders, so they read dist/
// rather than driving a browser. `pnpm run test:quick` builds first.
const CANONICAL_ROUTES = [
  "/",
  "/about/",
  "/hiring/",
  "/projects/agent-compose/",
  "/projects/housecast/",
  "/projects/mcp-beaver/",
  "/projects/umbra/",
  "/resume/",
] as const
// The curated public set. Posts join it only via `promoted` in front matter,
// which is the one key driving listing, robots, sitemap and syndication.
const PROMOTED_POSTS = [
  "/posts/azure-openai-terraform/",
  "/posts/on-permissions-models-for-cloud-platform-providers/",
  "/posts/stochastic-design-iteration/",
] as const
const DARK_POSTS = [
  "/posts/code-janitor/",
  "/posts/golang-pr-notes-1/",
] as const
// The docs mount, indexed since coilysiren/website#135. Derived from the
// manifest so a synced page cannot be missing from this set.
const INDEXED = [
  ...CANONICAL_ROUTES,
  "/writing/",
  ...PROMOTED_POSTS,
  ...DOCS_ROUTES,
  ...GUIDES_ROUTES,
].sort()
// The apex 301s here, so a canonical URL naming the apex would resolve
// through a redirect. One host, everywhere.
const HOST = "https://www.coilysiren.me"
const INDEXED_URLS = INDEXED.map((route) => `${HOST}${route}`)

const read = (path: string) => readFileSync(`dist/${path}`, "utf8")
// JPEG carries its size in the SOF segment, not in the file header, so the
// only way to know what was actually committed is to walk to it.
const jpegSize = (path: string) => {
  const bytes = readFileSync(`dist/${path}`)
  let at = 2
  while (at + 1 < bytes.length) {
    if (bytes.readUInt8(at) !== 0xff) throw new Error(`${path} is not a JPEG`)
    const marker = bytes.readUInt8(at + 1)
    const isFrameHeader =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)
    if (isFrameHeader)
      return {
        height: bytes.readUInt16BE(at + 5),
        width: bytes.readUInt16BE(at + 7),
      }
    at += 2 + bytes.readUInt16BE(at + 2)
  }
  throw new Error(`${path} has no frame header`)
}
const page = (route: string) =>
  read(route === "/" ? "index.html" : `${route.slice(1)}index.html`)
const schema = (route: string) =>
  page(route).match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  )?.[1]

describe("build output", () => {
  it("declares exactly the curated set, and derives it", () => {
    const sitemap = [...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)]
    expect(sitemap.map((match) => match[1])).toEqual(INDEXED_URLS)

    // Nothing lists the posts by hand. A post appears here because its own
    // `promoted` flag drove `robots`, which the sitemap derives from.
    const llms = read("llms.txt")
    INDEXED_URLS.forEach((url) => expect(llms).toContain(url))
    DARK_POSTS.forEach((route) => expect(llms).not.toContain(route))
  })

  it("keeps long-form and retired routes out of the index", () => {
    INDEXED.forEach((route) => {
      expect(page(route)).toContain('content="follow, index"')
    })
    // Reachable by direct link, never by crawler.
    ;["/cool-people/", ...DARK_POSTS].forEach((route) => {
      expect(page(route)).toContain('content="noindex, nofollow"')
    })
    // Exact emitted paths - a directory-shaped guess here would pass on a
    // route that was never directory-shaped to begin with.
    ;[
      "apps/index.html",
      "apps/bsky-popularity-contest/index.html",
      "apps/bsky-follow-suggestions/index.html",
      "pulse/index.html",
      "og/index.html",
      "rss.xml",
    ].forEach((path) => {
      expect(() => read(path)).toThrow()
    })
  })

  it("ships no render-blocking script", () => {
    CANONICAL_ROUTES.forEach((route) => {
      // ld+json is a data block the parser never executes, so it is exempt.
      // Anything else without async/defer blocks the parser and is not.
      const executable = page(route).replace(
        /<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
        ""
      )
      expect(executable).not.toMatch(/<script\b(?![^>]*\b(?:async|defer)\b)/i)
    })
  })

  it("points every canonical URL at the host that answers", () => {
    CANONICAL_ROUTES.forEach((route) => {
      const html = page(route)
      expect(html).toContain(`<link rel="canonical" href="${HOST}${route}">`)
      expect(html).toContain(
        `<meta property="og:url" content="${HOST}${route}">`
      )
    })
    // The bare apex never appears as a host. Subdomains of it are fine.
    ;["sitemap.xml", "robots.txt", "llms.txt", "index.html"].forEach((path) => {
      expect(read(path), `${path} names the redirecting apex`).not.toMatch(
        /\/\/coilysiren\.me/
      )
    })
  })

  it("ships a social card that matches the size it declares", () => {
    // A page may declare its own card, and several do, so what is asserted is
    // that whatever card a route names is committed at the size tags promise.
    const DEFAULT_CARD = "/images/og-default.jpg"
    const CARDS: Record<string, string> = {
      "/projects/agent-compose/": "/images/banners/agent-compose-card.jpg",
      "/projects/mcp-beaver/": "/images/banners/mcp-beaver-card.jpg",
      "/projects/umbra/": "/images/banners/umbra-card.jpg",
    }
    CANONICAL_ROUTES.forEach((route) => {
      const html = page(route)
      const card = CARDS[route] ?? DEFAULT_CARD
      expect(html).toContain(
        `<meta property="og:image" content="${HOST}${card}">`
      )
      expect(html).toContain(
        `<meta name="twitter:image" content="${HOST}${card}">`
      )
      // A large card with a summary card tag renders as the small one.
      expect(html).toContain(
        'name="twitter:card" content="summary_large_image"'
      )
      expect(html).toMatch(/<meta property="og:image:alt" content="[^"]+">/)
    })
    // The layout declares one pair of dimensions for every route, so every
    // card in play has to be that size, not just the default one.
    const declared = page("/").match(
      /og:image:width" content="(\d+)">\s*<meta property="og:image:height" content="(\d+)"/
    )
    expect(declared).not.toBeNull()
    const promised = {
      width: Number(declared![1]),
      height: Number(declared![2]),
    }
    new Set([DEFAULT_CARD, ...Object.values(CARDS)]).forEach((card) => {
      expect(jpegSize(card.slice(1)), card).toEqual(promised)
    })
  })

  it("gives every indexed page one heading and the site name", () => {
    INDEXED.forEach((route) => {
      const html = page(route)
      const headings = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)]
      expect(headings, `${route} h1 count`).toHaveLength(1)
      const heading = headings[0]?.[1] ?? ""
      expect(heading.replace(/<[^>]*>/g, "").trim(), route).not.toBe("")
      const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ""
      expect(
        title === "Kai Ase Siren" || title.endsWith(" | Kai Ase Siren"),
        `${route} title is "${title}"`
      ).toBe(true)
    })
  })

  it("dates every post in a form a machine can read", () => {
    ;[...PROMOTED_POSTS, ...DARK_POSTS].forEach((route) => {
      const html = page(route)
      const stamp = html.match(/<time datetime="([^"]+)"/)?.[1]
      expect(stamp, `${route} <time>`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      const article = JSON.parse(schema(route)!)
      expect(article["@type"]).toBe("BlogPosting")
      expect(article.datePublished).toBe(stamp)
      expect(Number.isNaN(Date.parse(article.datePublished))).toBe(false)
      // Same `url` the homepage Person declares, so the two resolve as one.
      expect(article.author.url).toBe(HOST)
    })
  })

  it("feeds exactly the promoted posts, newest first", () => {
    const feed = read("feed.xml")
    const entries = [...feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(
      (match) => match[1] ?? ""
    )
    expect(entries).toHaveLength(PROMOTED_POSTS.length)

    const links = entries.map(
      (entry) => entry.match(/<link href="([^"]+)"/)?.[1] ?? ""
    )
    // Absolute, on the host that answers, or a reader resolves them wrong.
    links.forEach((link) =>
      expect(link.startsWith(`${HOST}/posts/`)).toBe(true)
    )
    expect([...links].sort()).toEqual(
      PROMOTED_POSTS.map((route) => `${HOST}${route}`).sort()
    )
    DARK_POSTS.forEach((route) => expect(feed).not.toContain(route))

    const dates = entries.map(
      (entry) => entry.match(/<updated>([^<]+)<\/updated>/)?.[1] ?? ""
    )
    dates.forEach((date) => expect(Number.isNaN(Date.parse(date))).toBe(false))
    expect(dates).toEqual([...dates].sort().reverse())

    entries.forEach((entry) => {
      expect(entry).toMatch(/<title>.+<\/title>/)
      expect(entry).toMatch(/<summary>.+<\/summary>/)
    })

    // A feed nothing advertises is a feed nobody finds.
    INDEXED.forEach((route) =>
      expect(page(route)).toContain(
        `<link rel="alternate" type="application/atom+xml" title="Kai Ase Siren" href="${HOST}/feed.xml">`
      )
    )
  })

  it("accessibility-tests every route the build emits", () => {
    const emitted = readdirSync("dist", { recursive: true })
      .map(String)
      .filter((entry) => entry.endsWith(".html"))
      .map((entry) => `/${entry.replace(/index\.html$/, "")}`)
      .sort()

    expect([...ROUTES].sort(), "cypress/routes.ts").toEqual(emitted)
  })

  // With no reserved box an image collapses to zero height and loads anyway,
  // so `loading="lazy"` defers nothing. coilysiren/website#129, worth 34MB.
  it("reserves a box for every deferred image", () => {
    INDEXED.forEach((route) => {
      const html = page(route)
      const deferred = (html.match(/<img\b[^>]*>/g) ?? []).filter((tag) =>
        tag.includes('loading="lazy"')
      )
      const unreserved = deferred.filter(
        (tag) => !(/\bwidth="\d+"/.test(tag) && /\bheight="\d+"/.test(tag))
      )
      expect(
        unreserved,
        `${route} defers an image with no reserved box`
      ).toEqual([])
    })
  })

  it("describes the person once, where the person is described", () => {
    ;["/", "/about/"].forEach((route) => {
      const parsed = JSON.parse(schema(route)!)
      expect(parsed["@type"]).toBe("Person")
      expect(parsed.url).toBe(HOST)
      expect(parsed.name).toBe("Kai Ase Siren")
      expect(parsed.jobTitle).toBeTruthy()
      expect(parsed.sameAs.length).toBeGreaterThan(0)
      // Entity resolution only works against URLs that resolve.
      parsed.sameAs.forEach((url: string) =>
        expect(url).toMatch(/^https:\/\/[^/]+\/.+/)
      )
    })
    ;["/hiring/", "/resume/"].forEach((route) =>
      expect(schema(route)).toBeUndefined()
    )
  })
})
