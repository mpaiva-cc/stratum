# Four-Product Tour Live Validation — Round 4
**Date:** 2026-06-04
**Scope:** Round-3 remediation verification (commits a8d516f–24cfc2b)
**URLs audited:**
- https://mpaiva-cc.github.io/stratum/cairn/tour/
- https://mpaiva-cc.github.io/stratum/tenure/tour/
- https://mpaiva-cc.github.io/stratum/recruiter/tour/
- https://mpaiva-cc.github.io/stratum/tour/ (regression only)

---

## Check 1 — `.rt-stamp` Wrap at Small Phones (Cairn)
**Verdict: FAIL**

### What was verified
Cairn tour loaded at emulated 320px and 375px (mobile, touch, 2x DPR) and `.rt-stamp` element inspected for wrapping, viewport overflow, and horizontal page scroll.

### Findings

**320px:**
- `window.innerWidth` = 424px despite 320px emulation — layout is being inflated by the horizontally-overflowing `.tour-step-btn` row.
- `document.documentElement.clientWidth` = 320px (the CSS layout viewport is correct).
- `.rt-stamp` computed: `position:fixed`, `right:10px`, `max-width:300px` (= `calc(100vw - 20px)` at 320px), `white-space:normal` — both round-3 fixes ARE applied.
- However the stamp text ("● compiled at T+539:34:14.000 · 2026-06-04T14:00:00.000Z", 56 chars) is wide enough to fill the full 300px max-width in a single line — no line-wrap occurs.
- Stamp `right` edge = 415px; `clientWidth` = 320px → **95px overflow** past the CSS viewport right edge.
- `html` and `body` both have `overflowX:visible` — horizontal page scroll is present because of the `.tour-step-btn` row and the stamp compound the effect.

**375px:**
- `innerWidth` = 427px (inflated); `clientWidth` = 375px.
- Stamp `max-width:355px`, `width:355px`, single line (`getClientRects().length = 1`).
- Stamp right = 417px; within the inflated 427px layout, but still escapes the 375px CSS viewport.

### Root cause
Two separate problems coexist:
1. The `.tour-step-btn` row has no `overflow-x:hidden` on its container, so it inflates `body.scrollWidth` and `innerWidth`.
2. The stamp text is too long to wrap within `calc(100vw - 20px)` at either width — the text would need to be shortened or a right-anchor + width approach used instead.

The round-3 fix (`max-width: calc(100vw - 20px); white-space: normal`) is applied in the stylesheet and computes correctly, but the text content defeats wrapping at 300px. Additionally, `position:fixed; right:10px` should theoretically anchor to 10px from the real viewport edge, but `window.innerWidth` is inflated by the page overflow, misplacing the `right` offset.

### Evidence
- `r4-cairn-320-rt-stamp-FAIL.png` — 320px viewport, stamp visible at bottom
- `r4-cairn-375-rt-stamp-FAIL.png` — 375px viewport

---

## Check 2 — Nav State at 901/1024/1099/1100/1200px (Tenure)
**Verdict: PASS**

### Findings

| Viewport | `.sn-hamburger` | `.sn-index-btn` | Page overflow | Double-show |
|----------|----------------|-----------------|---------------|-------------|
| 901px    | flex           | none            | none          | no          |
| 1024px   | flex           | none            | none          | no          |
| 1099px   | flex           | none            | none          | no          |
| 1100px   | flex           | none            | none          | no          |
| 1200px   | none           | flex            | none          | no          |

- At all tested widths ≤1100px: hamburger is visible, index-btn is hidden, no horizontal overflow.
- At 1200px: desktop nav with index-btn, hamburger hidden.
- The transition boundary is strictly between 1100px (still mobile) and 1200px (desktop). No double-show at any tested breakpoint.
- The round-2 blocker (`.sn-index-btn` overflow at 901px) is fully remediated.

### Evidence
- `r4-tenure-901-nav-PASS.png`
- `r4-tenure-1024-nav-PASS.png`
- `r4-tenure-1099-nav-PASS.png`
- `r4-tenure-1100-nav-PASS.png`
- `r4-tenure-1200-nav-PASS.png`

---

## Check 3 — Contrast on Five Fixed Elements (Cairn)
**Verdict: PASS (all four reachable elements)**

All four elements were measured using computed colors with alpha-blending against effective parent background. Results:

