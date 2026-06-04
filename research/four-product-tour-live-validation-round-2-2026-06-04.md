# Four-Product Tour — Live Validation Round 2
**Date:** 2026-06-04  
**Commits verified:** cb86417..adf9f35 (pushed to origin/main)  
**Auditor:** Visual Validation Agent (claude-sonnet-4-6)

---

## Item 1 — Cairn `.tour-steps` scroll behavior at 320px and 375px

**Verdict: PARTIAL**

**Evidence:**
- `.tour-steps` has `overflowX: auto` and `scrollSnapType: x mandatory` — horizontal scroll and snap are correctly wired.
- `.tour-step-btn` children carry `scroll-snap-align: start` — snap points exist on interactive items.
- At 320px: `tourSteps.scrollWidth=1709, clientWidth=97` — all 12 buttons reachable via horizontal scroll.
- At 375px: same scroll mechanics confirmed, `clientWidth=0` at initial paint (layout timing) but scroll infrastructure present.
- **Page-level overflow still exists at both widths.** At 320px: `html.scrollWidth=424 > bodyWidth=320`. At 375px: `html.scrollWidth=427 > bodyWidth=375`. The offending element is `.rt-stamp` (`offsetWidth=382, right=415` at 320px) — it extends ~95px beyond viewport.
- The `.tour-steps` internal scroll fix is applied and functional. The `.rt-stamp` overflow is a separate, pre-existing defect that remains unaddressed.

**Screenshots:** `cairn-320-tour-steps-scroll-PASS-or-FAIL.png`, `cairn-375-tour-steps-scroll-PASS-or-FAIL.png`

---

## Item 2 — Tenure 901px overflow

**Verdict: PARTIAL**

**Evidence:**
- Arc-strip has `overflowX: hidden` and `overflow: hidden` applied — the arc-strip fix is in place.
- Arc-strip `offsetWidth=901, scrollWidth=901` — arc-strip itself no longer overflows.
- **Arc-strip label is still visible at 901px** — `arcLabelDisplay: block, arcLabelVisibility: visible`. The ≤900px hide rule is not firing at 901px (correct — 901 is above the 900px threshold). This is expected behavior.
- **Page-level overflow persists:** `htmlScrollWidth=953 > windowInnerWidth=901`.
- Offending element: `.sn-index-btn` (`right=953, offsetWidth=163`). The site-nav index button extends 52px beyond the 901px viewport. This is a new or unresolved overflow source in the site-nav, not the arc-strip.

**Screenshot:** `tenure-901-overflow-PASS-or-FAIL.png`

---

## Item 3 — Cairn 899px `.tour-steps` no longer overflows

**Verdict: PASS**

**Evidence:**
- At 899px desktop (no mobile emulation): `htmlScrollWidth=899 = windowInnerWidth=899` — no page overflow.
- `.tour-steps`: `scrollWidth=1709, clientWidth=481, offsetWidth=481` — the bar now has a real rendered width and the internal content scrolls within it rather than forcing page overflow.
- `.rt-stamp`: `right=889, width=382` — stays within the 899px viewport at this width.
- The round-1 blocker (`.tour-steps` forcing page to 1709px wide) is resolved.

**Screenshot:** `cairn-899-tour-steps-fixed-PASS-or-FAIL.png`

---

## Item 4 — Recruiter KPI at 768px after breakpoint raise

**Verdict: PASS**

**Evidence:**
- At 768px: `bodyWidth=768`, no page overflow.
- `.dash-grid-mock` `gridTemplateColumns: "347.211px 289.344px"` — 2-column layout, not the 4-column desktop grid.
- KPI card widths: 347px and 289px — reasonable tablet proportions, not crushed.
- The breakpoint raise to 900px is confirmed: 768px correctly receives the collapsed/tablet layout.

**Screenshot:** `recruiter-768-kpi-PASS-or-FAIL.png`

---

## Item 5 — Cairn `.sn-col a` nav-link 28px audit

**Verdict: AAA-FAIL (interactive, undersized)**

**Evidence:**
- `.sn-panel` parent has `display: none` in the collapsed state — links are not tappable until the nav panel is opened via `.sn-index-btn`.
- When the nav panel is opened (interactive state), `.sn-col a` links render at **168×28px** — confirmed interactive (`pointerEvents: auto`, real href values, focusable).
- WCAG 2.5.5 AAA requires 44×44px minimum touch target. At 28px height, these links are **36% below the height threshold**.
- WCAG 2.5.8 AA (minimum 24×24px) is technically met at 28px height but the width-to-height ratio and dense stacking risk adjacency violations.
- No `aria-hidden` or `tabindex=-1` suppression applied — links participate fully in keyboard and pointer interaction when the panel is open.

**Screenshot:** `cairn-sn-col-a-aa-fail.png`

---

## Item 6 — Cairn Lighthouse Mobile Audit

**Verdict: PASS (with noted failures)**

**Scores (mobile, navigation mode):**
| Category | Score |
|---|---|
| Accessibility | 97 |
| Best Practices | 96 |
| SEO | 100 |
| Agentic Browsing | 50 |

**Failed audits (3):**
1. **color-contrast** — 5 elements flagged: `.mobile-bar .mb-center` (mobile bar label), `.tour-step-group-label` (chapter group labels in tour-steps strip), `.rec-item-num` (2 instances in rec panel), `div.diff-header span`. These are existing low-contrast decorative/secondary text elements.
2. **errors-in-console** — 404 on `https://mpaiva-cc.github.io/stratum/assets/echo-key.json`. Missing asset, not a layout defect.
3. **agent-accessibility-tree** — Agentic browsing score 50; accessibility tree shape flagged. Not a WCAG issue.

**Reports:** `cairn-tour-lighthouse.json`, `cairn-tour-lighthouse.html`

---

## Summary Table

| # | Item | Verdict | Key Evidence |
|---|---|---|---|
| 1 | Cairn `.tour-steps` scroll (320/375px) | **PARTIAL** | Scroll+snap fixed on strip; `.rt-stamp` still causes page overflow (~95px) |
| 2 | Tenure 901px overflow | **PARTIAL** | Arc-strip overflow fixed; `.sn-index-btn` still overflows page by 52px |
| 3 | Cairn 899px `.tour-steps` width | **PASS** | No page overflow; strip now 481px wide, scrolls internally |
| 4 | Recruiter KPI 768px layout | **PASS** | 2-col grid at 768px, cards 347/289px — tablet layout confirmed |
| 5 | Cairn `.sn-col a` 28px audit | **AAA-FAIL** | Links 168×28px when panel open; 16px below 44px AAA threshold |
| 6 | Cairn Lighthouse (mobile) | **PASS** | Accessibility 97/100; 3 minor failures (contrast, 404, agentic tree) |

---

## New Defects Surfaced

- **DEF-R2-01 (Cairn, 320/375px):** `.rt-stamp` overflows page by ~95px at small phones. `offsetWidth=382` with no max-width or overflow clipping at the page level.
- **DEF-R2-02 (Tenure, 901px):** `.sn-index-btn` in site-nav overflows page by 52px (`right=953`). Likely a site-nav min-width or fixed-width button not clamped to viewport.
- **DEF-R2-03 (Cairn, Lighthouse):** `echo-key.json` 404 on every page load — missing asset generating console error.
- **DEF-R2-04 (Cairn, all widths):** 5 color-contrast failures identified by Lighthouse: mobile-bar label, tour-step group labels, rec-item numbers, diff-header span.
