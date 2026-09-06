---
layout: layouts/project.njk
pagination:
  data: site.projectVariants
  size: 1
  alias: variant
permalink: "{% if variant == 'vanity' %}vanity/mcp-beaver/index.html{% else %}projects/mcp-beaver/index.html{% endif %}"
title: mcp-beaver, a MCP server generator with a natural flow | Kai Ase Siren
description: mcp-beaver renders one umbra guardfile into a running MCP server, an HTTP tool API, an optional widget, and a helm release. Each grant becomes one tool, and its input schema comes from the grant's own path, query, and body.
canonical: /projects/mcp-beaver/
robots: follow, index
ogImage: /images/banners/mcp-beaver-card.jpg
ogImageAlt: mcp-beaver, a MCP server generator with a natural flow
softwareSchema:
  name: mcp-beaver
  claim: a MCP server generator with a natural flow
  repo: https://github.com/coilyco-flight-deck/mcp-beaver
  license: https://spdx.org/licenses/MIT.html
project:
  slug: mcp-beaver
  eyebrow: One file // the whole server
  claim: a MCP server generator with a natural flow
  hook: You need an MCP server for one API. Now write a Go package, a handler and a schema per tool, and a Dockerfile.
  caption: One grant becomes one MCP tool and one HTTP endpoint, and umbra derives the input schema from the path, query, and body written above.
  meta:
    - "<b>Preview</b>"
    - MIT
    - image // helm chart
    - MCP 2026-07-28
  contents:
    - { id: problem, title: The problem }
    - { id: how-it-works, title: How it works }
    - { id: spec, title: Reading a spec }
    - { id: coverage, title: Results lead with coverage }
    - { id: not-a-gateway, title: What the deployment owns }
    - { id: stack, title: The stack }
    - { id: reference, title: Reference }
  sample: |
    <pre><code><span class="k">wrap</span> ward mcp forgejo {
      <span class="k">restrict</span> owner matches <span class="s">"coilyco-*"</span>
      <span class="k">can get</span> issue {
        <span class="k">path</span> <span class="s">"/repos/{owner}/{repo}/issues/{index}"</span>
      }
    }
    <span class="k">withhold</span> <span class="s">"delete_issue"</span> { <span class="k">reason</span> <span class="s">"No undo."</span> }</code></pre>
---

{% section { id: "problem", band: "penumbra", accent: "cost", label: "The problem, and what it costs to leave alone", heading: "By the fourth service it is four codebases." } %}
Exposing one service to an agent means writing a Go package, a handler per tool,
an input schema per tool, and a Dockerfile. Then a reviewer reads all four and
decides whether they believe the combination. Do it again for the next service,
and the honest answer to what an agent can reach through them is that nobody has
held all of it in their head at once.

Each of those servers holds a credential and forwards calls, so its blast radius
is the whole upstream, and the thing standing between the agent and a destructive
verb is that nobody wrote a tool for it yet. Somebody will, because adding one is
a small pull request.
{% endsection %}

{% section { id: "how-it-works", band: "lilac", accent: "grant", label: "What it does about it", heading: "One runtime, many guardfiles." } %}
mcp-beaver renders an <a href="/projects/umbra/">umbra</a> guardfile into a guarded
MCP server and a matching HTTP tool API, baked into one generic image. Each
`can` grant is one MCP tool named `verb_resource`, and its
input schema is derived from the grant's own path, query, and body. There is no
per-server Go, no per-server Dockerfile, no per-server handler, and no per-tool
schema to keep in sync with anything.

An unwritten `delete issue` grant means no `delete_issue`
tool and no `/api/delete_issue` endpoint is ever served. Deployment is a
values file and a `helm upgrade`, and the chart stays spec-opaque: in
spec mode it never parses the guardfile at all.

### Four ways to serve

<dl class="project__deflist">
  <div>
    <dt>serve</dt>
    <dd>Reads a <code>.mcp.kdl</code> and guards an HTTP upstream. The general case.</dd>
  </div>
  <div>
    <dt>serve-upstream</dt>
    <dd>Wraps a private MCP behind an exact tool allowlist.</dd>
  </div>
  <div>
    <dt>serve-ssm</dt>
    <dd>An exact-parameter AWS reader. The policy names one parameter, and the general getter rejects every other name before AWS sees a request. IAM bounds the principal independently, so there are two bounds rather than one.</dd>
  </div>
  <div>
    <dt>serve-s3</dt>
    <dd>The asset publisher, and the first write-capable mode. Its policy fixes one bucket, the media types it will serve, the public base URL, and an optional key prefix.</dd>
  </div>
</dl>

`lint` and `lint-upstream` are the same paths minus the
listener, so a guardfile is validated in CI before it is ever mounted.
{% endsection %}

{% section { id: "spec", band: "umbra", accent: "grant", label: "What it looks like in use", heading: "The reviewable surface is one small file, read end to end." } %}
This is the whole contract for a server that can read, file, comment on, and close
issues, and can do nothing else to the host it points at.

