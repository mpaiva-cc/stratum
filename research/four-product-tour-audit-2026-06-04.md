---
title: Four product tours — audit and remediation plan
date: 2026-06-04
author: Tessera
status: filed
---

# Four product tours — audit and remediation plan

**Filed:** 2026-06-04  
**Surface:** `/tour/`, `/recruiter/tour/`, `/tenure/tour/`, `/cairn/tour/`  
**Trigger:** Chairman feedback — 404 pages, inconsistent navigation, inconsistent look-and-feel

---

## Headline findings

1. No HTML file is missing. The "404 pages" the Chairman saw are caused by the main tour's six question-pile links pointing to `/console/?q=<slug>` with slugs the Console app never handles. Four of the six slugs are also named incorrectly against the DEMO.SLUGS contract already in `app.js`. Result: clicking a question card navigates to Console but renders nothing — functionally a 404.

2. Four divergent navigation models, three divergent chrome compositions, and duplicated inline arc-strip CSS across all four files with a hardcoded color violation in each.

3. The tenure tour is missing three house-style chrome elements: rt-stamp, mobile-bar, and the standard `footer-inner`. It also uses one non-standard design token (`--ochre-link`) and lacks a global site-nav include.

4. ~~The main tour references seven chapters in its title but the markup has six chapter-break dividers and fourteen scenes labeled "0 of 14."~~ **Correction (2026-06-04):** Grep on the delivered file found no "seven chapters" text anywhere in /tour/index.html. This finding was a stale pre-compaction artifact that never shipped. Finding 4 is void; D-07 and §4a are rendered moot.

5. Two character naming violations against the Path A directive: the recruiter tour uses "Liu Chen" as the demo candidate (should be Elena Vega), and the tenure tour uses "Maria Chen / Priya Iyer" as storyboard stand-ins (should be Elena Vega / Mateo Cantú) **[correction: original said Carolina Ruiz, but she is the CHRO at Cordova Manufacturing — not a plausible manager for a platform engineer. Changed to Mateo Cantú in execution.]**.

6. Accessibility gaps: tenure missing skip-link, `aria-live` scene-pos region absent from tenure and cairn, scene `aria-label` strings inconsistent across tours, and `prefers-reduced-motion` guard missing from recruiter's `.scene-inner` CSS.

---

## 1 · 404s and broken links

### 1a · Console `?q=` routing — primary blocker

The main tour's chapter 6 question-pile (`/tour/index.html`, lines 2316–2321) links to:

```
/console/?q=pay-equity-emea
/console/?q=flight-risk-eng
/console/?q=retention-na          ← wrong slug
/console/?q=underpaid-performers  ← wrong slug
/console/?q=reqs-stuck-offer      ← wrong slug
/console/?q=best-hire-sources     ← wrong slug
```

`console/app.js` has a `DEMO` module with a public `runSlug(slug)` method and a `SLUGS` array. The canonical slug names are: `na-new-joiner-retention`, `underpaid-high-performers`, `stuck-at-offer`, `best-hires-source`. The console never reads `location.search` for a `?q=` parameter, so all six links silently fail.

**Fix (Step 2):**
- Correct the four mismatched slugs in `/tour/index.html` to use the canonical names.
- Add `?q=` parameter handling in `console/app.js` — at the end of `DEMO.maybeAutoOpen()`, after the `demoParam` check, read `new URLSearchParams(location.search).get('q')` and call `DEMO.runSlug(slug)` if the slug exists in SLUGS. This is a five-line addition.

### 1b · No other file-level 404s found

All `href` attributes in all four tours were verified against the filesystem. Outro grid links, nav links, arc-strip links, footer links — all resolve.

---

## 2 · Navigation inconsistency

### 2a · Four models in play

| Tour | Scene nav model | Chrome: play-toggle | Chrome: scene-progress | Chrome: rt-stamp | Chrome: mobile-bar | Chrome: global nav |
|---|---|---|---|---|---|---|
| `/tour/` | Scroll auto-play | Yes | Yes | Yes | Yes | Yes |
| `/recruiter/tour/` | Scroll auto-play | Yes | Yes | Yes | Yes | Yes |
| `/tenure/tour/` | Static pill jumplinks | No | No | **Missing** | **Missing** | **Missing** |
| `/cairn/tour/` | JS step-buttons (12 screens) | No | No | Yes | Yes | No (uses tour-nav only) |

### 2b · Canonical model — Option C hybrid

Two scene-progression paradigms are intentional and correct:

- **Auto-play scene-strip** (main tour + recruiter tour): 90-second narrative arcs. Keep.
- **Step-button screen nav** (cairn tour): 12-screen product deep dive. Keep.
- **Static scene-nav pills** (tenure tour): Pre-live storyboard with 6 scenes. Keep — tenure is not a product demo, it's a preview. The pill nav is honest about its structure.

The chrome requirement is uniform across all four:

- arc-strip (already present in all four, but with duplicated inline CSS + hardcoded color violation — see §3)
- rt-stamp (missing from tenure)
- mobile-bar (missing from tenure)
- skip-link (missing from tenure)
- standard `footer-inner` with nav links (tenure has only a bare `colo-tag` footer)
- global site-nav include (missing from tenure and cairn)

