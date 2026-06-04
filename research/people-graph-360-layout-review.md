# Layout review: people-graph-360.html
**Reviewer:** Tessera — design system, Console + editorial layout  
**Date:** 2026-05-23  
**File:** `/research/people-graph-360.html` (2,363 lines, inline `<style>`, published 2026-05-22)  
**Scope:** Desktop layout critique only. No content edits. CSS-only remediation throughout.

---

## 1. Executive read

Eglin's research brief holds the editorial standard better than most first-build research pages in this system. The typography stack is correct (Fraunces/Newsreader/JetBrains Mono), the palette is disciplined, the masthead hierarchy is real, and the competitor matrix in §III is the kind of table that deserves the page it gets. The bones are right.

What the page lacks at desktop is orientation during the read. At 6,400 words and 10 sections, the reader crosses the fold in the first minute and has no navigation rail for the remaining 27. The TOC appears once, above the article, and is never seen again. On a 1440+ viewport the layout dedicates ~340px per side to unused gutter — precisely the rail a sticky in-page nav would need — and leaves it blank. Every other structural decision follows from this: the page is built for a 760px scroll but not for a 760px-column-on-1440px-screen reader.

The second issue is the AAA contrast cluster. `--ink-mute (#6c7180)` appears in nine distinct locations at sub-14px; it hits 4.14:1 on paper — an AA near-miss but an AAA fail at every instance. `--indigo (#3d4d7d)` misses AAA by 0.01 at every section label, TOC counter, and vignette header. These are fixable in a single variable swap and a token-level decision.

The page ships with two meaningful gaps. It should not go into a board read or briefing in its current contrast state. A remediation pass of two to four hours fixes everything P0.

---

## 2. What works — five specifics

**Masthead hierarchy.** The eyebrow-slug (three stacked mono lines at lines 813–816) into the `masthead-h1` into the italic `masthead-dek` into the meta grid is textbook Stratum editorial structure. `.masthead-h1` at `clamp(2.6rem, 5.4vw, 4.6rem)` with `line-height: .98` is the right tight tracking for a Fraunces display headline. The `em` variant in indigo-italic (`font-variation-settings: "opsz" 144, "SOFT" 100`) correctly identifies the title's emphasis clause without breaking colour coherence.

**Competitor matrix breakout.** `.compmat` correctly escapes the 760px reading column by expanding to `--col-mid: min(1080px, 92vw)` via a negative-margin calculation at lines 321–325. The `table-layout: fixed` at line 343, the pill pattern, and the dashed-border row separators all read correctly. The mobile collapse pattern (lines 710–773) — hiding thead, displaying each row as a stacked card with an `::after` "Eglin's read" label — is well-considered.

**The confidence-ladder sources section.** The three-column grid (`2.4rem 4.6rem 1fr`) in `.sources li` (line 545) produces a legible numbered bibliography with confidence badges. Linking from citation anchors (`[2]` → `#src-2`) in the body text to source entries is correct. The legend in `.sources-head` with `lg-v / lg-r / lg-i` pill classes correctly signals the epistemology before the list.

**ASCII art architecture diagram in §VI.** The `.ascii` block (lines 1736–1752) is correct editorial judgement. A two-column ASCII comparison (warehouse vs. graph paradigm) in JetBrains Mono with ochre for the left column and indigo for the right is readable, accessible to screen readers as text, and consistent with Stratum's writing-not-decorating practice. No figure, no SVG, no decoration — just the argument in the most legible form available. The pattern should be documented as a research-page component.

**Section eyebrow pattern.** `.section-num` (lines 224–228) at `var(--indigo)` with `font-size: 11px; letter-spacing: .26em; text-transform: uppercase` before each `h2.section-h` is the right structural rhythm. The §-numeral plus roman numeral (§ I., §II., …) gives the reader a continuous orientation mechanism at the top of each section. Combined with the TOC anchor links, the structure is complete — except that the TOC is not sticky, so the anchor links are only accessible at page top.

---

## 3. What doesn't work — by region

### 3a. Header

