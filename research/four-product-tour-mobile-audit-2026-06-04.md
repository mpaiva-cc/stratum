# Four-product tour — mobile audit
**Date:** 2026-06-04  
**Auditor:** Tessera  
**Method:** Static CSS/DOM analysis at three canonical widths — 375px (iPhone SE), 414px (iPhone Plus), 768px (tablet).  
**Files:** `/tour/index.html`, `/recruiter/tour/index.html`, `/tenure/tour/index.html`, `/cairn/tour/index.html`

---

## Summary matrix

| Tour | Media queries | Desktop-collapse point | 375px | 414px | 768px | Status |
|---|---|---|---|---|---|---|
| `/tour/` | 20 | 820px | Functional | Functional | Functional | Needs breakpoint unification, touch-target fixes |
| `/recruiter/tour/` | 15 | 980px | Functional | Functional | Shows desktop layout at 768 | Needs breakpoint unification |
| `/tenure/tour/` | 3 | 880px (scene-grid only) | Under-built | Under-built | Partially broken | Needs full mobile coverage |
| `/cairn/tour/` | 14 | 900px | Functional | Functional | Functional | Closest to canonical |

---

## Canonical primary breakpoint decision

**900px.** Rationale:

1. Cairn is the most recently built tour and uses 900px consistently for both site-nav hide (`@media (max-width:900px)`) and screen-split collapse. Adopting it unifies the newest build standard across the arc.
2. 900px brackets iPad portrait (768px) and iPad landscape (1024px) cleanly — the region where the layout must already be single-column. 880px leaves a 20px gap where Tenure's layout may crowd on early-gen tablets; 900px does not.
3. The `site-nav.html` include already uses `@media (max-width:900px)` for hamburger/nav-index swap on all four tours. The desktop-collapse breakpoint should match the nav collapse point — they express the same viewport intent.