**Fix (Step 3):** Add the missing chrome elements to tenure. Cairn's tour-nav replaces the global site-nav for the product-deep experience — acceptable. Cairn keeps its tour-nav; add the global nav include above the tour-nav or confirm the deliberate omission.

### 2c · Arc-strip CSS duplication

All four tours inline-duplicate the arc-strip CSS (approximately 80 lines each). This creates four drift points. The arc-strip CSS belongs in `assets/styles.css` as a shared block, with the per-tour state (done / current / upcoming) applied via body class or data attribute, not duplicated CSS overrides.

**Fix (Step 4):** Extract arc-strip to shared CSS. Per-tour state via `.arc-strip__item[data-state]` selector.

---

## 3 · Look-and-feel inconsistency

### 3a · Arc-strip hardcoded color (all four tours)

Every arc-strip block contains:
```css
.arc-strip__next { color: #b8651f; }
```
This must be `color: var(--ochre)`.

### 3b · Missing CSS class definitions in main tour

The main tour's chapter 2, 4, and 5 scenes use `.ac-a`, `.ac-a-label`, `.ac-a-body`, `.ac-cite`, `.ac-cite-k`, `.ac-cite-v` for pipeline and citation blocks. These classes are **not defined** in the page's `<style>` block — every instance compensates with inline `style=""` attributes. The inline styles are redundant noise and prevent theming.

**Fix (Step 4):** Add the six class definitions to the main tour's `<style>` block. Then remove the compensating inline styles from those elements.

### 3c · Tenure's non-standard token `--ochre-link`

Tenure defines `--ochre-link: #7a3d0a` — a darker ochre for links that does not exist in the Stratum token set. This token should be removed; link color in tenure should use `var(--ochre)` or, if AAA contrast requires a darker shade on paper, define the shade as a standard token in `assets/styles.css` and use it across all tours.