**Defect:** `.masthead-meta` uses `grid-template-columns: repeat(2, 1fr)` (line 177) at desktop. Six key-value pairs sit in a 2×3 grid. The column breaks are mechanical — "Published / 2026-05-22 · T+88d" shares a row with "Length / ~6,400 words · 28-minute read", which is fine, but "Status / Canonical reference" shares a row with "Audience / CHRO, CIO, board, analyst, Stratum agent." The audience value is the longest and most reader-relevant; at 760px in a two-column grid it wraps on smaller type scales.

**Why it bites:** The `Audience` row is the CHRO's first signal of intent. Wrapping it in the meta block at sub-12px mono-uppercase degrades legibility exactly where the reader decides whether to continue.

**Fix:** `grid-template-columns: 1fr 1fr` is fine at desktop, but the `Audience` row should span full width: `grid-column: 1 / -1` on the sixth cell. CSS-only, no content change.

```css
/* After .masthead-meta div (no class hook) — add to the 6th child */
.masthead-meta > div:nth-child(6) {
  grid-column: 1 / -1;
}
```

**Defect:** The `.pres-link` (lines 619–633) sits below the masthead and above the TOC. It uses `var(--indigo)` for the link at 11px mono-uppercase. Contrast: indigo (#3d4d7d) on paper (#f4ecda) = 6.99:1. That is AA at normal text and exactly 0.01:1 below the AAA 7:1 threshold. At 11px (sub-14px) the AAA standard demands ≥7:1.

**Fix:** Use `var(--indigo-deep)` (#2a3658, 10.11:1 on paper) for this link. One line change.

---

### 3b. TOC (the load-bearing miss)

**Defect:** `.toc` (lines 189–214) is a static block inside the document flow. Once the reader scrolls past it — which happens within the first two sections — there is no in-page orientation rail. On a 1440px viewport, `.article` sits at 760px centered with ~340px of gutter on each side. That gutter is empty throughout the entire read. The sticky TOC pattern that belongs in the left gutter is absent.

**Why it bites:** At 6,400 words and 10 sections, the reader crosses a section boundary roughly every three minutes. With no orientation, they lose position. Research pages are reference documents — readers jump in and out, return to sections, cite specific paragraphs to colleagues. This page does not support that pattern at desktop.

**Fix (CSS-only, no HTML changes):** Convert `.toc` to a fixed sticky sidebar on wide viewports.

```css
@media (min-width: 1200px) {
  .toc {
    position: sticky;
    top: 4rem;
    float: left;
    /* Pull left of the article column — the gutter is ~340px per side */
    margin-left: calc(-1 * (((100vw - var(--col-read)) / 2) - 1.5rem));
    width: 200px;
    border-top: 2px solid var(--ink);
    border-bottom: none;
    padding: 1.2rem 0;
    /* Keep width at 200px out of the ~340px gutter */
    max-height: calc(100vh - 6rem);
    overflow-y: auto;
    /* Shift anchor nav out of the flow to preserve article width */
    /* Note: float + sticky requires the parent to not have overflow: hidden */
  }
  .toc li {
    padding: .25rem 0;
    font-size: 10.5px;
  }
  .toc a {
    line-height: 1.4;
    display: block;
  }
}
```

This is a medium-fidelity fix. The clean implementation adds a `<div class="article-with-toc">` wrapper for a grid layout — but a CSS-only sticky float achieves 80% of the value without HTML changes. A proper implementation (P1) creates a sidebar layout with `display: grid; grid-template-columns: 220px 1fr` inside the content wrapper.

**Note on the `--col-read-wide` token:** Line 70 defines `--col-read-wide: min(840px, 92vw)`. This token is defined and never used. The masthead and article stay at `--col-read: 760px`. The 840px token may have been intended for the sidebar layout or for the masthead headline — the masthead-h1 at max 4.6rem would breathe better at 840px. Either use it or remove it. Undefined tokens become debt.

---

### 3c. Article body — section transitions

**Defect:** Section-to-section spacing is `margin-top: 3.4rem` on `.article > section + section` (line 222). That is the only delimiter between major sections. No hairline rule, no end-of-section glyph. The `section-num` eyebrow at the top of each section does the work — and on its own it is adequate — but a reader landing mid-scroll has no visual resting point between the end of §II and the start of §III.

**Why it bites:** §II ends with the Eglin callout block (line 1153), which has `border-left: 2px solid var(--indigo)`. The next element is the `section-num` for §III with its indigo mono label. Without a section break, the callout's indigo rule bleeds visually into the next section's indigo label at scroll speed.

**Fix:** Add a hairline rule at section boundaries.

```css
.article > section + section {
  margin-top: 3.4rem;
  padding-top: 2.8rem;
  border-top: 1px solid var(--paper-rule);
}
```

This is a minimal change — a single `border-top` on the selector already in the file. The result is a visible pause between sections without adding decoration.

---

### 3d. Tables — competitor matrix

**Defect:** The `.compmat` table uses `table-layout: fixed` with explicit `style="width:10.5rem"` on the Vendor column (line 1206), `7rem` on Graph claim and Data model, and the remaining width on Eglin's read. At 1080px (`--col-mid`) this works. The "Eglin's read" column at ~680px accommodates the prose. The issue is a missing sticky header.

**Why it bites:** The competitor matrix is 13 rows at desktop. On a viewport that shows 8–10 rows before scrolling, the column headers (`Vendor / Graph claim / Data model / Eglin's read`) scroll out of sight on rows 9–13. For a table used as a reference (analysts, CHROs comparing vendors), losing the column headers mid-table forces a scroll-back.

**Fix:** Add sticky table header.

```css
.compmat thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  /* Already has background: var(--paper-deep) — that provides the backdrop */
}
```

One addition. The existing `background: var(--paper-deep)` on `.compmat thead th` (line 353) already provides the opaque backdrop needed for sticky to work correctly.

**Defect:** `.compmat td.vendor` has `white-space: nowrap` (line 375). Correct for the Vendor column. However, `font-size: 14.5px` on the vendor name and `font-size: 10px` on `.sub` (line 378) means the sub-label ("Skills Cloud · Career Hub") is below the 14px threshold. At 10px, ink-mute (#6c7180) sub-text on paper produces 4.14:1 — AA fail for normal text, AAA fail regardless. This is the AAA gap in the table.

**Fix:** Replace `color: var(--ink-mute)` on `.compmat td.vendor .sub` with `color: var(--ink-3-aaa)` (#3d4456, 8.27:1). One token swap.

---

### 3e. Figures and visualisations

The page has no images or charts. This is a deliberate editorial choice — see section 6 (What you would NOT change) for the defence. The only visual block is the ASCII art in §VI, which is correctly implemented. No figure treatment is needed.

The one gap: the ASCII block has no accessible short description (no `aria-label` or `<figcaption>` analogue). The ASCII is a comparison table, not a decorative illustration, and its content is read sequentially as text — so screen readers receive the content. But a preceding paragraph that explicitly announces "The following comparison table contrasts warehouse and graph paradigms across five dimensions" would satisfy AAA 1.1.1 intent more completely. This is a content suggestion, not a CSS fix; logged as P2.

---

### 3f. Sources and bibliography

**Defect:** Sources link forward from inline citations (`[2]` → `#src-2`) but not backward from source entries to text. Source entry 2 (LinkedIn Economic Graph) is cited at four locations in the body; there is no way to navigate from the bibliography entry back to where it is used.

**Why it bites:** Analysts and researchers use the bibliography as an entry point. "Show me every place where Eglin relies on the LinkedIn source" requires a full-page search.

**Fix:** Not pure CSS — would require adding `<a href="#text-location">` back-links. Flagged as P1 (small HTML addition, no content change to Eglin's text).

**Defect:** `.sources li::before` counter (line 554) uses `color: var(--ink-mute)` at `font-size: 10.5px`. This is 4.14:1 on paper — below AAA. The counter numbers are functional (they identify sources), not decorative. They need 7:1 for AAA compliance at sub-14px.

**Fix:** Replace `color: var(--ink-mute)` on `.sources li::before` with `color: var(--ink-3-aaa)`. One line.

---

### 3g. Sidebar

The page has no sidebar element. This is a layout absence, not a defect per se — but at desktop the unused gutter is the most significant layout opportunity on the page. The current `.article` block is `width: var(--col-read); margin: 0 auto`. The centred-column-on-wide-canvas approach is correct for long-form reading, but it leaves the orientation problem (see §3b) unsolved. A sidebar sticky TOC is the right resolution.

---

### 3h. Footer

**Defect:** `.footer-col h4` (line 660) uses `color: var(--ink-mute)` at `font-size: 10.5px`. Ink-mute (#6c7180) on paper (#f4ecda) = 4.14:1. These are column labels — "Product," "Research," "Company," "Contact" — at sub-14px. They require 7:1 for AAA.

**Fix:** Replace `color: var(--ink-mute)` on `.footer-col h4` with `color: var(--ink-3-aaa)`. One token swap. The footer h4s are not decorative.

**Defect:** `.footer-foot` (line 673) uses `color: var(--ink-mute)` at `font-size: 11px; text-transform: uppercase`. The copyright line "© 2026 Stratum, Inc. · All rights reserved." is legal text, not decoration. At 4.14:1, below AAA. Same fix: swap to `--ink-3-aaa`.

**Note on `<h4>` in footer:** The footer uses `<h4>` for column labels (lines 2320, 2329, 2338, 2347). The document heading hierarchy runs `h1` (masthead) → `h2` (sections). There are no `h3` or `h4` elements in the article body. The footer jumping to `<h4>` creates a heading level skip (h1 → h4) which fails WCAG 1.3.1 (info and relationships). Footer nav labels should be `<p>` or `<span>` in a `<nav>`, not headings. Flagged as P1 (HTML structure, no visual change).

---

### 3i. The rt-stamp

**Defect:** The `.rt-stamp` (line 796) uses `color: rgba(14,22,38,.55)`. At 55% opacity on paper (#f4ecda), the blended colour approximates #757677, producing a contrast ratio of ~3.87:1. The stamp is not purely decorative — it carries "compiled at T+88d · midday · 2026-05-22T16:00:00.000Z," which is functional metadata for the reader who cares about document age.

**Why it bites:** The pill is correct in position (fixed bottom-right), correct in format, and correct in font (JetBrains Mono, 9.5px). But it fails AAA at every page load. The design intent is a muted signal — but muted should not mean inaccessible.

**Fix:** Two options.
1. Raise the opacity from `.55` to `.80`: blended colour ~#404d61, contrast ~5.6:1. Passes AA, still misses AAA.
2. Use `color: var(--ink-3-aaa)` on the text spans and keep the pill background as-is. At 8.27:1 on paper, AAA pass. The background at 75% opacity is sufficient; the text opacity is the problem.

Option 2 is the right fix — it preserves the pill's recessive visual weight while making the text legible.

---

### 3j. The implications grid (§IX)

**Defect:** `.impl-grid` (lines 489–494) uses `grid-template-columns: 1fr`. At desktop, three equal-weight implication cards render as a single vertical stack. Each card has a header (`.ih`), a title (`.it`), and a prose paragraph — on average about 120 words per card. Three full paragraphs stacked vertically on a 760px reading column at the end of a 6,400-word brief makes §IX read like an appendix, not the editorial close.

**Why it bites:** §IX is the strategic money section. "Stop saying MCP-native HCM. Start saying 'the people graph.'" That is a positioning call that CHROs and the Compact read. It should land as a three-up grid, not a three-deep stack.

**Fix:** Switch to a three-column grid at desktop.

```css
@media (min-width: 900px) {
  .impl-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

The card prose is compact enough for a three-up. At 760px column, three cards are roughly 220px each — workable for the text density. Size: S.

---

## 4. Improvement plan, prioritised

### P0 — Fix before any board read or briefing reference

**P0-1: `--ink-mute` contrast failures (nine instances)**  
- **Problem:** `--ink-mute (#6c7180)` is used for functional text at sub-14px in nine locations. At 4.14:1 on paper, it is below both AAA (7:1) and AA (4.5:1) thresholds for normal text.  
- **Locations and computed ratios:**
  - `.masthead-slug .l3` (line 152, 11.5px): 4.14:1 — FAIL
  - `.masthead-meta .k` (line 185, 11px): 4.14:1 — FAIL
  - `.era-line .era-yr` (line 313, 10.5px): 4.14:1 — FAIL
  - `.compmat td.vendor .sub` (line 378, 10px): 4.14:1 — FAIL
  - `.sources li::before` counter (line 557, 10.5px): 4.14:1 — FAIL
  - `.sources-head` span text (line 527, 10.5px): 4.14:1 — FAIL (ink-3-aaa is used here, actually 8.27 — but `.sources-head` colour is `var(--ink-3-aaa)`, that's fine. Re-check: `.sources-head` CSS line 527 sets `color: var(--ink-3-aaa)`. The `.sources-head .legend` inherits; the `.lg-i` pill is `color: var(--ink-mute)` at line 538.)
  - `.lg-i` confidence-legend pill (line 538, 9.5px): 4.14:1 — FAIL
  - `.footer-col h4` (line 660, 10.5px): 4.14:1 — FAIL
  - `.footer-foot` copyright / nav (line 673, 11px): 4.14:1 — FAIL
- **Fix:** Replace `var(--ink-mute)` with `var(--ink-3-aaa)` (#3d4456, 8.27:1) in each of these selectors. Where the visual intent is specifically muted (e.g., the masthead `.l3` byline, the `.era-yr` date), `--ink-3-aaa` at 8.27:1 remains perceptually recessive relative to `--ink` at 15.38:1 — the hierarchy is preserved.  
- **Size:** S (one token change across eight selectors)  
- **CSS:** Lines 152, 185, 313, 378, 557, 538, 660, 673

**P0-2: `--indigo` contrast miss (0.01 below AAA threshold)**  
- **Problem:** `--indigo (#3d4d7d)` at 6.99:1 on paper misses AAA (7:1) by 0.01. It appears at sub-14px in every location that uses it as a label color:
  - `.section-num` eyebrows (line 227, 11px)
  - `.toc li::before` counters (line 211, 10.5px)
  - `.distlist .dn` labels (line 277, 11.5px)
  - `.era-line li::before` (line 302, 10px)
  - `.vignette .vh` headers (line 410, 10.5px)
  - `.impl-card .ih` headers (line 503, 10.5px)
  - `.pres-link a` (line 630, 11px)
  - `.toc` block colour (line 196, 11.5px)
  - ASCII `.ascii .i` (line 456, 11px)
  - `.callout.eglin::before` (line 439, 10.5px)
- **Fix:** Replace `var(--indigo)` with `var(--indigo-deep)` (#2a3658, 10.11:1) in every selector where it colours sub-14px text. For large headings (`.masthead-h1 em`, `.section-h em`, `.pullquote-text em`) the AAA threshold for large text is 4.5:1 — `--indigo` at 6.99:1 passes for those. So the fix is surgical: small text → `--indigo-deep`; large heading em-marks → `--indigo` is fine.  
- **Note:** The presentation surface already upgraded `.p-shipped` to a deeper moss token for the same reason. This brief lags the presentation in contrast discipline.  
- **Size:** M (affects ~12 selectors; requires care to not flatten the colour hierarchy at large sizes)  
- **CSS:** Lines 211, 227, 277, 302, 410, 439, 456, 503, 630

**P0-3: `--moss` contrast miss in pills and legend**  
- **Problem:** `--moss (#4a5d3a)` at 6.12:1 on paper fails AAA. Used in:
  - `.compmat .p-shipped` pill text (line 394, 9.5px)
  - `.lg-v` sources legend pill (line 536, 9.5px)  
- **Fix:** Create a `--moss-deep` token or use inline `color: #3a4a2c` (8.13:1, same value used in the presentation) on these two selectors. The presentation already uses this value — the brief should match.  
- **Size:** S (two selectors, one new token or inline value)  
- **CSS:** Lines 394, 536

**P0-4: rt-stamp text opacity**  
- **Problem:** The rt-stamp at line 796 uses `color: rgba(14,22,38,.55)` for the timestamp text — approximates 3.87:1 on paper. Below AA for normal text at any size. The stamp is functional metadata.  
- **Fix:** On `.rt-stamp` (inline style block), change the `color` value from `rgba(14,22,38,.55)` to the full `var(--ink-3-aaa)` equivalent: `color: #3d4456`. The pill's background opacity (.75) and the border opacity (.25) provide the visual recessive weight; the text does not need opacity. Or raise the CSS opacity to .80+ as a minimum.  
- **Size:** S (one inline style value)

---

### P1 — Next pass, this week

**P1-1: Sticky in-page TOC for desktop**  
- **Problem:** No orientation rail on a 6,400-word / 28-minute read. The left gutter (~340px at 1440px viewport) is empty throughout.  
- **Fix approach (CSS-only):** Add a `@media (min-width: 1200px)` block that positions `.toc` as a sticky left sidebar via `position: sticky; float: left; top: 4rem; width: 200px` with a negative left offset pulling it into the gutter. The `article` width remains at 760px.  
- **Preferred fix (HTML + CSS, M):** Wrap `<nav class="toc">` and `<article class="article">` in a `.content-layout` grid: `grid-template-columns: 220px 1fr` at ≥1200px with the TOC in column 1, the article in column 2. The overall `.content-layout` stays centered at `--col-read + 220px + gap`.  
- **Size:** M  
- **Why it is P1 and not P0:** The contrast failures are a standard-violation that must be fixed before any regulated audience sees the page. The missing sticky TOC is a significant usability gap but does not violate a WCAG criterion; it violates the usability standard for long-form desktop reading.

**P1-2: Implications grid three-up at desktop**  
- **Problem:** `.impl-grid` (line 491) is `grid-template-columns: 1fr` — three cards stack vertically.  
- **Fix:** Add a media query at 900px+: `grid-template-columns: repeat(3, 1fr)`.  
- **Size:** S

**P1-3: Source back-links**  
- **Problem:** Citations link body → source but not source → body. Research analysts need to navigate in both directions.  
- **Fix:** Add a comma-separated "used at: §I, §IV" back-link inside each `.sources li`. This requires adding HTML but not changing Eglin's text content. The format: a `<span class="src-backlinks">used at: <a href="#s1">§I</a>, <a href="#s4">§IV</a></span>` appended inside the `.sbody`.  
- **Size:** M (31 sources, manual cross-reference)

**P1-4: Footer heading level correction**  
- **Problem:** Footer column labels use `<h4>` (lines 2320, 2329, 2338, 2347) with no `h3` in the document. The article heading tree is `h1 → h2`. The footer `h4` jumps two levels, violating WCAG 1.3.1.  
- **Fix:** Replace `<h4>` with `<p class="footer-col-label">` and move `h4` styles to `.footer-col-label`. No visual change. Requires updating `_layouts/legacy.html` or the footer include if these come from an include; here they are inline.  
- **Size:** S

**P1-5: Define or remove `--col-read-wide`**  
- **Problem:** `--col-read-wide: min(840px, 92vw)` (line 70) is defined but never used. Dead token.  
- **Fix option A:** Delete it.  
- **Fix option B:** Use it for the masthead and pullquote — the `masthead-h1` at clamp(2.6rem, 5.4vw, 4.6rem) would read better at 840px; the pullquote-text at clamp(1.7rem, 3.8vw, 2.4rem) would gain headline breathing room.  
- **Recommendation:** Option B. The masthead is the one place a wider column makes a visible editorial difference for the headline at large sizes. Use `--col-read-wide` for `.masthead`, `.pullquote`, and `.closing`; keep `--col-read` for the article body and sources.  
- **Size:** S

**P1-6: Sticky competitor table header**  
- **Problem:** `.compmat thead th` scroll out of view by row 9 of 13.  
- **Fix:** `position: sticky; top: 0; z-index: 10;` on `.compmat thead th`. Existing `background: var(--paper-deep)` provides the backdrop.  
- **Size:** S

---

### P2 — Design-system pass

**P2-1: Promote the research-page pattern to the design system**  
The page constructs six reusable patterns that should be documented and token-resolved for all future research pages:
- `.distlist` — definition list with mono label column and serif body column
- `.era-line` — numbered timeline with counter labels
- `.compmat` — competitor matrix: breakout to `--col-mid`, pill-annotated table, mobile card collapse
- `.callout.eglin` — editorial analyst callout with branded prefix
- `.vignette` — narrative scenario card with indigo left rule
- `.ascii` — ASCII art / code comparison block in JetBrains Mono
- `.sources` — confidence-rated bibliography with three-column grid
- The pullquote convention: `--col-read` width, centered, `--col-read-wide` upgrade

Each should get a named pattern in the design system with contrast-verified tokens.

**P2-2: Accessible ASCII art**  
- **Problem:** The ASCII comparison table in §VI has no `aria-label` or introductory announced description. Content is readable as text but the structure is not marked up as a table.  
- **Fix:** Wrap the `.ascii` in a `<figure>` with a `<figcaption>` or prefix with a `<p aria-hidden="false">` announcement. Alternatively, add `role="img" aria-label="Comparison table: warehouse paradigm versus graph paradigm across five dimensions"` to the `.ascii` div. Either approach satisfies 1.1.1 intent for structured ASCII.  
- **Size:** S

**P2-3: Section transition visual rest-mark**  
- **Problem:** Section transitions use `margin-top: 3.4rem` only; no hairline. Adjacent callout blocks and the following section eyebrow can visually run together.  
- **Fix:** Add `border-top: 1px solid var(--paper-rule)` on `.article > section + section` with matching `padding-top: 2.8rem`. Keeps the whitespace; adds a rest-mark.  
- **Size:** S

**P2-4: Masthead audience row full-span**  
- **Problem:** `.masthead-meta > div:nth-child(6)` (the Audience row) wraps in the two-column grid.  
- **Fix:** `grid-column: 1 / -1` on the sixth child. S.

**P2-5: Link focus styles**  
- The page's link `:focus` state is not declared in the inline `<style>`. The body `a` rule handles `:hover` but not `:focus-visible`. On keyboard navigation, links would rely on the browser's default focus outline — which on paper-background Chromium is a blue ring inconsistent with the palette. The Stratum design system should define `a:focus-visible { outline: 2px solid var(--ochre); outline-offset: 2px; }` as a global rule.  
- **Size:** S

---

## 5. The single change that most raises the bar

**Add a sticky in-page TOC to the left gutter.**

The page is 6,400 words with 10 sections. The reader lands after the fold in under two minutes and has no orientation for the remaining 26. At 1440px the layout already commits ~340px per side to whitespace — the gutter is not a design choice, it is the absence of one. A 200px sticky sidebar TOC, set in JetBrains Mono at 10.5px with indigo-deep section labels and a top border matching `.toc`'s existing `border-top: 2px solid var(--ink)`, converts unused real estate into the navigation that a canonical reference document requires. It does not change a word of Eglin's research. It makes the research usable as a reference, not just as a linear read. This is the P1 that feels like P0 — it is the difference between a well-written document and a well-designed one.

---

## 6. What you would NOT change

**The 760px single-column reading measure.** At 17.5px Newsreader body text, the character count per line sits in the 70–80ch range depending on the line's letter mix. This is at the wide edge of the ideal 62–72ch range, but it is a defensible Stripe Press-adjacent choice — they run similar measures — and the trade-off (slightly wide lines vs. a comfortably wide line that accommodates Eglin's technical prose without excessive hyphenation) is correct for this content type. The fix is not to narrow the column; it is to add the sticky TOC and orientation rail that make the measure workable at a long scroll.

**The 31-source bibliography density.** Every source has a reason to be there. The confidence-rating system (Verified/Reported/Inferred) is itself a contribution to the research standard. Making the bibliography shorter or less granular would be a false editorial economy. The `.sources` section at ~250 lines is proportionate to a canonical reference.

**No images or charts.** This is a written argument, not a report. The competitor matrix is the data visualisation. The ASCII diagram is the architecture diagram. Adding bar charts or icons would be decorative overlay on a piece that derives its authority from the precision of Eglin's prose. The restraint is correct.

**The dropcap on §I only.** Section I is the opening — the dropcap marks the start of the argument. Applying it to all sections would dilute the signal. One dropcap, correctly placed.

**The pullquote between §III and §IV.** The pullquote at line 1348 — "The question every HCM buyer should ask every vendor…" — breaks the competitor scan from the strategic argument that follows. It is not a pull-for-decoration pattern; it is a chapter break that earns the pause. Keep it.

**The indigo research accent colour.** Indigo is not in the base Stratum palette (paper/ink/ochre/moss/plum) but Eglin uses it as a research-surface accent — and the design rationale holds: it is visually distinct from ochre (Stratum's action colour) and from moss/plum (the status semantics), which correctly marks research content as a different register. The `--indigo-deep` fix proposed above does not remove indigo — it only corrects the contrast miss at small text sizes.

**The mobile card-collapse on the competitor matrix.** The mobile transform (lines 710–773) — `thead` visually hidden (still accessible via the hidden-visually pattern), each row as a stacked card with an `::after` "Eglin's read" label — is a correct responsive table pattern. It does not break the table's accessibility model (the thead uses `position: absolute; width: 1px; height: 1px` not `display: none`) and the label injection via `::before` provides context on mobile. Do not simplify.

**The "Eglin's read" callout prefix pattern.** `.callout.eglin::before` generates "EGLIN'S READ ·" in mono uppercase before the editorial aside. This is the right attributed-analyst pattern for a research document — it distinguishes Eglin's interpretation from cited fact. It should be promoted to the design system as the standard research editorial callout, not removed or genericised.

---

## Contrast summary (AAA gaps, O-1 standing objective)

All ratios computed against the page's base background `--paper (#f4ecda)` unless noted.

| Colour pair | Usage | Computed ratio | AAA threshold | Status |
|---|---|---|---|---|
| `--ink-mute` (#6c7180) on paper | `.masthead-slug .l3`, `.masthead-meta .k`, `.era-yr`, `.compmat .sub`, `.sources li::before`, `.lg-i`, `.footer-col h4`, `.footer-foot` | 4.14:1 | 7:1 (sub-14px) | FAIL |
| `--indigo` (#3d4d7d) on paper | `.section-num`, `.toc li::before`, `.distlist .dn`, `.era ::before`, `.vignette .vh`, `.impl-card .ih`, `.pres-link a`, TOC body text, `.ascii .i` | 6.99:1 | 7:1 | FAIL (0.01 miss) |
| `--moss` (#4a5d3a) on paper | `.p-shipped` pill, `.lg-v` legend | 6.12:1 | 7:1 (sub-14px) | FAIL |
| rt-stamp text rgba(14,22,38,.55) | rt-stamp pill | ~3.87:1 | 4.5:1 (AA), 7:1 (AAA) | FAIL |
| `--ink-mute` on paper-warm | `.ascii .m` | 4.29:1 | 7:1 | FAIL |
| `--ink-mute` on paper-deep | `.compmat .p-claim` pill | 3.74:1 | 7:1 | FAIL |
| `--ink` (#0e1626) on paper | All body text contexts | 15.38:1 | 7:1 | PASS |
| `--ink-2` (#2a3344) on paper | Article `p`, sources `.sbody` | 10.79:1 | 7:1 | PASS |
| `--ink-3-aaa` (#3d4456) on paper | TOC, closing-note, masthead `.l2` | 8.27:1 | 7:1 | PASS |
| `--ochre-link` (#7a3d0a) on paper | Links, `.masthead-slug .l1` | 7.14:1 | 7:1 | PASS |
| `--plum` (#6b3a4a) on paper | `.counter li::before` | 7.67:1 | 7:1 | PASS |
| `--indigo-deep` (#2a3658) on paper | (currently unused at small text) | 10.11:1 | 7:1 | PASS — correct replacement |
| `--ink-3-aaa` (#3d4456) on paper-deep | `.compmat-head` labels | 7.48:1 | 7:1 | PASS |

**O-1 assessment:** Five distinct AAA gaps on this page. The `--ink-mute` issue is systemic — this token is used widely as a "muted" label colour, but 4.14:1 is not AAA-compliant at any size under 18px. The token should be audited across all research pages and flagged for the design system as an AAA-insufficient value at small text. The `--indigo` 0.01 miss is a one-shade token fix. Neither gap requires design-intent changes; both require token discipline.

---

*Filed by Tessera · design system desk · 2026-05-23*  
*Audience: Eglin (primary), editorial-design-system reviewers*  
*Outbox entry:* `2026-05-23T0900Z-tessera-people-graph-360-layout-review.json`
