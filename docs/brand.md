# Brand

Why every colour on this site sits on one hue, which ones are allowed to leave
it, and what the audit found before the change.

## The audit

The palette was measured in OKLCH rather than judged by eye, because the
complaint ("teal and pastel pink") and the file (`$mid-purple`, `$dark-purple`,
`$deep-ink`) disagreed about what was wrong.

The site's purples were never off-brand. All three sat within 3 degrees of the
brand purple's hue. What had gone wrong was chroma: the brand purple carries
0.262, and the site's structural purples carried 0.043 to 0.074. Same hue, the
colour drained out, which is what read as dusty rather than purple.

The genuinely foreign colours were ten values, not a palette:

- `$light-blue` `#dff0ea` and `$mid-blue` `#95adbe` - 121 and 55 degrees off
- `$sage` `#7f9f8d` and `$focus` `#f0bd68` - 134 and 145 degrees off
- `$coral` `#dc8f72` - 107 degrees off, and the bar on every writing card
- teal-green `#273b38` and rust `#4b302f` in `not-found` and `portfolio`, 110
  and 88 degrees off, plus a warm `#f5e7e0` band at 115
- `--quiet` `#9aabc4` at 36 and `--sage` `#93b7a4` at 132, on the project pages

Hue stops being meaningful below about 0.02 chroma, so `$paper` is listed as a
warm tint rather than by an angle.

## The rule

**Structure sits on hue 294.** Grounds, surfaces, text, rules, caps, tiles and
accents differ in lightness and chroma, never in hue. Variety that used to come
from hue now comes from lightness, which is why the three section caps and the
three recovery tiles on `/404` are one colour at three values.

**A colour leaves 294 only when the meaning is locked to a hue.** `$refuse` is
amber, `$cost` is red, `$grant` is green, `$error` is crimson. A warning that
matched the brand would stop reading as a warning. Everything that is context
rather than signal comes home: `$context` (the wider system) and `$reference`
are both purple now, separated by chroma.

These are named for the job and not the pigment, which is the second half of
the same rule. The old names were inherited from the palette this change
evicted, and two had stopped being true - `$sage` was a pale purple named after
a grey-green herb, and `$coral` still carried the name of the salmon that
started all this. A token called `$mint` invites someone to use it because it
is a nice green. A token called `$grant` does not.

**An off-hue register may mark, but never fill.** Section bands wash in the
brand hue and carry their register on the border and the label. Before this,
a mint section washed the whole band green.

## What the rules do not constrain

Only hue. Contrast, weight, thickness and edges are always available and cost
nothing, so a border that needs to be sharper gets to be sharper.

That distinction matters because the two are easy to confuse. A cap is flanked
by a dark page above and a near-white card below, so it has to hold two edges
at once, and moving its colour toward either one softens the other. Swept
across the brand hue, the best a fill can do is L 0.60, where the weaker edge
reaches 4.10:1 against 3.14:1 for `$brand-purple`. On screen that version reads
*softer*, because the edge a reader actually looks at is the one against the
card, and the optimisation moved the bar toward it.

So the caps keep the saturated purple and take a 2px `$deep-ink` hairline where
they meet the card. Structure, not hue, and the metric alone would have picked
the worse one.

## The ramp

Ground and text replay the OKLab ladder fitted for the tracker boards, on the
brand hue. The brand purple `#7c2bef` is what that ladder emits at L 0.530
C 0.262, which is the value rendered in the Blender cylinder study, within one
of 255 on one channel. The mark colour and the ramp agree by construction
rather than by hand.

`$brand-purple` is 3.14:1 on `$deep-ink`. It fills and marks, and never carries
small text. `$light-purple` at 6.77:1 is the accent that does.

## What the change fixed on the way

The focus ring was amber `#f0bd68`, which cleared the dark ground at 11.09:1
and sat at **1.65:1 on `$paper`**, below the 3:1 WCAG 2.2 minimum for a focus
indicator. `$focus` is now `#a46bff`, the only candidate clearing 3:1 against
both grounds at once: 5.57:1 on the dark, 3.27:1 on the light.

## What this change does not reach

The banner art under `src/images/banners/` is raster, so no palette change
touches it. Measured, the banner **grounds** are already on brand at 2.8 degrees
off, and their **accents** drift 44 to 61 degrees into steel blue at chroma
0.05. Regenerating them is tracked separately.

## Verification

`cypress/e2e/accessibility.cy.ts` runs axe with `wcag2aa` over every emitted
route, which is what makes a palette change checkable rather than asserted. Run
it before trusting one: see [verification](verification.md).
