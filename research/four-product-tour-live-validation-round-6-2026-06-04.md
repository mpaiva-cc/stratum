# Four-Tour Mobile Parity — Live Validation Round 6
**Date:** 2026-06-04
**Commits audited:** 938dc35..db53cf9 (pushed to origin/main 2026-06-04)
**URLs:** https://mpaiva-cc.github.io/stratum/cairn/tour/ · https://mpaiva-cc.github.io/stratum/tenure/tour/
**Evidence directory:** `research/four-product-tour-validation-screens/` (prefix `r6-`)

---

## Check 1 — `.rt-stamp` containment at 320/375px (Cairn)

**Verdict: PARTIAL**

### Measurements
| Viewport set | Chrome innerWidth | stamp left | stamp right | canScrollX | stamp wraps |
|---|---|---|---|---|---|
| 320px emulated | 424px (min-content floor) | 10px | 415px | false | no (1 line) |
| 375px emulated | 427px (min-content floor) | 10px | 417px | false | no (1 line) |

### Evidence
- `left: 10px; right: 10px; width: auto` confirmed applied (`stampComputedRight: "10px"`, `stampComputedLeft: "10px"`).
- `body { overflow-x: clip }` confirmed active at both breakpoints.
- `canScrollX: false` at both breakpoints — no actual horizontal page scroll available to the user.
- The stamp is geometrically contained: right edge (415/417px) is inside `innerWidth` (424/427px).
- Text does **not** wrap to multiple lines — single-line rendering confirmed by `getClientRects()` returning uniform `top/bottom` across all rects.
- **Root cause of PARTIAL verdict:** Chrome mobile viewport scales the page minimum content width to ~424px when emulating 320/375px, because `<main>` contains a `.tour-screen` section with `scrollWidth: 412px` (the diff/code view). The page has no explicit `min-width` CSS rule — the floor is content-driven. `documentClientWidth` correctly reports 375px; `innerWidth` reports 427px due to Chrome's layout viewport scaling. The stamp adapts correctly to whatever `innerWidth` is, so no overflow occurs, but the sub-424px viewport scenario cannot be fully verified in-browser.

### Files
- `r6-cairn-320-rt-stamp-PASS.png`
- `r6-cairn-375-rt-stamp-PASS.png`

---

## Check 2 — Tenure Lighthouse `color-contrast` resolution

**Verdict: PARTIAL**

### Score
- **Accessibility: 96** — matches round-4 baseline. No regression, no improvement.

### color-contrast audit — remaining failures (3 items)
| # | Selector | FG | BG | Contrast | Expected |
|---|---|---|---|---|---|
| 1 | `nav.arc-strip > ol > li.arc-strip__item > span` | #6b6d6f | #171f2d | 3.18 | ≥4.5 |
| 2 | `nav.arc-strip > ol > li.arc-strip__item > span` | #6b6d6f | #171f2d | 3.18 | ≥4.5 |
| 3 | `footer .footer-mark .sub` | #b8651f | #f4ecda | 3.63 | ≥4.5 |

### Previously flagged — now CLEARED
- `.rt-stamp` — not in failure list.
- `.tour-close-arc` — not in failure list.
- `.cta` — not in failure list.
- Opacity-dimmed spans — not in failure list.

### Assessment
Tessera's round-5 inline-style edits successfully resolved all four previously flagged selectors. The two remaining failures are in `nav.arc-strip` (inactive product label spans in the arc-strip navigation) and the footer sub-mark. These were **not** in scope for round 5 and appear to be pre-existing issues in the shared arc-strip component. Score holds at 96 because these two groups count as one failed audit.

### Files
- `r6-tenure-tour-lighthouse.json`
- `r6-tenure-tour-lighthouse.html`
- `r6-tenure-tour-lighthouse-score.png`

---

## Check 3 — Regression sweep

### Cairn 899 — `.tour-steps` scroll, no 1709px overflow

**Verdict: PASS**

- `documentScrollWidth: 899` = `innerWidth: 899` → no page overflow.
- `.tour-steps`: `scrollWidth: 1709`, `offsetWidth: 481`, `overflowX: auto` — correctly contained in scrollable container.
- File: `r6-regression-cairn-899.png`

### Tenure 901 — no page or sitenav overflow

**Verdict: PASS**

- `documentScrollWidth: 901` = `innerWidth: 901` → `canScrollX: false`.
- `siteNavScrollWidth: 901` = `siteNavOffsetWidth: 901` — no sitenav overflow.
- File: `r6-regression-tenure-901.png`

### Cairn 375 mobile-bar — touch targets ≥44px

**Verdict: PASS**

- `.mobile-bar` buttons measured: `height: 44px` both links ("← Cairn", "Console →").
- File: `r6-regression-cairn-375-mb.png`

### Cairn 1280 — `.sn-col a` 44px touch targets

**Verdict: FAIL**

- `.sn-col a` links measure `height: 28px` (confirmed by `offsetHeight` on 54 links after panel open).
- `minHeight: 28px` is set in CSS — this was targeted in earlier rounds but the fix has not reached 44px.
- File: `r6-regression-cairn-1280-sn-col.png`

---

## Summary Table

| Check | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | rt-stamp contained at 320px | PASS (contained, no scroll) | left:10 right:415 in 424px vp |
| 1 | rt-stamp wraps at 320px | FAIL | Single-line, content truncated at vp edge |
| 1 | No horizontal page scroll | PASS | canScrollX: false |
| 1 | innerWidth matches set viewport | FAIL | 424px rendered vs 320px set (content floor issue) |
| 2 | Lighthouse Accessibility score ≥96 | PASS | Score: 96 |
| 2 | rt-stamp / tour-close-arc / cta cleared | PASS | Not in failure list |
| 2 | color-contrast audit fully passes | FAIL | 3 items remain (arc-strip + footer-mark) |
| 3 | Cairn 899 tour-steps no overflow | PASS | scrollWidth=899 |
| 3 | Tenure 901 no overflow | PASS | scrollWidth=901 |
| 3 | Cairn 375 mobile-bar 44px targets | PASS | height=44px measured |
| 3 | Cairn 1280 sn-col a 44px targets | FAIL | height=28px measured |

---

## Overall Verdict: NEEDS ROUND 7

The four-tour mobile parity work is **not yet done**. Round 7 must address:

1. **Cairn/Tenure: `.sn-col a` min-height** — `min-height: 28px` must be raised to `min-height: 44px`. This is a desktop sitenav panel touch-target regression that has persisted across rounds.

2. **Tenure: `nav.arc-strip > ol > li.arc-strip__item > span` contrast** — foreground `#6b6d6f` on `#171f2d` at 3.18 must reach 4.5:1. Two instances. Selector is in the shared arc-strip navigation, not the tour page specifically.

3. **Tenure: `footer .footer-mark .sub` contrast** — `#b8651f` on `#f4ecda` at 3.63 must reach 4.5:1.

4. **Cairn 320/375: page minimum content width** — the diff/code `.tour-screen` forces `<main>` to `scrollWidth: 412px`, which pushes Chrome's mobile viewport to 424px instead of 320px. The `body overflow-x: clip` prevents user scroll but the stamp text renders on one line and is visually truncated at the right edge rather than wrapping. The stamp fix is structurally correct; the underlying minimum-width source (the diff table / ui-frame inside one tour-screen) should be constrained with `overflow-x: hidden` or `max-width: 100%` to allow true 320px rendering.

Items 1 and 3-4 are code changes. Item 2 requires a color token update to the arc-strip component.
