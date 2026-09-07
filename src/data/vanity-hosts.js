// Which coilyco.ai host is canonical for each project, and how a built route
// becomes its canonical URL. Reasoning and the rules: docs/vanity-hosts.md.

/** @type {Record<string, string>} */
export const VANITY_HOSTS = {
  "agent-compose": "https://acompose.coilyco.ai",
  housecast: "https://housecast.coilyco.ai",
  "mcp-beaver": "https://beaver.coilyco.ai",
  umbra: "https://umbra.coilyco.ai",
}

/**
 * The canonical absolute URL for a built route.
 *
 * A project's own pages are canonical on its vanity host at the short path, so
 * `/projects/umbra/docs/x/` is `https://umbra.coilyco.ai/docs/x/`. Everything
 * else is canonical on the main site.
 */
export const canonicalFor = (route, siteUrl) => {
  const hit = String(route).match(/^\/projects\/([^/]+)\/(.*)$/)
  const host = hit && VANITY_HOSTS[hit[1]]
  return host ? `${host}/${hit[2]}` : `${siteUrl}${route}`
}
