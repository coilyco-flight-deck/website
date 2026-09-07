// Which coilyco.ai host is canonical for each project, and how a built route
// becomes its canonical URL. Reasoning and the rules: docs/vanity-hosts.md.

/** @type {Record<string, string>} */
export const VANITY_HOSTS = {
  "agent-compose": "https://acompose.coilyco.ai",
  housecast: "https://housecast.coilyco.ai",
  "mcp-beaver": "https://beaver.coilyco.ai",
  umbra: "https://umbra.coilyco.ai",
}

/** The canonical absolute URL for a built route. docs/vanity-hosts.md. */
export const canonicalFor = (route, siteUrl) => {
  const hit = String(route).match(/^\/projects\/([^/]+)\/(.*)$/)
  const host = hit && VANITY_HOSTS[hit[1]]
  return host ? `${host}/${hit[2]}` : `${siteUrl}${route}`
}
