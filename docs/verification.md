# Verification

What to run before trusting a build.

```text
just build
just test-quick
just test-e2e-ci
just pre-commit-all
```

## What is tested, and what is deliberately not

The site renders with no client-side JavaScript, so there is no application
logic to unit test. Every test here answers one of two questions instead: did
Eleventy emit what was meant, and does the CSS still hold up under real layout.
Anything a browser is not required to observe does not get a browser.

- **Build output** - [`src/build-output.test.ts`](../src/build-output.test.ts)
  reads `dist/` directly under vitest. It covers the sitemap and `llms.txt`
  route set, `robots` metadata per route, retired routes emitting nothing, the
  absence of render-blocking script, one canonical host across every emitted
  URL, the `Person` JSON-LD parsing on exactly the two pages that carry it, the
  social card's declared dimensions matching the committed JPEG, one non-empty
  `h1` and the `X | Kai Ase Siren` title pattern on every indexed page, and each
  post's `<time>` matching its `BlogPosting` `datePublished`, and the Atom feed
  carrying exactly the promoted posts newest first with absolute links. No
  browser, runs in milliseconds.
- **Accessibility** - [`cypress/e2e/accessibility.cy.ts`](../cypress/e2e/accessibility.cy.ts)
  runs `axe-core` over every route the build emits, with coverage derived from
  `dist/` rather than listed. Details and the load-bearing numbers:
  [accessibility](accessibility.md).
- **Page weight** - [`cypress/e2e/weight.cy.ts`](../cypress/e2e/weight.cy.ts)
  measures real transfer per route against a ceiling. 150K by default, with
  named exceptions that only ever go down. The site's shape is static HTML plus
  local CSS and fonts, and nothing asserted that until it found `/about/` at
  34MB, now `coilysiren/website#129`.
- **Layout invariants** - [`cypress/e2e/basic.cy.ts`](../cypress/e2e/basic.cy.ts)
  covers only what needs real layout: no sideways overflow at 390px, the About
  portrait sitting beside its copy at 1280px, no third-party origin at all, and
  media sized by the stylesheet rather than by its reserved box.

## Two numbers worth keeping

**Why `/about/` is the one ceiling that went up.** The width and height
attributes that reserve an image's box also map to the `height` property, which
outranks `aspect-ratio`, so without the reset in `layout.scss` a box collapses
onto the file's own pixel height. A positional test misses that entirely,
because the element is still in the right place and only the wrong shape. The
1200K ceiling was measured while the portrait drew at its own pixel height,
which made the page 770px taller than it should have been and pushed three
home-slide images past the lazy threshold. Correcting the portrait pulled them
back in: 1027K before the fix, 1714K after, and the 687K between them is those
three files. They are already crisp 2x at 2560, so resizing wins nothing back
but softness.

Copy is deliberately not pinned. Asserting exact wording turns every copy edit
into a two-file edit and protects nothing, because changed words were changed
on purpose. Nor does anything assert that a retired class name is still absent.
That is archaeology against a thing that already left.

Spacing and rhythm are not asserted either. Those assertions rot faster than
anything else in a stylesheet, and looking at the page catches them better.
Contrast is the exception: it looks like taste and is arithmetic.

## Two traps this suite fell into once

Both of these passed while measuring nothing, so both are worth knowing before
writing another assertion.

**Root `scrollWidth` cannot see clipped overflow.** `.portfolio-home` sets
`overflow: hidden` to contain the tilted portrait and the scattered background
shapes. That clip also swallows genuine overflow, so a 700px element inside a
390px viewport leaves `document.documentElement.scrollWidth` reading exactly
390. The overflow test therefore walks every box that clips and compares its
`scrollWidth` against its `clientWidth`, rather than trusting the page total.

**`initiatorType` is not a reliable allowlist key.** A `<link rel=stylesheet>`
reports as `link`, a webfont pulled from inside a stylesheet reports as `css`,
and a tracker reports as `script`. An allowlist of types silently misses
whichever one it forgot, and an external Google Fonts stylesheet walked past a
`css`/`font`/`script` filter untouched. The third-party test denies by origin
and allows the single intended embed instead.

## See also

- [FEATURES.md](FEATURES.md) - inventory of what ships.
- [staging.md](staging.md) - staging image boundary and local verification.
- [ci-workflows.md](ci-workflows.md) - every workflow and its trigger.