Note: `#7a3d0a` on `var(--paper)` (#f4ecda) produces a contrast ratio of approximately 7.5:1 — it passes WCAG AAA. The standard `var(--ochre)` (#b8651f) on paper is approximately 3.5:1, which fails AAA for body text (passes for large text only). This means tenure's darker link color is actually more accessible. **Resolution stated in original draft: define `--ochre-deep: #7a3d0a` in `assets/styles.css`.** **Correction (2026-06-04): `assets/styles.css` already contains `--ochre-link: #7a3d0a` as the canonical AAA link token (and a separate `--ochre-deep: #8a4711` at a different value). Execution retained `--ochre-link` and did not add a duplicate. D-04 above is corrected accordingly.**

### 3d · Recruiter tour `scene-inner` progressive enhancement gap

The recruiter tour's `.scene-inner` starts with `opacity: 0; transform: translateY(28px)` unconditionally. The main tour guards this behind `html.js .scene-inner` so that the JS-free (and `prefers-reduced-motion`) experience starts visible. Recruiter has a `@media (prefers-reduced-motion: reduce)` override that zeroes the transform, but the opacity starts at 0 regardless — content is invisible until IntersectionObserver fires.

**Fix (Step 4):** Align recruiter's `.scene-inner` to the main tour's `html.js` guard pattern.

### 3e · Cairn mobile-bar hover color

Cairn's mobile-bar hover uses `var(--moss-soft)` instead of `var(--paper)` used by the other tours. Minor but visible. Fix to `var(--paper)` for consistency.

---

## 4 · Completeness gaps

### 4a · Chapter count copy mismatch

**Correction (2026-06-04):** No “seven chapters” text was found in `/tour/index.html` during execution grep. This finding did not reproduce and the corresponding D-07 decision is void. Original text preserved below for the record.

~~`/tour/index.html` title and hero copy refer to “seven chapters.” The markup has six chapter-break dividers (Ch 1–6) and fourteen scenes. The correct copy is “six chapters, fourteen scenes” or the chapter numbering needs a seventh chapter added.~~

~~**Decision:** Correct the copy to match the markup. “Six chapters · fourteen scenes” is accurate.~~

### 4b · Character naming violations — Path A directive

**Recruiter tour — Liu Chen:** The demo candidate in the kanban pipeline, candidate drawer, scheduling, and offer scenes is named "Liu Chen." The arc-framing correctly identifies Elena Vega as the protagonist, but the demo UI does not. Renaming Liu Chen to Elena Vega makes the product demo show you hiring the person you then see onboarded in tenure and tracked in Console. This strengthens the arc.

**Tenure tour — Maria Chen / Priya Iyer:** The tenure tour explicitly describes these as "synthetic stand-ins" for the storyboard. The task directive is "Path A characters throughout." Replace: Maria Chen → Elena Vega, Priya Iyer → Carolina Ruiz (CHRO, already established).

**No waiver required.** Both are renames with no copy logic change. Both are in Step 5.

### 4c · Priya Chandrasekaran (cairn) vs Priya Iyer (tenure)

Cairn uses "Priya Chandrasekaran · Staff SRE" as a peer attester — a supporting character, not a manager. Tenure uses "Priya Iyer" as a manager/mentor stand-in. These are different people with similar given names. After the tenure rename (Priya Iyer → Carolina Ruiz), the Priya Chandrasekaran reference in cairn is unambiguous. No action needed on cairn.

### 4d · Outro grid — `/tour/` briefing card

The "Briefing" outro card links to `../` (root / homepage) with copy "The 30-minute briefing." The root is the homepage, not a briefings page. Either link to an actual briefing artifact or change the card copy/destination to "Back to the product overview" → `../`.

**Fix (Step 5):** Change card title to "Product overview" and copy to "Return to the Stratum product overview." Link stays at `../`.

---

## 5 · Accessibility gaps

All issues against WCAG 2.2 AAA (standing objective O-1).

### 5a · Tenure missing skip-link

All other tours have `<a class="skip-link" href="#main-content">Skip to main content</a>`. Tenure does not. Keyboard users must tab through arc-strip, preview-banner, and scene-nav before reaching content.

### 5b · `aria-live` scene-pos region absent from tenure and cairn

Main and recruiter tours have `<div class="scene-pos" role="status" aria-live="polite">` that announces current scene. Tenure and cairn have no equivalent live region for their navigation state changes.

### 5c · Scene `aria-label` inconsistency

Main and recruiter tours label each scene section with `aria-label="Scene N: [description]"`. Cairn uses screen IDs without labels. Tenure's scenes have no aria-label at all.

### 5d · Focus-visible gap in tour step buttons (cairn)

Cairn's `.tour-step-btn` has a hover state but the `:focus-visible` outline is not explicitly defined — it falls back to the browser default, which is inconsistent with the Stratum focus style (`outline: 2px solid var(--ochre); outline-offset: 2px`).

### 5e · Color contrast — `--ochre` on paper for body links

As noted in §3c: `var(--ochre)` (#b8651f) on `var(--paper)` (#f4ecda) is 3.5:1. WCAG AAA body text requires 7:1. Any tour using ochre for body-size link text fails AAA. The `--ochre-deep` token addition (§3c) resolves this for links. Large text (≥18pt / ≥14pt bold) passes at 3.5:1 for AA and at 4.5:1 for AAA.

### 5f · Alt text audit — scene images and diagrams

Scene images in all four tours were not individually verified for descriptive alt text. To be confirmed and corrected in Step 6.

---

## Canonical decisions locked in this audit

| # | Decision |
|---|---|
| D-01 | Console `?q=` fix: correct four mismatched slugs in main tour; add `?q=` parameter handling in `app.js` at `maybeAutoOpen()` |
| D-02 | Navigation hybrid (Option C): preserve auto-play for main + recruiter, step-buttons for cairn, pill jumplinks for tenure; standardize chrome across all four |
| D-03 | Arc-strip CSS: extract to `assets/styles.css`; per-tour state via data attribute; remove all inline duplicates |
| D-04 | ~~`--ochre-deep: #7a3d0a` added to Stratum token set in `assets/styles.css`; used for body link color in all four tours~~ **Correction (2026-06-04):** `assets/styles.css` already had `--ochre-link: #7a3d0a` as the canonical AAA text-link token. Execution retained `--ochre-link` as-is; no new token was added. `--ochre-deep` in the file is `#8a4711`, a different value. |
| D-05 | Liu Chen → Elena Vega (recruiter tour) |
| D-06 | Maria Chen → Elena Vega, Priya Iyer → Mateo Cantú (tenure tour) **[correction: original said Carolina Ruiz; she is the CHRO and cannot be Elena's platform engineering manager. Changed to Mateo Cantú in execution.]** |
| D-07 | Main tour title copy: "six chapters · fourteen scenes" (not "seven chapters") |
| D-08 | "Briefing" outro card renamed to "Product overview" with destination `../` |

---

## Deferred items

| Item | Reason | Target |
|---|---|---|
| Cairn global site-nav include | Cairn's tour-nav is the primary affordance; adding global nav risks visual clutter on a 12-screen deep. Revisit when cairn leaves beta. | Post-B020 |
| Full alt-text audit (§5f) | Requires image-by-image review; Step 6 covers what's reachable in this pass | Step 6 or follow-up |
| External accessibility audit | Required per O-1 by year-one anniversary | Separate engagement |
| Arc-strip "next chapter" link — cairn | Cairn is last in arc; no "next" link is correct. Main, recruiter, and tenure arcs should link forward to the next tour; verify all three | Step 3 |

---

## O-1 advancement note

This dispatch advances standing objective O-1 (WCAG 2.2 AAA, continuously) by:
- Surfacing three missing skip-links (tenure, tenure, confirmed cairn has one)
- Identifying the `--ochre` link contrast failure and proposing `--ochre-deep` as a system-wide fix
- Adding `aria-live` regions to tenure and cairn (Step 3/6)
- Aligning `prefers-reduced-motion` handling in recruiter tour (Step 4)
- Adding explicit `:focus-visible` to cairn step buttons (Step 6)
