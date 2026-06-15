# Workstream D — "Context Layer" Repositioning · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt the ratified category frame — **"the context layer your HCM agents read from"** — across the *customer-facing* surfaces named in the spec (§6), changing the *displayed* phrase from "people graph" to "context layer" / "your org's context" where it is a positioning claim or a UI label. Engineering credibility artifacts keep "graph." URL slugs are unchanged.

**Architecture:** This is a copy + SEO-metadata change. No application code, no schema, no fixtures, no JS. Each edit is a surgical phrase swap inside existing markup classes (no contrast, focus, or layout change). The replacement phrase is **surface-dependent** — that is the load-bearing nuance of this plan:

| Surface class | "people graph" becomes | Why |
|---|---|---|
| Category / positioning copy | **the context layer** (your HCM agents read from) | The winning category term (spec §1). |
| Console UI eyebrow / source line | **your org's context** | Tessera-flagged; reads as product chrome, not a category claim. |
| Console People-tab `h2` title | **People** (plain) | A tab label, not a positioning slot. |
| Page `<title>` / `meta` / OG | **context layer · HCM** | The SEO white-space play (spec §6: "context layer" + HCM). |

**The frame is NOT "contextual map"** (an invented category — do not use it). **The frame is NOT a TAM expansion** — no device/location/non-person copy is added; this is renaming the *existing* people story (spec §8, Eglin: hold non-person GTM 12–18mo).

**Lead sentence (ratified candidate, refined):**
> *Stratum is the context layer your HCM agents read from — every decision traceable to the data behind it, on a graph substrate rigorous enough to put in front of your board.*

Note the deliberate seam: the **customer claim** is "context layer"; the **proof noun** inside the same sentence is "graph substrate." That is the whole strategy in one line — sell the context layer, prove it with the graph. Keep both words; do not sand "graph substrate" out of the lead.

**Tech Stack:** Jekyll static site (Ruby/`bundle`), hand-authored HTML. Essays live in `_essays/` and serve via `permalink:` at `/essays/…`. Verification is per-surface grep assertions + `make build` + `make audit`. No unit tests touch these pages.

**Scope discipline (the structural defense):** Only the surfaces named in spec §6 are touched. `research/`, `intel/`, `engineering/`, `product/`, `api/`, `tour/`, `cairn/`, `graph/`, and the `_briefings/` are **out** — the 261KB repo-wide grep for "people graph" is the trap, not the target. Task 6 is a guard assertion proving the six engineering artifacts still say "graph."

---

## Authoritative occurrence inventory (customer-facing, in spec §6 scope)

Built by grepping the named surfaces only (case-insensitive) and reading each in context. Classified into **EDIT**, **SEO/META**, **HOLD (flag to Helm)**.

