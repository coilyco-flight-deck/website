---
layout: layouts/project.njk
pagination:
  data: site.projectVariants
  size: 1
  alias: variant
permalink: "{% if variant == 'vanity' %}vanity/housecast/index.html{% else %}projects/housecast/index.html{% endif %}"
title: housecast, a YAML driven roster framework for agent context | Kai Ase Siren
description: You changed what a role is allowed to do. The evaluation that checked it did not notice. housecast composes agent context from one YAML roster and derives the evaluation board from the same file.
canonical: /projects/housecast/
robots: follow, index
softwareSchema:
  name: housecast
  claim: A YAML driven roster framework for agent context
  repo: https://forgejo.coilysiren.me/coilyco-flight-deck/housecast
  license: https://spdx.org/licenses/MIT.html
project:
  slug: housecast
  # No mark drawn yet, so the hero renders without one rather than 404ing.
  hasMark: false
  eyebrow: Roster // the context an agent loads
  claim: A YAML driven roster framework for agent context
  hook: You changed what a role is allowed to do. The evaluation that checked it did not notice.
  caption: The frontend role never declares what it owns. The boundary's own owner line is what makes this a deferral, and the scope string is what a grader reads a transcript against.
  meta:
    - Preview
    - MIT
    - Python
  contents:
    - { id: problem, title: The problem }
    - { id: how-it-works, title: How it works }
    - { id: roster, title: Reading a roster }
    - { id: not-a-framework, title: What it is not }
    - { id: reference, title: Reference }
  sample: |
    <pre><code><span class="k">boundaries:</span>
      <span class="k">suggest-external-comms:</span>
        <span class="k">owner:</span> advocate

    <span class="k">roles:</span>
      <span class="k">frontend:</span>
        <span class="k">defers:</span> [<span class="s">"build-foundational-software"</span>, <span class="s">"modify-live-backend"</span>]
        <span class="k">scoped:</span>
          - <span class="k">name:</span> suggest-external-comms
            <span class="k">scope:</span> <span class="s">"labels, empty states, and error text inside a
              surface you own, never words addressed outward"</span></code></pre>
---

{% section { id: "problem", band: "penumbra", accent: "cost",
             label: "The problem, and what it costs to leave alone",
             heading: "A charter written as prose can't fail a test." } %}
An agent's role usually lives in a prompt file. What it does, what it may touch,
what it hands to someone else. That file is the entire specification, and the
only thing enforcing it is that the model read it carefully on the way past.

Add a second role and the boundaries between them get stated twice, in two
places, in whatever words each file reached for. By the seventh, the honest
answer to which role owns a given capability is that it depends who you ask, and
nothing in the system disagrees with either answer.

The evaluation is a separate artifact, and that is where it costs. Someone wrote
challenges against the roles as they were. Then a role changed. The board still
runs, still reports a pass rate, and has quietly stopped describing what ships.
Nothing announces the gap, because both halves are healthy on their own.
{% endsection %}

{% section { id: "how-it-works", band: "lilac", accent: "grant",
             label: "What it does about it",
             heading: "One file is the source, and the board is a consequence of it." } %}
housecast reads roles, personalities, and boundaries from one YAML roster. It
resolves each role's personality meld and its boundary allocation, derives the
identity primitives including a favorite colour solved jointly across the whole
roster, and emits an immutable bundle with a manifest and a trace.

Boundary allocation is not something a role declares. A boundary names its owner,
and every other role either defers it or holds a stated slice of it. A role
can't claim what it doesn't own, because the claim is derived from the other
side of the relationship rather than asserted on this one.

The challenge board derives from that same file. Adding a boundary or changing
an adjacency changes which challenges exist, so every role change moves what
gets tested. A human still writes the prompt into each derived
challenge, and a human scores the run, because the thing being judged is whether
a transcript honoured a sentence.
{% endsection %}

{% section { id: "roster", band: "umbra", accent: "grant",
             label: "What it looks like in use",
             heading: "Three keys, and the fourth thing is derived." } %}
A roster carries `boundaries`, `personalities`, and `roles`, plus an invariant
appended verbatim to every set of instructions it emits. Each of the first three
is a definition with a body, and a role points at them by name rather than
restating them.

What a role states is what it defers and what it holds within a scope. What it
owns arrives from the other direction, off the boundary's own `owner` line. The
shipped roster spells the rule out in its own header: a role carries its
deferrals, then its scoped grants, then the one boundary whose owner is that
role, and it may not declare that last one itself.

The scope string is prose and it is load-bearing. It is the sentence a grader
reads a transcript against, which is why "labels and error text inside a surface
you own" earns its place and "handles frontend copy" wouldn't.
{% endsection %}

{% section { id: "not-a-framework", band: "lilac", accent: "refuse",
             label: "What it doesn't do",
             heading: "It composes context. It runs nothing." } %}
housecast emits a bundle and stops. `acompose` is downstream of it, rendering
that bundle into harness surfaces and launching them. The two are often read the
other way round, and that inverts the relationship the project exists to
establish.

It is not a prompt manager and not an agent framework. No runtime, no model
client, no orchestration. The grading half holds no runner either, which is the
seam that lets a board be regraded without re-running it and a run be repeated
without regrading it.

There is no PyPI release yet, so consumers depend on it from Forgejo with uv. The
Go engine it was ported from still exists and still composes, and the two are
held byte-identical until that one is deleted.
{% endsection %}

{#- No stack section yet. The four-step chain in src/data/stack.js is umbra,
    mcp-beaver and agent-compose, and where housecast sits in it is a
    decision rather than a gap. Related writing is absent for the same reason it
    is absent on every project page: it has no promoted post to point at. -#}

{% section { id: "reference", band: "umbra", accent: "reference",
             label: "Repository and docs",
             heading: "Reference" } %}
<ul class="project__links">
  <li><a href="/projects/housecast/docs/">Documentation</a></li>
  <li><a href="https://forgejo.coilysiren.me/coilyco-flight-deck/housecast">Repository ↗</a></li>
</ul>
<p class="project__byline">
  <span>Built by <a href="/">Kai Ase Siren</a></span>
  <span>MIT licensed</span>
</p>
{% endsection %}
