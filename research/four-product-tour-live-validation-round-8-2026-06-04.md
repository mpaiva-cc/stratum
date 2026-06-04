# Round-8 Live Render Verification — 2026-06-04

**Commits verified:** 348b2fe..330ad59  
**Auditor:** Claude Code (visual validation agent)  
**Pages audited:**
- https://mpaiva-cc.github.io/stratum/cairn/tour/
- https://mpaiva-cc.github.io/stratum/tenure/tour/
- https://mpaiva-cc.github.io/stratum/recruiter/tour/
- https://mpaiva-cc.github.io/stratum/tour/

---

## Check 1 — `.sn-col a` 44px confirmed in render

**Verdict: PASS**

The `.sn-col a` elements live inside `.sn-panel`, which is `display:none` in its default collapsed state. Measuring at 1280px with the panel forced to `display:block`:

| Metric | Value |
|---|---|
| `offsetHeight` | 44px |
| `getComputedStyle().minHeight` | 44px |
| `getComputedStyle().height` | 44px |
| `getBoundingClientRect().height` | 44px |

The `min-height: 44px` rule is resolving correctly. The inline-style override from the prior ~70 HTML files has been cleared. Total `.sn-col a` elements found: 54.

**Evidence:** `r8-cairn-1280-sn-col-a-PASS.png` (panel forced open to show nav links at measured height)

---

## Check 2 — Arc-strip span contrast on dark

**Verdict: PARTIAL**

Lighthouse mobile accessibility audit on Tenure tour returned **100/100** (52 audits passed, 0 failed). The `color-contrast` audit is no longer flagged. However, the computed color value in render does not match the claimed fix.

**Claimed fix:** `rgba(244,236,218,.75)` → 8.53:1  
**Actual rendered color on both Tenure and Cairn:** `rgba(244, 236, 218, 0.6)` — alpha is 0.60, not 0.75

**Contrast at actual alpha (0.60), composited on `color(srgb 0.0909804 0.119843 0.177255)` ≈ `#171e2d`:**

| Alpha | Contrast ratio | WCAG AA (4.5:1) | WCAG AAA (7.0:1) |
|---|---|---|---|
| 0.60 (actual) | **5.88:1** | PASS | FAIL |
| 0.75 (claimed) | 8.44:1 | PASS | PASS |
| 1.00 (opaque) | 14.10:1 | PASS | PASS |

The fix passes WCAG AA (Lighthouse concurs — score 100) but does not reach the claimed AAA target of 8.53:1. The alpha discrepancy (0.60 vs 0.75) is present on both Cairn and Tenure. The CSS or generator sweep applied 0.60 where 0.75 was intended.

**Tenure Lighthouse score: 100 (Accessibility)**  
**Reports saved:** `r8-tenure-tour-lighthouse.json`, `r8-tenure-tour-lighthouse.html`  
**Screenshot:** `r8-tenure-tour-lighthouse-accessibility-PASS.png`

---

## Check 3 — Footer `.footer-mark .sub` contrast on paper

**Verdict: FAIL**

### Recruiter tour (`/recruiter/tour/`)

| Metric | Value |
|---|---|
| Computed `color` | `rgb(184, 101, 31)` = `#b8651f` |
| Expected color | `rgb(122, 61, 10)` = `#7a3d0a` (`--ochre-link`) |
| Background | `rgb(247, 240, 224)` ≈ `--paper` (#f4ecda) |
| Actual contrast ratio | **3.76:1** |
| WCAG AA (4.5:1) | FAIL |
| WCAG AAA (7.0:1) | FAIL |
| Target contrast (if `#7a3d0a`) | 7.40:1 — would PASS AAA |

The color rendering is `#b8651f`, not the claimed `#7a3d0a`. The `--ochre-link` token swap did not land in the recruiter tour HTML. Either the sweep missed this file or the token value in the compiled CSS resolves differently than expected.

### Main tour (`/tour/`)

No `.footer-mark .sub` element exists on this page — the footer uses a different structure (`.footer-mark` contains only the wordmark; `.footer-meta` carries the copyright line). This selector scope does not apply to `/tour/`.

**Evidence:** `r8-recruiter-footer-sub-FAIL.png`

---

## Check 4 — Cairn `.tour-screen` overflow + rt-stamp wrap at 320/375

**Verdict: PASS**

Tested with mobile emulation (touch, DPR 2).

### 320px

| Metric | Value | Pass? |
|---|---|---|
| `window.innerWidth` | 320 | — |
| `document.documentElement.scrollWidth` | 320 | no overflow |
| `scrollWidth === innerWidth` | true | PASS |
| `.rt-stamp` width | 300px | < 320 |
| `.rt-stamp` height | 39.9px | multi-line (line-height 14.7px, height ~2.7 lines) |
| `.tour-screen` overflow-x | `hidden` | fix present |
| `.diff-wrap` overflow-x | `auto` | fix present |

### 375px

| Metric | Value | Pass? |
|---|---|---|
| `window.innerWidth` | 375 | — |
| `document.documentElement.scrollWidth` | 375 | no overflow |
| `scrollWidth === innerWidth` | true | PASS |
| `.rt-stamp` width | 355.5px | < 375 |
| `.rt-stamp` height | 39.9px | multi-line |
| `.tour-screen` overflow-x | `hidden` | fix present |
| `.diff-wrap` overflow-x | `auto` | fix present |

Both viewports reach true width with no horizontal page scroll. The rt-stamp wraps to ~2.7 lines at both breakpoints. The `overflow-x: hidden` and `overflow-x: auto` rules are active in render.

**Evidence:** `r8-cairn-320-rt-stamp-wrap-PASS.png`, `r8-cairn-375-rt-stamp-wrap-PASS.png`

---

## Closing Summary

| Check | Target | Verdict | Note |
|---|---|---|---|
| 1 · `.sn-col a` 44px at 1280px | `offsetHeight` ≥ 44 | **PASS** | 44px confirmed, inline override cleared |
| 2 · Arc-strip span contrast | AAA 8.53:1 claimed; Lighthouse no flag | **PARTIAL** | Lighthouse 100, but alpha is 0.60 (5.88:1 AA) not 0.75 (8.44:1 AAA) |
| 3 · Footer `.sub` contrast | `#7a3d0a` (7.26:1) on paper | **FAIL** | Renders `#b8651f` (3.76:1); fix did not land on recruiter tour |
| 4 · Cairn overflow at 320/375 | No h-scroll; rt-stamp wraps | **PASS** | Both viewports confirmed, CSS rules active |

**Overall: ROUND 9 NEEDED**

Two items require correction:

1. **Check 2 — Arc-strip alpha discrepancy:** CSS sweep wrote `rgba(244,236,218,0.60)` but intended `rgba(244,236,218,0.75)`. All four tours are affected. Must update to 0.75 to reach the claimed 8.44:1 AAA target.

2. **Check 3 — Footer `.sub` color on recruiter tour:** `#b8651f` (3.76:1 FAIL) instead of `#7a3d0a` (7.40:1 PASS). Fix must be applied to `/recruiter/tour/` HTML (and any other files where `--ochre-link` did not resolve). WCAG AA is currently failing.