<div class="project__code project__code--annotated">
<pre><code><span class="k">wrap</span> ward mcp forgejo {
  <span class="k">base-url</span> <span class="s">"forgejo.coilysiren.me/api/v1"</span>              <span class="c">1</span>
  <span class="k">auth</span> header-token { <span class="k">value</span> env <span class="s">"FORGEJO_TOKEN"</span> }     <span class="c">2</span>
  <span class="k">restrict</span> owner matches <span class="s">"coilyco-*"</span>                  <span class="c">3</span>
  <span class="k">can get</span> issue { <span class="k">path</span> <span class="s">"/repos/{owner}/{repo}/issues/{index}"</span> }  <span class="c">4</span>
}
<span class="k">withhold</span> <span class="s">"delete_issue"</span> { <span class="k">reason</span> <span class="s">"The upstream has no undo."</span> }  <span class="c">5</span></code></pre>
</div>

<dl class="project__deflist project__deflist--numbered">
  <div>
    <dt><span class="project__n">1</span> base-url</dt>
    <dd>The one host this server may reach.</dd>
  </div>
  <div>
    <dt><span class="project__n">2</span> auth</dt>
    <dd>Resolved from the environment at run time, never baked into the image. This is the credential mcp-beaver presents upstream, not a caller's credential to mcp-beaver.</dd>
  </div>
  <div>
    <dt><span class="project__n">3</span> restrict</dt>
    <dd>Every <code>{owner}</code> path leaf must match, so a granted verb still cannot travel outside the accounts you named.</dd>
  </div>
  <div>
    <dt><span class="project__n">4</span> can get</dt>
    <dd>One grant, one tool, one endpoint, and an input schema derived from the path.</dd>
  </div>
  <div>
    <dt><span class="project__n">5</span> withhold</dt>
    <dd>A verb left out on purpose, said out loud. The stub appears in discovery, states why, refuses every call, and reaches no upstream.</dd>
  </div>
</dl>

That last node exists because silence means four things at once: withheld by
policy, unimplemented, not offered upstream, or simply not found by the agent's
search. An agent guesses between them, and it guesses wrong in both directions.
{% endsection %}

{% section { id: "coverage", band: "penumbra", accent: "context", label: "A design call worth stating", heading: "Every result opens with what it counted." } %}
Grant-backed results are <code>{"coverage": {...}, "result": ...}</code>, in that
order, in both the text and the structured content. Coverage names every array in
the payload and its length, because a count in meaning is what changes an answer.

<div class="project__note">
  <p class="project__note-label">Note</p>

Coverage leads because a consuming harness bounds a tool result by keeping the
front and discarding the tail. A caveat serialized last is the first thing
destroyed, and the model then reads rows carrying no caveat and answers as
though the view were complete.

</div>
{% endsection %}

{% section { id: "not-a-gateway", band: "lilac", accent: "refuse", label: "What the deployment owns", heading: "Caller identity belongs to the deployment." } %}
Caller identity, TLS, ingress, and network reachability belong to whatever runs
mcp-beaver, and it expects to sit behind them rather than to be an API gateway or
an identity layer. Guardfile `auth` configures mcp-beaver's own credential to the
upstream service, which is the opposite direction from a caller's credential to
mcp-beaver.

<div class="project__note">
  <p class="project__note-label">Note</p>

The deny-by-absence claim is about the running server, not the image. The image
is deliberately generic and carries no guardfile, so a consumer mounts the spec
at deploy time.

</div>

<div class="project__table-wrap">
  <table class="project__table">
    <caption>What absence means, per serve mode</caption>
    <thead>
      <tr>
        <th scope="col">Mode</th>
        <th scope="col">An undeclared operation</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Spec mode</th>
        <td>Has no handler at all. Absent, in the strongest sense the word has.</td>
      </tr>
      <tr>
        <th scope="row">Upstream-proxy mode</th>
        <td>Still exists behind an endpoint the container holds credentials for. The runtime re-checks allowlist membership on every call, so the bound there is enforcement rather than absence.</td>
      </tr>
    </tbody>
  </table>
</div>

The distinction is worth carrying, because the two modes earn different sentences
and only one of them earns the stronger one.
{% endsection %}

{% section { id: "stack", extraClass: "project__chain", band: "penumbra", accent: "context", label: "One boundary, three proofs", heading: "Constrain what an agent can do, and prove what it did." } %}
{% set here = "mcp-beaver" %}
{% include "components/project-chain.njk" %}
{% endsection %}

{% section { id: "reference", band: "umbra", accent: "reference", label: "Repository and docs", heading: "Reference" } %}
<ul class="project__links">
  <li><a href="https://github.com/coilyco-flight-deck/mcp-beaver">Repository ↗</a></li>
  <li><a href="https://github.com/coilyco-flight-deck/mcp-beaver/blob/main/docs/FEATURES.md">docs/FEATURES.md ↗</a></li>
  <li><a href="https://github.com/coilyco-flight-deck/mcp-beaver/blob/main/docs/DESIGN.md">docs/DESIGN.md ↗</a></li>
  <li><a href="https://github.com/coilyco-flight-deck/mcp-beaver/blob/main/examples/forgejo-issues.mcp.kdl">examples/forgejo-issues.mcp.kdl ↗</a></li>
</ul>
<p class="project__byline">
  <span>Built by <a href="/">Kai Ase Siren</a></span>
  <span>MIT licensed</span>
</p>
{% endsection %}
