# Four-Product Tour Live Validation — Round 10
**Date:** 2026-06-04
**Commits under review:** `6c47f53`, `12da73a`
**Validator:** Claude Code (visual-validation agent)

---

## Check 1 — Arc-strip `__item--done` color alpha (Tenure tour)

### Goal
Tessera's round-9 fix was supposed to change `.arc-strip__item--done { color: rgba(244,236,218,.6) }` to alpha `.75` in all four tours.

### Evidence

`evaluate_script` on `https://mpaiva-cc.github.io/stratum/tenure/tour/` at 1280px:

```json
{
  "count": 1,
  "items": [
    {
      "tagName": "LI",
      "elementColor": "rgba(244, 236, 218, 0.6)",
      "spanColors": ["rgba(244, 236, 218, 0.6)"]
    }
  ]
}
```

Computed color on both the `<li class="arc-strip__item arc-strip__item--done">` and its child `<span>` is **`rgba(244, 236, 218, 0.6)`** — alpha is still **0.60**, not 0.75.

### Contrast calculation

Alpha-blended against `#171f2d` background:

| Alpha | Blended RGB | Contrast vs #171f2d |
|-------|-------------|---------------------|
| 0.60 (current) | rgb(156,154,149) | **5.88:1** |
| 0.75 (target) | rgb(189,185,175) | **8.44:1** |

At the current 0.60 value the contrast is 5.88:1 — which passes WCAG AA (4.5:1) for normal text but **falls short of AAA (7:1)**. The round-9 fix was targeting AAA compliance by raising to 0.75. That change has not been published.

### Verdict
**FAIL** — alpha is 0.60, not 0.75. Fix not deployed.

**Screenshot:** `r10-tenure-arc-strip-done-FAIL.png`

---

## Check 2 — Recruiter footer `.footer-mark .sub` color

### Goal
Tessera added `--ochre-link: #7a3d0a` to the recruiter tour `:root`. Round-8 measured `#b8651f` (3.76:1). Target is `#7a3d0a` at sufficient contrast vs `--paper` (#f4ecda).

### Evidence

`evaluate_script` on `https://mpaiva-cc.github.io/stratum/recruiter/tour/` at 1280px, footer scrolled into view:

```json
{
  "ochreLink": "#7a3d0a",
  "paper": "#f4ecda",
  "subFound": true,
  "subTag": "SPAN",
  "subColor": "rgb(122, 61, 10)"
}
```

- `--ochre-link` token on `:root` = `#7a3d0a` ✓
- `.footer-mark .sub` computed color = `rgb(122, 61, 10)` = `#7a3d0a` ✓

### Contrast calculation

`#7a3d0a` vs `#f4ecda` (--paper):

**7.14:1** — exceeds WCAG AAA threshold (7:1). ✓

### Verdict
**PASS** — color is `#7a3d0a`, contrast 7.14:1 vs `--paper`. Meets WCAG AAA.

**Screenshot:** `r10-recruiter-footer-sub-PASS.png`

---

## Tenure Tour — Lighthouse Mobile Accessibility Audit

**Score: 100 / 100** — 52 audits passed, 0 failed.

The `color-contrast` audit passes (Lighthouse does not independently flag the arc-strip alpha issue because 5.88:1 clears the AA threshold Lighthouse enforces).

**Reports:** `r10-tenure-tour-lighthouse.json`, `r10-tenure-tour-lighthouse.html`

---

## Summary

| Check | Item | Measured | Target | Result |
|-------|------|----------|--------|--------|
| 1 | Arc-strip `--done` alpha | 0.60 (5.88:1) | 0.75 (8.44:1) | FAIL |
| 2 | Recruiter footer `.sub` color | #7a3d0a / 7.14:1 | #7a3d0a / ≥7:1 | PASS |
| — | Tenure Lighthouse Accessibility | 100 | ≥90 | PASS |

**The four-tour mobile parity work is NOT DONE. ROUND 11 IS NEEDED.**

Round 11 must address exactly one remaining item: deploy the `.arc-strip__item--done` alpha change from `0.6` to `0.75` to all four tours (`/tenure/tour/`, `/recruiter/tour/`, `/cairn/tour/`, `/console/tour/`). The CSS fix must land in the published GitHub Pages build and be confirmed at alpha `0.75` (target contrast 8.44:1) via `evaluate_script`.