| # | File · line | Current text (verbatim) | Class | Task |
|---|---|---|---|---|
| 1 | `index.html` hero (652–685) | *(no "people graph" phrase exists in the hero; persistent positioning line to be added — R1 RESOLVED)* | EDIT | T1 |
| 2 | `pricing/index.html:1336` | `The CHRO's copilot, on your unified people graph.` | EDIT | T2 |
| 3 | `pricing/index.html:1350` | `<strong>Unified people graph</strong> with up to <strong>8 connectors live</strong>` | EDIT | T2 |
| 4 | `pricing/index.html:1574` | `Your full people graph live behind your firewall.` | EDIT | T2 |
| 5 | `console/index.html:145` | `§ The CHRO's copilot · grounded in the people graph` | EDIT | T3 |
| 6 | `console/index.html:191` | `<h2 class="view-title">The <em>people graph.</em></h2>` | EDIT | T3 |
| 7 | `console/index.html:397` | `grounded in the same\n        people graph.` | EDIT | T3 |
| 8 | `console/index.html:269,286,301,318,332,349,364,381` | `Source: People Graph · …` / `Source · People Graph` (×8) | HOLD | flag (§Rulings) |
| 9 | `_essays/selling-tuesday-afternoons.html:1443` | `an answer architected against the people graph` | EDIT | T4 |
| 10 | `_essays/selling-tuesday-afternoons.html:1550` | `The fee scales with the size of your people graph` | HOLD | flag (§Rulings) |
| — | `_essays/selling-tuesday-afternoons.html:2024` | `<li><a href="../product/index.html#product">People graph</a></li>` (footer-nav link) | HOLD | flag (§Rulings) — same footer-nav rationale as rows 12/13 |
| 11 | `essays/index.html:728` | `On entity resolution, the people graph, and why a 2,400-person hospital's` (dek for Forge's *graph-between-the-databases* essay) | HOLD | flag — lean keep "graph" |
| 12 | `customers/index.html:1320` | `<li><a href="../product/index.html#product">People graph</a></li>` (footer nav label) | HOLD | flag (§Rulings) |
| 13 | `pricing/index.html:1726`, `pricing/calculator.html:1488` | footer nav label `People graph` → `/product/#product` | HOLD | flag (§Rulings) |
| 14 | `ember/console/index.html:4`, `recruiter/console/index.html:4,28` | meta `description: "… on the people graph"` | SEO/META | T5 |
| — | `customers/index.html` title/meta | `<title>Customer Notes — Stratum</title>` (no category term) | SEO/META | T5 |
| — | `pricing/index.html` title/meta | `<title>Stratum — Pricing. Annual platform, decisions in arrears.</title>` | SEO/META | T5 |

**Customer-facing occurrence count (named surfaces, "people graph" phrase):** **21** — `pricing/index.html` ×4 (3 body + 1 footer), `pricing/calculator.html` ×1 (footer), `console/index.html` ×11 (eyebrow + h2 + same-graph line + 8 source labels), `customers/index.html` ×1 (footer), `_essays/selling-tuesday-afternoons.html` ×3 (lines 1443 EDIT + 1550 HOLD + 2024 footer HOLD), `essays/index.html` ×2 (dek + footer), `ember/console` ×1 (meta), `recruiter/console` ×2 (meta). Of these: **6 are clear EDIT**, **the rest are HOLD/SEO** pending the rulings below. *Note: the breakdown here enumerates slightly differently from the table above due to grouping; the authoritative count is 21 distinct occurrences.*

---

## Task 1: Homepage hero — add persistent positioning line (R1 RESOLVED: option a approved)

**Files:**
- `index.html` (hero `<section class="hero">`, lines 652–685)

**Finding:** The spec §6 lists "homepage hero" as a repositioning target, but the hero contains **no "people graph" phrase to swap**. It is briefing-rotation copy — line 660 `<h2 id="hero-heading" class="hero-headline">Showing the work <em>mid-flight</em>.</h2>` with a per-briefing lede (661–668). There is **no persistent category-statement slot** on the homepage. **R1 is RESOLVED: option (a) approved — add a persistent positioning line (`<p class="hero-positioning">`) alongside the briefing hero, carrying the ratified lead sentence.**

- [ ] **Step 1: Confirm the hero region (verification)**

```bash
grep -ni 'people graph' index.html
```
Expected: grep returns ticker/feed lines AND the research-section lines at approximately 709 and 738 (Workstream A territory — out of scope here; their presence is normal and expected). Confirm that **no "people graph" phrase appears in the hero region (roughly lines 652–685)**. Ticker and research-section lines may freely appear in output; ignore them. This step confirms there is no in-hero phrase to swap — only a new element to add.

- [ ] **Step 2: Add the persistent positioning line (hero region, after the briefing lede ~line 668)**

Locate the hero section (652–685). After the per-briefing lede block (closing tag around line 668), insert:
```html
      <p class="hero-positioning">Stratum is the context layer your HCM agents read from — every decision traceable to the data behind it, on a graph substrate rigorous enough to put in front of your board.</p>
```
This element sits inside `<section class="hero">` but outside the briefing-rotation block, so it is persistent across briefing rotations.

**CSS note:** `hero-positioning` is a new class. This is the one exception to the workstream's "no new selectors" rule — add a minimal rule (e.g. `font-size`, `color`, `margin`) in the associated stylesheet. Flag to Helm if the CSS scope is unclear; do not leave the class unstyled.

- [ ] **Step 3: Verify**

```bash
grep -c 'context layer your HCM agents read from' index.html   # expect 1
```
Expected: `1`. Confirms the positioning line is present.

- [ ] **Step 4: Build + audit**

```bash
make build
make audit
```
Expected: clean build; `make audit` may flag the new `hero-positioning` selector — that is expected (new rule, not a leak from an existing class).

- [ ] **Step 5: Commit** *(deferred — land with the T6 ticker step in one homepage pass)*

See T6 Step 6/7 — the hero addition and the ticker update land in a single `index.html` commit.

---

## Task 2: Pricing page — Plan A tagline, feature, and timeline

**Files:**
- Modify: `pricing/index.html` (lines 1336, 1350, 1574)

- [ ] **Step 1: Write the verification assertion (must fail now)**

```bash
grep -c 'context layer' pricing/index.html        # expect 0 now
grep -c 'people graph' pricing/index.html          # expect 4 now (3 body + 1 footer)
```
Expected now: `0`, `4`. This is the failing test.

- [ ] **Step 2: Plan-A tagline (line 1336)**

Replace:
```html
        The CHRO's copilot, on your unified people graph.
```
with:
```html
        The CHRO's copilot, on the context layer your HCM agents read from.
```

- [ ] **Step 3: Plan-A feature line (line 1350)**

Replace:
```html
        <li><strong>Unified people graph</strong> with up to <strong>8 connectors live</strong> — Workday, Greenhouse, Lattice, ADP-WFN, Carta, Okta, BambooHR, and one custom HRIS</li>
```
with:
```html
        <li><strong>Unified context layer</strong> with up to <strong>8 connectors live</strong> — Workday, Greenhouse, Lattice, ADP-WFN, Carta, Okta, BambooHR, and one custom HRIS</li>
```

- [ ] **Step 4: Implementation-timeline body (line 1574)**

This line describes the ingested substrate going live. Keep the proof-noun seam — the claim is "context layer," and "graph substrate" is permitted as the proof noun here. Replace:
```html
        <p class="tl-body">Your full people graph live behind your firewall. Entity resolution validated against payroll.</p>
```
with:
```html
        <p class="tl-body">Your full context layer live behind your firewall — graph substrate, entity resolution validated against payroll.</p>
```

- [ ] **Step 5: Verify (must pass now)**

```bash
grep -c 'context layer' pricing/index.html         # expect 3 (the three edits)
grep -ic 'people graph' pricing/index.html          # expect 1 (the footer nav label — HOLD, see R2)
grep -c 'graph substrate' pricing/index.html        # expect 1 (proof noun preserved, line 1574)
```
Expected: `3`, `1`, `1`. The remaining "people graph" is the footer nav label only (Task held per R2).

- [ ] **Step 6: Build + audit (no contrast/layout regression)**

```bash
make build
make audit
```
Expected: clean build; no NEW CSS-leak warnings (edits reuse `plan-tagline`, `plan-feats`, `tl-body` — no new classes).

- [ ] **Step 7: Commit**

```bash
git add pricing/index.html
git commit -m "Pricing · reposition Plan A copy to the context-layer frame (Workstream D)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Console — Ask eyebrow, People-tab title, Hiring sub-line

**Files:**
- Modify: `console/index.html` (lines 145, 191, 397)

These are the three Tessera-flagged UI surfaces (the eyebrow she named, the People h2, plus the parallel "same people graph" line at 397 — included for in-page consistency with the eyebrow). The **8 `Source: People Graph` provenance labels are HELD** (R4) — they are lineage/credibility signals, which align with "graph stays for credibility."

- [ ] **Step 1: Write the verification assertion (must fail now)**

```bash
grep -c "grounded in the people graph" console/index.html      # expect 1 (eyebrow)
grep -c "people graph" console/index.html                       # expect 11 now (eyebrow + h2 + 397 + 8 source labels)
grep -c "your org's context" console/index.html                 # expect 0
```
Expected now: `1`, `11`, `0`.

- [ ] **Step 2: Ask eyebrow (line 145) → "your org's context"**

Replace:
```html
      <div class="ask-eyebrow">§ The CHRO's copilot · grounded in the people graph</div>
```
with:
```html
      <div class="ask-eyebrow">§ The CHRO's copilot · grounded in your org's context</div>
```

- [ ] **Step 3: People-tab title (line 191) → plain "People"**

The tab is labeled `People` in the tablist (`aria-labelledby="tab-people"`), so the title reads cleanest as plain "People." Replace:
```html
      <h2 class="view-title">The <em>people graph.</em></h2>
```
with:
```html
      <h2 class="view-title"><em>People.</em></h2>
```
*(Preserve the `<em>` so the existing `.view-title em` styling and the trailing full-stop cadence of the other tab titles — e.g. line 394 `The <em>hiring pipeline.</em>` — stay consistent.)*

- [ ] **Step 4: Hiring sub-line (line 397) → "org context"**

Replace the two-line fragment:
```html
        140 open requisitions · 3,500 candidates across the funnel · grounded in the same
        people graph. Switch sub-views for the funnel, the requisition list, or source mix.
```
with:
```html
        140 open requisitions · 3,500 candidates across the funnel · grounded in the same
        org context. Switch sub-views for the funnel, the requisition list, or source mix.
```

- [ ] **Step 5: Verify (must pass now)**

```bash
grep -c "your org's context" console/index.html     # expect 1 (eyebrow)
grep -c "org context" console/index.html             # expect 1 — "your org's context" (eyebrow) does NOT match this bare pattern; only the hiring sub-line does
grep -ic 'people graph' console/index.html           # expect 8 (the held Source labels only)
grep -c 'view-title"><em>People.' console/index.html # expect 1
```
Expected: `1`, `1`, `8`, `1`. The 8 remaining hits are exactly the held provenance labels (R4) — confirm by eye they are all `Source`/`Source ·` lines.

- [ ] **Step 6: Build + a11y/CSS audit**

```bash
make build
make audit
```
Expected: clean; no new CSS leaks (reuses `ask-eyebrow`, `view-title`). No focus/contrast change — text-only edits inside existing elements.

- [ ] **Step 7: Commit**

```bash
git add console/index.html
git commit -m "Console · eyebrow + People tab + hiring sub-line to the context frame (Workstream D)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Essay 03 (Selling Tuesday Afternoons) — single surgical body edit

**Files:**
- Modify: `_essays/selling-tuesday-afternoons.html` (line 1443 only; lines 1550 and 2024 HELD per R5/R2)

This is Compass's published essay; it serves at `/essays/selling-tuesday-afternoons.html` via `permalink:`. **Only line 1443 is edited here** — it is descriptive prose about the motion. **Line 1550 (the pricing-script quote) is HELD** pending R5, because editing a documented, published pricing-script quote is a heavier act than a tagline swap. **Line 2024 (a footer-nav link `<li><a href="../product/index.html#product">People graph</a></li>`) is HELD** per the same footer-nav rationale as rows 12/13 in the occurrence inventory (R2).

- [ ] **Step 1: Verification assertion (must fail now)**

```bash
grep -c 'architected against the people graph' _essays/selling-tuesday-afternoons.html  # expect 1
grep -c 'context layer' _essays/selling-tuesday-afternoons.html                          # expect 0
```
Expected now: `1`, `0`.

- [ ] **Step 2: Edit line 1443**

In the paragraph at 1438–1447, replace:
```html
      answer architected against the people graph would look like.
```
with:
```html
      answer architected against the context layer would look like.
```

- [ ] **Step 3: Verify (must pass now)**

```bash
grep -c 'architected against the context layer' _essays/selling-tuesday-afternoons.html  # expect 1
grep -c 'size of your people graph' _essays/selling-tuesday-afternoons.html               # expect 1 (held script quote, R5)
grep -ic 'people graph' _essays/selling-tuesday-afternoons.html                           # expect 2 (line 1550 HELD script quote + line 2024 HELD footer-nav)
```
Expected: `1`, `1`, `2`. After editing line 1443, **two** "people graph" hits remain in this essay — line 1550 (the held pricing-script quote, R5) and line 2024 (the footer-nav link, R2 hold). Both are intentional HOLDs; neither is an error.

- [ ] **Step 4: Build**

```bash
make build
grep -c 'architected against the context layer' _site/essays/selling-tuesday-afternoons.html  # expect 1
```
Expected: clean build; permalink output carries the edit.

- [ ] **Step 5: Commit**

```bash
git add _essays/selling-tuesday-afternoons.html
git commit -m "Essay 03 · 'architected against the context layer' (Workstream D)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: SEO / metadata — the "context layer + HCM" category play

**Files:**
- Modify: `pricing/index.html` (`<title>` line 26, `meta name="description"` line 27)
- Modify: `customers/index.html` (`<title>` line 27, `meta name="description"` line 28)
- Modify: `ember/console/index.html:4`, `recruiter/console/index.html:4,28` front-matter `description:` *(R6 RESOLVED: included)*

This is the white-space play (spec §6): no one owns "context layer" for **HCM**. Inject the term into the customer-facing pages' title/description/OG. The page-level `<title>`/`meta` are edited; the OG/twitter tags already derive from `page.title`/`page.description` Liquid, so they inherit automatically (no separate OG edit needed). **`_config.yml site.description` is NOT changed here** (R3 — site-wide fallback; defer to Helm).

- [ ] **Step 1: Verification assertion (must fail now)**

```bash
grep -ic 'context layer' pricing/index.html customers/index.html | grep -v ':0' || echo "none yet"
```
Expected now: pricing has 3 (from Task 2 body edits) but its `<title>`/meta have 0; customers has 0. Confirm by reading lines 26–28 of each.

- [ ] **Step 2: Pricing `<title>` + meta (lines 26–27)**

Replace:
```html
<title>Stratum — Pricing. Annual platform, decisions in arrears.</title>
<meta name="description" content="Stratum is priced by the value supported, not the seats filled. Annual platform fee plus a quarterly usage tier on the decisions the Console actually supports. No per-seat math." />
```
with:
```html
<title>Stratum Pricing — the context layer for HCM, priced by decisions supported</title>
<meta name="description" content="Stratum is the context layer your HCM agents read from, priced by the value supported, not the seats filled. Annual platform fee plus a quarterly usage tier on the decisions the Console actually supports. No per-seat math." />
```

- [ ] **Step 3: Customers `<title>` + meta (lines 27–28)**

Replace:
```html
<title>Customer Notes — Stratum</title>
<meta name="description" content="An honest field report from a six-week-old company. Three customer notes, five design partners, one published quarterly cadence." />
```
with:
```html
<title>Customer Notes — Stratum, the context layer for HCM</title>
<meta name="description" content="An honest field report from a company building the context layer for HCM. Customer notes from design partners — every decision traceable to the data behind it." />
```

*(Note: the body copy "Three customer notes, five design partners" is a live count claim, not in this workstream's scope — verify the current published count before adopting any number; the rewrite above drops the stale count rather than asserting a new one. Flag to Helm if he wants the count restored.)*

- [ ] **Step 4: console meta descriptions** *(R6 RESOLVED: included)*

`ember/console/index.html:4` and `recruiter/console/index.html:4,28` front-matter `description:` end with "on the people graph". Change the trailing phrase to "on your org's context layer" — but **do not touch the URL, layout, or H1**. These are SEO/meta only.

- [ ] **Step 5: Verify**

```bash
grep -c 'context layer' pricing/index.html       # expect 5 (3 body + title + meta)
grep -c 'context layer for HCM' customers/index.html  # expect 2 (title + meta)
```
Expected: `5`, `2`.

- [ ] **Step 6: Build (OG/twitter inheritance check)**

```bash
make build
grep -c 'context layer' _site/customers/index.html   # expect ≥4 (title + meta + og:title + og:description via Liquid)
```
Expected: clean build; OG tags inherited the new title/description automatically.

- [ ] **Step 7: Commit**

```bash
git add pricing/index.html customers/index.html
git commit -m "SEO · 'context layer for HCM' on pricing + customers titles/meta (Workstream D)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Guard assertion + cross-surface sweep + landing

**Files:**
- Verify: the six engineering artifacts (untouched)
- Modify: `index.html` hero (persistent `hero-positioning` line, T1) + ticker (both `.ticker-strip` blocks) — **land together in one homepage commit**

- [ ] **Step 1: GUARD — the six engineering artifacts STILL say "graph"**

This is the structural defense against scope creep. Run:
```bash
for f in whitepaper substrate schema-reference standards playground; do
  printf '%-18s ' "$f"; grep -ic 'graph' engineering/people-graph-$f.html
done
grep -ic 'graph' engineering/eval-set-methodology.html
```
Expected: every artifact prints a **non-zero** "graph" count, unchanged from baseline. If any dropped, a Workstream-D edit leaked into engineering territory — STOP and revert.

- [ ] **Step 2: GUARD — URL slugs unchanged**

```bash
ls engineering/people-graph-*.html | wc -l        # expect 5 (whitepaper, substrate, schema-reference, standards, playground)
test -f engineering/eval-set-methodology.html && echo "eval-set OK"
test -d graph && echo "/graph/ slug OK"
```
Expected: `5`, `eval-set OK`, `/graph/ slug OK`. No file renamed.

- [ ] **Step 3: Customer surfaces now carry the frame**

```bash
grep -c 'context layer'      pricing/index.html      # expect 5
grep -c 'context layer for HCM' customers/index.html # expect 2
grep -c "your org's context\|org context" console/index.html  # expect 2 (eyebrow + hiring sub-line)
grep -c 'architected against the context layer' _essays/selling-tuesday-afternoons.html  # expect 1
```
Expected: `5`, `2`, `2`, `1`.

- [ ] **Step 4: No category claim says "contextual map" anywhere new**

```bash
grep -rin 'contextual map' index.html pricing/ customers/ console/ _essays/selling-tuesday-afternoons.html
```
Expected: **zero hits.** "Contextual map" is the rejected term and must never appear as a category claim.

- [ ] **Step 5: Clean build + CSS audit (whole workstream)**

```bash
make build
make audit
```
Expected: clean Jekyll build; no NEW CSS-leak warnings versus baseline. *Exception:* T1's `hero-positioning` class is a new selector intentionally introduced — `make audit` may flag it; that is expected and not an error. All other edits (T2–T5) reuse existing classes — no additional new selectors.

- [ ] **Step 6: Landing ticker + hero (project convention — land together in one homepage pass)**

Per the homepage-freshness convention, this repositioning is a major Stratum update and lands in BOTH `index.html` `.ticker-strip` blocks. **Land the ticker addition together with the T1 hero edit (the `hero-positioning` line) in one coherent homepage commit.** Proposed ticker item:

> Context-layer reframe (Workstream D) — Stratum is now positioned as the context layer your HCM agents read from; the graph substrate stays the proof, customer-facing pages carry the new category frame.

Locate the strips and copy the existing `.t-item` element structure:
```bash
grep -n 'ticker-strip' index.html
```
Add the item to both strips; any internal link uses `{{ '/path' | relative_url }}`.

- [ ] **Step 7: Verify hero + ticker in both strips, then commit**

```bash
grep -c 'context layer your HCM agents read from' index.html  # expect 1 (hero-positioning line, T1)
grep -c 'Context-layer reframe' index.html                    # expect 2 (one per ticker strip)
git add index.html
git commit -m "Homepage · context-layer hero positioning + ticker (Workstream D)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Rulings requested (Helm decides before/while implementing)

- **R1 — Homepage hero placement — ✅ RESOLVED: option (a) approved.** Add a persistent `<p class="hero-positioning">` alongside the briefing hero, carrying the ratified lead sentence: *"Stratum is the context layer your HCM agents read from — every decision traceable to the data behind it, on a graph substrate rigorous enough to put in front of your board."* Task 1 and T6 ticker are now unblocked; they land together in one homepage commit (T6 Step 7).

- **R2 — Footer/nav "People graph" link labels.** `customers/index.html:1320`, `pricing/index.html:1726`, `pricing/calculator.html:1488` (inlined) + `_includes/footer.html:18` + `_includes/site-nav.html:50,136` all label a link to `/graph/` (or `/product/#product`) as "People graph." These point at pages NOT being repositioned, and exist site-wide. Changing them only on customers/ + pricing/ would create cross-page inconsistency. *My lean:* **hold** — this is a nav-taxonomy decision, not positioning copy; if changed, change everywhere (include + all inlined footers) in a separate sweep. **Consequence if held:** `customers/index.html` and `pricing/calculator.html` have *only* footer-link "people graph" hits, so for those two pages this workstream is **SEO/meta-only** (T5) — they get no body edit.

- **R3 — `_config.yml site.description`** is `An AI-native human capital platform.` and is the **site-wide** meta fallback (engineering pages inherit it too). High SEO leverage for "context layer + HCM," but global. *My lean:* hold from this plan; decide alongside R1 — if (a)/(b), a candidate is `Stratum — the context layer your HCM agents read from.`

- **R4 — Console "Source: People Graph" provenance labels** (`console/index.html` ×8). These are lineage/credibility signals, which align with the ratified "graph stays for credibility" split. *My lean:* **hold** (keep "graph") — they are not category claims; flipping them to "context" weakens the provenance signal.

- **R5 — Essay 03 pricing-script quote** (`_essays/selling-tuesday-afternoons.html:1550`, "the fee scales with the size of your people graph"). This is a documented, published pricing-script quote — editing it is heavier than a tagline swap and may need re-confirmation that the script still reads that way. *My lean:* **hold** unless you want published essay script-quotes brought into line; T4 edits only the descriptive line 1443.

- **R6 — Ember/Recruiter console meta descriptions — ✅ RESOLVED: included.** `ember/console/index.html:4`, `recruiter/console/index.html:4,28` meta descriptions ending "on the people graph" are part of the "context layer · HCM" SEO pass. T5 Step 4 is now unconditional — change the trailing phrase to "on your org's context layer." SEO/meta only; no URL, layout, or H1 changes.

- **R7 — `essays/index.html:728` dek** summarizes Forge's engineering essay *"The graph between the databases."* *My lean:* **keep "graph"** — it describes an engineering-credibility essay whose title is literally about the graph; flipping it would misname the linked piece. Listed for completeness; not in any edit task.

---

## Definition of done

- `pricing/index.html`: Plan-A tagline, feature, and timeline carry "context layer"; title/meta carry "context layer for HCM"; the proof noun "graph substrate" is preserved on line 1574.
- `console/index.html`: Ask eyebrow + hiring sub-line read "your org's context" / "org context"; People-tab title reads plain "People."; the 8 `Source: People Graph` provenance labels are intact (R4).
- `_essays/selling-tuesday-afternoons.html`: line 1443 reads "architected against the context layer"; the pricing-script quote is intact (R5).
- `customers/index.html`: title/meta carry "context layer for HCM."
- Guard passes: all six engineering artifacts still say "graph"; no `people-graph-*` / `/graph/` slug renamed; "contextual map" appears nowhere as a category claim.
- `make build` clean; `make audit` shows no new CSS leaks.
- `index.html` hero carries the `<p class="hero-positioning">` lead sentence (T1, R1 resolved); both `.ticker-strip` blocks carry the context-layer reframe ticker item (T6); both land in one commit.

## Out of scope (other workstreams / not this program)

- Workstream A (governance basis) edits to the six engineering artifacts and the engineering ticker entries.
- `research/`, `intel/`, `engineering/`, `product/`, `api/`, `tour/`, `cairn/`, `graph/`, `_briefings/` — every "people graph" hit outside spec §6's named surfaces.
- Any device/location/non-person copy (Eglin: hold non-person GTM 12–18mo; this is renaming the *existing* people story, not a TAM expansion).
- URL-slug renames / redirects (displayed phrase only changes; paths are frozen).
- The next Briefing's prose entry — authored by Helm in the briefing cycle, not this plan.

## Method note

Built by: (1) reading the ratified spec §1/§6/§7 and the Workstream-A sibling plan as the format template; (2) grepping the repo for "people graph" (case-insensitive), then **discarding the 261KB repo-wide result** and re-grepping only spec §6's named surfaces with line numbers; (3) reading each in-scope occurrence in context to classify it EDIT / SEO-META / HOLD and write verbatim before/after copy; (4) confirming the hero has no swappable phrase, the footer labels point to un-repositioned pages, and `site.description` is a site-wide fallback — the three findings that became rulings R1/R2/R3; (5) one advisor pass before drafting to lock the scope boundary and the surface-dependent replacement-phrase rule. No customer-facing file was edited; this is a plan only.