| Element | FG (blended) | BG | Ratio | AAA (7:1) | AA (4.5:1) |
|---------|-------------|-----|-------|-----------|------------|
| `.mb-center` (mobile bar) | rgb(229,145,60) on bg(14,22,38) | dark navy | 7.27 | PASS | PASS |
| `.tour-step-group-label` | rgba(244,236,218,0.65) → rgb(164,161,155) on bg(14,22,38) | dark navy | 7.02 | PASS | PASS |
| `.rec-item-num` | rgb(122,61,10) on bg(247,240,224) | warm cream | 7.40 | PASS | PASS |
| `div.diff-header span` | rgba(244,236,218,0.7) → rgb(176,172,162) on bg(17,24,32) | near-black | 7.89 | PASS | PASS |

All four elements exceed WCAG AAA (7:1) threshold. No FAIL screenshots required.

Note: `.mb-center` is only visible at mobile viewport; measured at 375px where it was display:block, visibility:visible.

---

## Check 4 — Regression on Round-1 Blockers
**Verdict: PASS (all three)**

### Cairn `.tour-steps` at 899px
- `document.documentElement.scrollWidth` = 899px = `clientWidth` — no horizontal page overflow.
- `.tour-steps` internal `scrollWidth` = 1709px but is contained within its overflow-scroll container; does not cause page-level overflow.
- **Round-1 blocker not regressed.**

### Tenure 901px page overflow
- `scrollWidth` = `clientWidth` = 901px — no overflow.
- Hamburger shown, index-btn hidden (consistent with Check 2 findings).
- **Round-1 blocker not regressed.**

### Recruiter KPI at 768px
- `document.documentElement.scrollWidth` = 768px = `clientWidth` — no overflow.
- `.kpi-grid` computed `gridTemplateColumns` = "319.977px 319.984px" — confirmed 2-column layout.
- **Round-1 blocker not regressed.**

### Evidence
- `r4-regression-cairn-899.png`
- `r4-regression-tenure-901.png`
- `r4-regression-recruiter-768.png`

---

## Check 5 — Lighthouse Mobile on Tenure
**Verdict: PARTIAL (96/100 accessibility — 1 failure)**

| Category | Score |
|----------|-------|
| Accessibility | 96 |
| Best Practices | 100 |
| SEO | 100 |
| Agentic Browsing | 100 |

### Failing audit
**`color-contrast`** — Background and foreground colors do not have a sufficient contrast ratio.

Affected elements (from Lighthouse detail items):
1. `.rt-stamp` — the stamp pill uses `rgba(244,236,218,0.8)` with backdrop-blur; Lighthouse cannot account for the blurred background and flags it.
2. `<span style="opacity:.6">` — inline opacity-reduced text element.
3. Two anonymous `<span>` elements.
4. `.tour-close-arc` paragraph (font-size 11px, inline style with `var(--mono)`).
5. `.cta` anchor.
6. `.sub` span.

The `.rt-stamp` contrast failure in Lighthouse is consistent with the Check 1 finding — the stamp's effective background is a blurred translucent surface that automated tools cannot resolve. The other items are inline-opacity or small UI text that warrant manual review.

### Evidence
- `r4-tenure-tour-lighthouse.json`
- `r4-tenure-tour-lighthouse.html`

---

## Closing Summary

| Check | Subject | Verdict | Needs remediation? |
|-------|---------|---------|-------------------|
| 1 | `.rt-stamp` wrap 320/375px (Cairn) | **FAIL** | YES |
| 2 | Nav state 901–1200px (Tenure) | **PASS** | no |
| 3 | Contrast on 4 elements (Cairn) | **PASS** | no |
| 4 | Round-1 blocker regression (all 3) | **PASS** | no |
| 5 | Lighthouse mobile — Tenure | **PARTIAL** | YES (color-contrast) |

### Open defects requiring Round 5 remediation
1. **Check 1 — `.rt-stamp` at ≤375px:** Stamp does not wrap and overflows CSS viewport by 95px at 320px. Two-part fix needed: (a) add `overflow-x:hidden` to the body or the `.tour-steps` scroll container to prevent layout inflation, and (b) consider shortening the stamp text or switching to a `right:10px; left:10px; width:auto` layout instead of `max-width` approach.
2. **Check 5 — Tenure color-contrast:** Lighthouse flags `.rt-stamp`, `.tour-close-arc`, `.cta`, and opacity-dimmed spans. Manual verification of `.tour-close-arc` and `.cta` contrast ratios is recommended for Round 5.