Inner sub-breakpoints (720px for KPI grids, 600px for arc-strip label hide, 520px for play controls, 540px for tenure's scene-nav pill sizing) earn their keep and stay local.

---

## Per-tour findings

### `/tour/` (Console tour) — 820px desktop collapse

**375px issues:**
- `.nav-links { display: none }` fires at 820px — correct, nav hides. Mobile-bar handles orientation.
- `.outro-grid` collapses to 1-col at 820px — correct at 375px.
- `.q-pile` card stack at 760px — collapses to flex column. Correct at 375px.
- `.ac-inspect` grid collapses at 720px. Correct.
- `.cite-blown .cb-row` collapses at 620px. Correct.
- **Issue:** `.mobile-bar-inner` uses `width: var(--col-wide)` (min(1380px, 94vw)) — at 375px this resolves to `94vw = ~353px`. The mobile-bar inner is nearly full-width, which is correct, but `--col-wide` is unexpectedly wide here — `--col` (min(1240px, 92vw)) would be more appropriate and keeps parity with the content container. The current value works but is logically mismatched.
- **Issue:** `.btn-primary` and `.btn-ghost` use `padding: 1rem 1.6rem` with `font-size: 12.5px`. Computed height at 17px base: `16px + 12.5px + 16px = ~44.5px`. Passes WCAG 2.5.5 (44×44 AAA). Width depends on label — "Start the tour" at 12.5px mono is approximately 95px. Passes.
- **Issue:** `.nav-cta` button (Talk to us →) has `padding: .55rem .95rem`. At 17px base: `~9.35px + ~17px + ~9.35px = ~35.7px` tall. Fails WCAG 2.5.5 (needs 44px). Hidden at 820px, but it shows at 821–1380px. Not a mobile issue per se, but noted.
- **Issue:** `.scene-counter .bar` decorative elements — fine.
- **Issue:** No `320px` overflow guard on `.chapter-break`. Uses `padding: 3rem calc((100vw - min(680px, 88vw)) / 2)` — at 320px: `88vw = 281.6px`, so padding = `(320 - 281.6)/2 = 19.2px`. No overflow. Passes.

**768px issues:**
- Desktop-collapse fires at 820px, so 768px gets the mobile layout. Correct and intentional.

**Primary breakpoint gap:** 820px vs canonical 900px — needs migration.

---

### `/recruiter/tour/` — 980px desktop collapse

**375px issues:**
- `.nav-links { display: none }` fires at 980px. Mobile-bar handles orientation.
- **Issue:** At 768px, the `.scene-inner` (max-width: 1100px) is still rendering with full desktop scene content. The `.kpi-row` doesn't collapse to 2-col until 720px, meaning at 768px a 4-column KPI row is visible — this is acceptable at 768px but tightly packed.
- **Issue:** `.offer-mock` grid collapses at 820px — fine for 375px/414px.
- **Issue:** `.dash-grid-mock` collapses at 760px — fine.
- **Issue:** `.arc-strip` has no issue at 375px — label/ch hides at 600px.
- **Issue:** `.scene` uses `min-height: 100vh` — on iPhone SE (375×667), scenes 100vh tall may feel weighty but scroll correctly.
- **Issue:** `.play-toggle` and `.scene-pos` at 520px breakpoint — reduces to `padding: .55rem .75rem` and `font-size: 10px`. Estimated height: `~8.8 + 10 + ~8.8 = ~27.6px`. Fails WCAG 2.5.5 (44px AAA target).
- **Issue:** `980px` desktop-collapse means at 820–980px the site-nav hamburger shows but the tour nav-links remain visible — visually inconsistent.

**Primary breakpoint gap:** 980px vs canonical 900px — needs migration.

---

### `/tenure/tour/` — 880px (scene-grid only), materially under-built

This is the most significant finding. Tenure has only 3 responsive rules beyond `prefers-reduced-motion`:

1. `@media (max-width:880px)` — `.scene-grid` collapses to 1 column
2. `@media (max-width:540px)` — `.scene-nav` pill sizing, `.cast` grid stacks
3. `@media (max-width:600px)` — `.arc-strip` label/ch hide

**Missing mobile coverage (critical gaps):**

- **No `.tour-hero` mobile sizing** — at 375px, `.tour-hero { padding:4.5rem 0 3rem }` and `width:var(--col)` resolves to `92vw = 345px`. Hero padding is excessive for a 375px screen. Should reduce to ~2rem vertical at ≤540px.
- **No `.tour-h1` mobile font size** — `.tour-h1 { font-size:clamp(2.8rem,6vw,4.8rem) }`. At 375px: `6vw = 22.5px → clamp lower bound = 2.8rem = 50.4px`. A 50px heading on a 375px screen takes 3–4 lines. Needs a lower clamp floor (approx 2rem at small screens), or a mobile override.
- **No mobile bar for nav** — unlike the other tours, Tenure uses a `<div class="mobile-bar">` for top navigation. The mobile-bar itself exists in the CSS, but there is no `@media` rule for it — no height adjustment, no padding reduction at 375px. The `mobile-bar-inner` uses `width:var(--col)` which resolves to `92vw` — acceptable. But the bar has no reduced-padding breakpoint.
- **No `.mockup` overflow protection** — `.mockup` has `overflow:hidden` but no max-width or `width:100%` at small viewports. The `.steps li` grid (`grid-template-columns:1.6rem 1fr auto`) can overflow at 375px when the `auto` column (the `.when` timestamp, e.g. "May 12 · 09:42") forces column width — the middle `1fr` column gets squeezed. Risk of text overflow at 320–375px.
- **No `.scene-head` wrap fix at phone width** — `.scene-head` uses `display:flex; flex-wrap:wrap; gap:.6rem 1rem`. At 375px, the four elements (scene-num, scene-when, agent-badge, class-badge) may wrap acceptably. Acceptable as-is.
- **No `.tour-close` mobile padding** — `.tour-close { padding:3rem 1rem }`. At 375px, 3rem vertical padding (54px) is excessive. Needs reduction.
- **Touch targets — `.scene-nav a`** uses `padding:.45rem .7rem`. At 18px base: `~8.1 + 18 + ~8.1 = ~34.2px` tall. Fails WCAG 2.5.5 (44px AAA). At 540px, reduced to `padding:.35rem .55rem` — height drops to ~28px. Worsens.
- **Touch targets — `.tour-close .cta`** uses `padding:.85rem 1.4rem`. At 18px base: `~15.3 + 18 + ~15.3 = ~48.6px`. Passes AAA (44px).
- **Touch targets — `.mobile-bar a`** has no explicit `min-height`. Computed height from `padding:.55rem 0` + `font-size:11px` = ~9.9 + 11 + ~9.9 = ~30.8px`. Fails WCAG 2.5.5.
- **No `.arc-framing` mobile stacking** — `.arc-framing-inner { display:flex; gap:1rem; align-items:baseline }`. At 375px, the `arc-framing__label` (white-space:nowrap) and `arc-framing__body` could crowd. No overflow protection. Needs `flex-wrap:wrap` or a column-direction breakpoint.
- **No `.colo-tag` bottom padding** — fine as-is.
- **No `.footer-inner` flex-wrap** — `.footer-inner { flex-wrap:wrap }` — already has it. Fine.
- **`.steps li` grid at 320px** — with 3 columns (`1.6rem 1fr auto`), the `auto` column width is unbounded. At 320px with a long timestamp string, this can cause horizontal overflow. Needs `white-space:nowrap; overflow:hidden; text-overflow:ellipsis` or column-collapse at ≤400px.

---

### `/cairn/tour/` — 900px (closest to canonical)

**375px issues:**
- `.screen-split` collapses at 960px — 768px gets single-column. Correct.
- `.tour-steps` scrolls horizontally at 720px — correct, works at 375px.
- `.traj-stats-row` collapses at 960px — fine.
- **Issue:** `.tour-step-btn` has `min-height: 32px` — fails WCAG 2.5.5 (needs 44px). These are the chapter-nav buttons in the sticky tour-nav bar.
- **Issue:** `.tour-cta` (the sticky "Get access" button) has `padding: .35rem .75rem` with no `min-height`. Computed: `~6.3 + ~12.5 + ~6.3 = ~25px`. Fails WCAG 2.5.5. Must be 44px.
- **Issue:** `.person-header` collapses to column at 640px. Fine for 375px.
- **Issue:** No `320px` overflow test for `.screen-h` (max-width:28ch) — at 320px, `28ch` at clamp min `1.8rem = 32.4px` equates to ~24 characters per char-width but ch is width of "0", so 28ch ≈ 28 × 0.6em ≈ ~545px which is wider than 320px — the `max-width:28ch` could cause overflow if the element doesn't have proper containment. The `width:var(--col-wide)` parent uses `min(1380px, 94vw)`, so at 320px = `94×320/100 = 300.8px`. The headline is `max-width:28ch` within a 300px container — CSS resolves `max-width:28ch` to be relative to the element's own font-size. At `clamp(1.8rem, 3.8vw, 3.2rem)` → at 320px: `3.8vw = 12.16px`, clamp lower = 1.8rem = 32.4px. So `28ch ≈ 28 × 0.6 × 32.4 ≈ 544px` — but `max-width` on a block doesn't cause overflow of a parent; it constrains the element's own width. Fine.

**Primary breakpoint:** Already at 900px. No migration needed.

---

## Cross-tour issues

### 1. Arc-strip: incomplete at 320px
All four tours hide `.arc-strip__label` and `.arc-strip__ch` at 600px. At 320px, the remaining content — "Recruiter · Tenure · Console · Cairn · Next: Console →" — is approximately 280px of text in a 320px container with 0.8rem padding on each side (12.8px). Available: `320 - 25.6 = 294px`. The four product names at `.72rem = ~11.5px` with `.75rem = 12px` gap = 4 × ~60px + 3 × 12px = 276px. This barely fits but the `.arc-strip__next` ("Next: Console →") at `white-space:nowrap` pushes total width past 294px → **overflow at 320px**. Fix: wrap in `flex-wrap:wrap` or hide `.arc-strip__next` below 480px.

### 2. Mobile-bar targets (all tours)
The `.mobile-bar a` links (e.g., "← Library", "Briefing →") have `padding:.55rem 0` (vertical only) and font-size 11px. Height ≈ 30.8px. All four tours fail WCAG 2.5.5 (44px AAA). The mobile-bar has full-width `min-height` semantics through its background stripe but individual link tap targets need explicit sizing.

### 3. Site-nav touch targets
The `sn-mobile-close` button in the site-nav include has `min-height:44px; min-width:44px` — passes. The `sn-mob-links a` has `min-height:44px` — passes. The desktop `sn-index-btn` has `min-height:36px` — fails AAA (needs 44px) but is only shown at desktop widths.

### 4. Breakpoint inconsistency at 768–900px viewport
At 768px (tablet portrait):
- `/tour/` renders mobile layout (collapse at 820px) — single-column
- `/recruiter/tour/` renders desktop layout (collapse at 980px) — two-column
- `/tenure/tour/` renders desktop layout (collapse at 880px) — two-column
- `/cairn/tour/` renders mobile layout (collapse at 900px) — single-column

A visitor moving from the Cairn tour to the Recruiter tour on a tablet sees layout flip. This is the core inconsistency to fix.

### 5. Hover-only affordances
Several affordances use `:hover` only with no `:focus-visible` equivalent:
- `.arc-strip__item a:hover` — no focus style
- `.arc-strip__next:hover` — no focus style
- `.chapter-break__title` / `.chapter-break__dek` — not interactive, fine

`.scene-nav a:focus-visible` in Tenure — handled.
`.tour-step-btn:focus-visible` in Cairn — handled.
Arc-strip links need `:focus-visible` across all four tours.

### 6. `prefers-reduced-motion` coverage
- `/tour/`: two rules — scroll-behavior + scene-inner animation. Correct.
- `/recruiter/tour/`: two rules — same. Correct.
- `/tenure/tour/`: no explicit `prefers-reduced-motion` rule in tour CSS (only in `site-nav` scoped CSS). Missing for arc-strip and any future animations added.
- `/cairn/tour/`: one rule — `* { transition: none; animation: none }`. Correct (broad but effective).

---

## Deferred / cannot verify statically

1. **Live-device render** — tap target ergonomics on actual iPhone SE hardware (finger-pad vs CSS pixel size)
2. **Pinch-to-zoom on cite-chips and methodology disclosures** — requires user-agent + touch event testing
3. **VoiceOver reading order** on scene-grid (two-column → single-column) — DOM order appears correct but skip-link testing requires live assistive tech
4. **Scroll snap behavior at 375px** — `scroll-snap-type: y proximity` on `main` in `/tour/` and `/recruiter/tour/` could create navigation problems on short screens; cannot verify without live rendering
5. **Font loading failure fallback** — if Fraunces/Newsreader/JetBrains Mono don't load, Georgia/ui-monospace fallbacks should render acceptably; not verifiable statically beyond confirming fallback declarations are present (they are)

---

*Prepared for Steps 2–6 of the mobile parity workstream. Commit hash to follow.*
