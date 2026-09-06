---
layout: layouts/project.njk
pagination:
  data: site.projectVariants
  size: 1
  alias: variant
permalink: "{% if variant == 'vanity' %}vanity/umbra/index.html{% else %}projects/umbra/index.html{% endif %}"
title: umbra, a config driven occlusion framework | Kai Ase Siren
description: You gave an agent a shell. Now name every command it can run. umbra validates argv before execve, checks a scope token per verb, and appends every call to an audit log.
canonical: /projects/umbra/
robots: follow, index
ogImage: /images/banners/umbra-card.jpg
ogImageAlt: umbra, a config driven occlusion framework
softwareSchema:
  name: umbra
  claim: config driven occlusion framework
  repo: https://github.com/coilyco-flight-deck/umbra
  license: https://spdx.org/licenses/MIT.html
project:
  slug: umbra
  eyebrow: Policy // the boundary itself
  claim: config driven occlusion framework
  hook: You gave an agent a shell. Now name every command it can run.
  caption: That is the entire policy for git. Four lines, and everything nobody named is unreachable.
  onward: 21 pages, from installing it to the broker protocol
  meta:
    - "<b>v0.170.0</b>"
    - MIT
    - brew // scoop
    - linux // macos // windows
  contents:
    - { id: problem, title: The problem }
    - { id: how-it-works, title: How it works }
    - { id: guardfile, title: Reading a guardfile }
    - { id: not-a-sandbox, title: What it is not }
    - { id: stack, title: The stack }
    - { id: reference, title: Reference }
  sample: |
    <pre><code><span class="k">wrap</span> ward git {
      <span class="k">exec</span> git
      <span class="k">can run</span> commit { <span class="k">deny-flag</span> <span class="s">"--no-verify"</span> }
      <span class="k">never run</span> <span class="s">"reflog expire"</span>
    }</code></pre>
---

{% section { id: "problem", band: "penumbra", accent: "cost",
             label: "The problem, and what it costs to leave alone",
             heading: "Most teams cannot answer that question." } %}
The answer is spread across a system prompt, a tool definition, an allowlist
somebody added during an incident, and whichever binaries happen to be on the
container. When something goes wrong the question changes from what was allowed to
what actually happened, and that answer is usually worse, because what you have is
an agent transcript rather than a log.

The expensive failure is not the runaway agent that deletes a repository. That one
is rare and memorable. The expensive failure is that you cannot answer either
question in a review, so the safe call is to give the agent less than it needs, and
the automation quietly stays a demo.
{% endsection %}

{% section { id: "how-it-works", band: "lilac", accent: "grant",
             label: "What it does about it",
             heading: "umbra sits between semi-trusted automation and the host system." } %}
What you did not declare does not get through. The boundary lives in a KDL guardfile
rather than in code, so it is one artifact a reviewer reads in a sitting. umbra ships
no denylist and knows nothing about your tools. The policy is yours, and umbra
enforces it across two surfaces: subprocess execution and outbound HTTP requests.

### What it checks

<dl class="project__deflist">
  <div><dt>argv</dt><dd>Validated before <code>execve</code>.</dd></div>
  <div><dt>scope token</dt><dd>Checked per verb.</dd></div>
  <div><dt>repo state</dt><dd>Repo-shaped verbs are refused on a dirty tree.</dd></div>
  <div><dt>egress</dt><dd>Gated through a per-invocation CONNECT proxy.</dd></div>
  <div><dt>audit log</dt><dd>Every call appended to a rotating JSONL file.</dd></div>
</dl>

A public exit-code taxonomy lets an orchestrator tell a policy refusal apart from a
tool failure, which is the difference between retrying and stopping.
{% endsection %}

{% section { id: "guardfile", band: "umbra", accent: "grant",
             label: "What it looks like in use",
             heading: "The reviewable surface is four lines, not a codebase." } %}
`commit` is reachable and `--no-verify` is not.
`reflog expire` is refused outright. Every subcommand nobody named
is unreachable, because grants are deny-by-default and an unknown node fails closed.

<div class="project__code project__code--annotated">
<pre><code><span class="k">wrap</span> ward git {                                 <span class="c">1</span>
  <span class="k">exec</span> git                                      <span class="c">2</span>
  <span class="k">can run</span> commit { <span class="k">deny-flag</span> <span class="s">"--no-verify"</span> }    <span class="c">3</span>
  <span class="k">never run</span> <span class="s">"reflog expire"</span>                 <span class="c">4</span>
}</code></pre>
</div>

<dl class="project__deflist project__deflist--numbered">
  <div>
    <dt><span class="project__n">1</span> wrap</dt>
    <dd>Names the wrapper an agent invokes in place of the real binary.</dd>
  </div>
  <div>
    <dt><span class="project__n">2</span> exec</dt>
    <dd>The one binary this wrapper is allowed to reach.</dd>
  </div>
  <div>
    <dt><span class="project__n">3</span> can run</dt>
    <dd><code>commit</code> is reachable, and <code>--no-verify</code> is not.</dd>
  </div>
  <div>
    <dt><span class="project__n">4</span> never run</dt>
    <dd><code>reflog expire</code> is refused outright.</dd>
  </div>
</dl>
{% endsection %}

{% section { id: "not-a-sandbox", band: "lilac", accent: "refuse",
             label: "What it does not do",
             heading: "umbra is not a sandbox." } %}
{% note %}
It performs no execution isolation at all, and that is deliberate rather than
unfinished. It is audit-and-gate.
{% endnote %}

Four defences get conflated constantly and none substitutes for another.

<div class="project__table-wrap">
  <table class="project__table">
    <caption>Four defences, none a substitute for another</caption>
    <thead>
      <tr><th scope="col">Defence</th><th scope="col">What it covers</th></tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Command-construction safety</th>
        <td>Stops argv smuggling metacharacters into <code>execve</code>, and says nothing about who asked.</td>
      </tr>
      <tr><th scope="row">Execution isolation</th><td>A container's job.</td></tr>
      <tr><th scope="row">Provenance</th><td>Carries the origin claim.</td></tr>
      <tr><th scope="row">Application trust policy</th><td>Stays yours.</td></tr>
    </tbody>
  </table>
</div>

umbra also ships no denylist, so an empty guardfile grants nothing and protects
nothing. The policy is the thing you write, not the thing you install.
{% endsection %}

{#- Related writing does not render. It has no links until the first post
    in the cluster is promoted. See coilysiren/website#128 for why an
    unpromoted post is not a linkable target. -#}

{% section { id: "stack", extraClass: "project__chain", band: "penumbra", accent: "context",
             label: "One boundary, three proofs",
             heading: "Constrain what an agent can do, and prove what it did." } %}
{% set here = "umbra" %}
{% include "components/project-chain.njk" %}
{% endsection %}

{% section { id: "reference", band: "umbra", accent: "reference",
             label: "Repository and docs",
             heading: "Reference" } %}
<ul class="project__links">
  <li><a href="/projects/umbra/docs/">Documentation</a></li>
  <li><a href="https://github.com/coilyco-flight-deck/umbra">Repository ↗</a></li>
  <li><a href="https://github.com/coilyco-flight-deck/umbra/blob/main/docs/FEATURES.md">docs/FEATURES.md ↗</a></li>
  <li><a href="https://github.com/coilyco-flight-deck/umbra/blob/main/docs/architecture.md">docs/architecture.md ↗</a></li>
</ul>
<p class="project__byline">
  <span>Built by <a href="/">Kai Ase Siren</a></span>
  <span>MIT licensed</span>
</p>
{% endsection %}
