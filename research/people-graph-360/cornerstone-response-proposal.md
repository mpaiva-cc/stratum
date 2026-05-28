# People Graph 360 — Cornerstone Response Proposal

**Author:** Eglin · industry research desk
**Date:** 2026-05-27
**Target paper:** `/research/people-graph-360.html` (2,370 lines, ~6,400 words, published 2026-05-22)
**Trigger:** Cornerstone Workforce AI launch (2026-05-20) — trademark notation on **Cornerstone People Graph™** and **Cornerstone Skills Engine**.
**Handoff to:** Tessera (visual / layout integration)

---

## Headline

**This is a sharpening pass, not surgery.** The paper already does the conceptual work — §I opens with "the phrase has been captured" and enumerates five "what it is not" distinctions; §III rates vendor graph claims honestly; the footer copy already lands the "real people graph, not a stack of tables with a graph in the marketing copy" line. The architecture of the argument is sound. What is missing is **Cornerstone-shaped pressure** in two places, and a tighter definitional clause in one.

Three changes, ranked by load-bearing weight:

1. **§I — Add a sixth "what it is not" item: the single-vendor inference layer.** Structural. Highest priority.
2. **§III — Add a Cornerstone row to the competitor matrix.** Mandatory. Excluding it would itself be a tell.
3. **§I — Tighten the single-sentence summary** so "multi-source" cannot be misread as "multi-source within our own product."

Two smaller inline reinforcements in §IX and a masthead revision-marker decision are flagged below.

Default framing posture: **do not name Cornerstone outside §III.** The paper's voice is "we define the term, you decide who fits." The matrix is the appropriate place to name vendors; the framing sections (§I, §II, §IV–IX) read more authoritatively when they describe shapes, not vendors.

---

## Change 01 · §I · Add a sixth "Not …" item

**Location.** `/research/people-graph-360.html`, §I, inside the second `<ul class="distlist">` (the "five things the people graph is *not*" list, currently ending with "Not Microsoft Graph" around lines 1009–1021). Add a sixth `<li>` after the Microsoft Graph item, before the closing `</ul>`.

**Reason.** The current five anti-shapes are: Not the HRIS, Not the ATS funnel, Not the org chart, Not LinkedIn, Not Microsoft Graph. None of them covers the shape Cornerstone (and arguably Eightfold) now ships under the "graph" noun: **an inference layer over a single vendor's own longitudinal corpus.** This is the most common architectural confusion in 2026 and the paper's anti-shape list has a hole where this category should be. Adding a sixth item closes that hole categorically — without naming Cornerstone — and the item ages past the news cycle. It is also the structural addition that does the most defensive work per word.

**Proposed prose (HTML, matching `distlist` pattern):**

```html
<li>
  <span class="dn">Not a single-vendor inference layer</span>
  <span class="db">A growing class of products describes itself as
  a &ldquo;graph&rdquo; while meaning something different: an inference
  engine trained on the vendor&rsquo;s own longitudinal corpus &mdash;
  user counts, profile counts, taxonomy entries &mdash; surfaced as
  recommendations to that vendor&rsquo;s customers. This is a real and
  often useful object. It is also <em>scoped to what the vendor
  already sees.</em> It is not identity-resolved across the
  customer&rsquo;s other systems; it does not carry the customer&rsquo;s
  consent regime on its edges; its &ldquo;person&rdquo; is the vendor&rsquo;s
  record of that person, not the entity-resolved human across the
  customer&rsquo;s actual stack. A useful inference surface and a
  people graph in the &sect;I sense are <strong>categorically different
  objects</strong> that have unfortunately converged on the same noun.</span>
</li>
```

**Framing note.** Cornerstone is not named. Eightfold is not named. The frame is shape-based and survives Cornerstone, Eightfold, and any future entrant that ships a similarly-shaped product.

---

## Change 02 · §I · Tighten the single-sentence summary

**Location.** `/research/people-graph-360.html`, §I, closing paragraph of the section (lines 1024–1033, the paragraph that begins "The single-sentence summary, which Eglin will use throughout the rest of this brief…"). Replace the bolded summary clause.

**Reason.** The current summary — "a people graph is what you have when the same human being is one node across every system that knows them, every edge to and from that node carries a time interval and a consent flag, and the structure is queryable by traversal" — is good, but "every system that knows them" can be read as "every system the vendor has built." Once a competitor uses "People Graph" to mean "our inference layer over our own corpus," the sentence has to defend the cross-system property explicitly. Adding **"including systems the vendor does not own"** load-bears against the inference-layer frame and costs five words.

**Proposed prose change.** Replace the existing bolded clause:

> **a people graph is what you have when the same human being is one node across every system that knows them, every edge to and from that node carries a time interval and a consent flag, and the structure is queryable by traversal.**

with:

> **a people graph is what you have when the same human being is one node across every system that knows them &mdash; including systems the vendor does not own &mdash; every edge to and from that node carries a time interval and a consent flag, and the structure is queryable by traversal.**

That one em-dash clause is the entire fix for this paragraph.

---

## Change 03 · §III · Add a Cornerstone row to the competitor matrix

**Location.** `/research/people-graph-360.html`, §III, inside the `<tbody>` of the `<table>` in `<div class="compmat">` (the competitor-scan matrix). Currently runs Workday → Eightfold → Gloat → Beamery → LinkedIn → Microsoft → HiBob → Rippling → Lattice → ChartHop → Eqtble → Deel → Mercor. Insert the Cornerstone row in a defensible position; recommend placing it **between Eightfold and Gloat** (matches the "named graph, partial-shipped, inference-layer-shape" cluster) or **between Microsoft and HiBob** (matches the "named graph product, distinct shape" cluster). I lean toward the second placement — it groups by data-model honesty rather than by graph claim.

**Reason.** Mandatory. §III is the paper's vendor scan, with confidence-rated claims for twelve vendors. Excluding the vendor with the most aggressive graph-noun claim of the year — a launch six days before this paper was published, with trademark notation and a 15-city tour planned — would be a visible omission. The matrix's credibility depends on its completeness. This is also the *only* place in the paper where naming Cornerstone is appropriate.

**Proposed prose (HTML, matching the existing row pattern):**

```html
<tr>
  <td class="vendor">Cornerstone<span class="sub">Workforce AI &middot; People Graph&trade;</span></td>
  <td><span class="pill p-partial">Partial</span></td>
  <td><span class="pill p-row">Inference layer</span></td>
  <td>Cornerstone&rsquo;s 2026-05-20 Workforce AI launch introduced
  <strong>Cornerstone People Graph&trade;</strong> and <strong>Cornerstone
  Skills Engine</strong> as the substrate beneath eleven-plus
  &ldquo;readiness agents,&rdquo; positioned with claimed scale of
  <em>45M users, 1B workforce profiles, and a 55,000-skill taxonomy</em>
  drawn from two decades of Cornerstone customer data. The architecture,
  on Cornerstone&rsquo;s own description, is an inference layer over
  Cornerstone&rsquo;s longitudinal corpus &mdash; powerful inside the
  Cornerstone footprint, scoped to what Cornerstone already sees. Eglin
  found no public documentation of identity resolution across customer
  systems Cornerstone does not own (HRIS, ATS, payroll, directory), of
  time-aware edges with valid-from/valid-to, or of per-edge consent
  metadata. The &ldquo;graph&rdquo; here names a recommendation surface,
  not a cross-system relational object in the &sect;I sense. This is
  the inference-layer shape described in &sect;I&rsquo;s sixth distinction;
  the launch is the cleanest example of why that distinction was
  needed.</td>
</tr>
```

**Confidence rating.** "Partial" with data-model labeled as "Inference layer." This is honest: Cornerstone has shipped something real and substantial, and it is not the §I object. "Claim" would be unfair; "Shipped" would be wrong. **Partial / Inference layer** is the accurate read and matches the rating already given to Eightfold for an architecturally similar (though more skills-focused) shape.

**Source footnote.** The paper currently has 31 sources (lines 2144–2269). Add a new source entry under the verified rung, pointing at the two Cornerstone-published launch articles already cited in Battlecard No. 022. Suggested:

```html
<li id="src-32">
  <span class="sc sc-v">Verified</span>
  <span class="sbody"><strong>Cornerstone Workforce AI launch announcement, 2026-05-20</strong> &middot; Cornerstone OnDemand corporate press release and product article. Cornerstone People Graph&trade;, Cornerstone Skills Engine, eleven-plus readiness agents, Slack/Teams MCP integration, Salesforce Agentforce partnership. Numbers cited (45M users, 1B profiles, 55K skills) are Cornerstone&rsquo;s own. <a href="https://www.cornerstoneondemand.com/resources/article/introducing-cornerstone-workforce-ai-the-intelligence-platform-for-workforce-readiness/" target="_blank" rel="noopener">cornerstoneondemand.com &middot; Workforce AI launch</a> and <a href="https://www.cornerstoneondemand.com/company/news-room/press-releases/cornerstone-launches-cornerstone-workforce-ai-the-intelligence-platform-for-workforce-readiness-built-to-amplify-human-potential-exponentially-with-ai/" target="_blank" rel="noopener">cornerstoneondemand.com &middot; press release</a></span>
</li>
```

Update the masthead sources count from `31 cited` to `32 cited` (line 840) and the working-bibliography header from `31 sources` to `32 sources` (line 2137).

---

## Change 04 · §IX Implication 01 · Acknowledge the contested noun

**Location.** `/research/people-graph-360.html`, §IX, Implication 01 (lines 2037–2052, "Stop saying 'MCP-native HCM.' Start saying 'the people graph.'"). Add one sentence to the body paragraph; the headline and verdict can stay.

**Reason.** The recommendation as written tells Stratum to **claim the noun**. As of 2026-05-20, the noun is **contested**: Cornerstone has trademark-noted "Cornerstone People Graph™" and is preparing a 15-city tour reinforcing the term throughout 2026. Beamery has used "Talent Graph" for nine years. Gloat uses "Workforce Graph." A recommendation that ignores the contest reads naïve five days later. The fix is not to retreat from the noun — Stratum's structural claim is honest — but to acknowledge that the play is **owning the definition**, not racing to plant a flag. One sentence does this without rewriting the recommendation.

**Proposed insertion.** Add after the existing sentence ending "…and report back. Verdict in writing by T+95d." (before the closing `</p>`):

> A note on what changed in the week this brief published: at least one major incumbent has now trademark-noted &ldquo;People Graph&rdquo; as a product name, and others use adjacent graph nouns. Eglin&rsquo;s recommendation is unchanged but sharpened: Stratum&rsquo;s play is to <em>own the definition</em> &mdash; the &sect;I anti-shapes, the resolver eval-set, the cross-system architecture &mdash; not to race for ownership of the noun. The noun travels with whichever vendor publishes the most technically defensible meaning. That is the contest Stratum should enter.

This is the only place in the paper where the vocabulary contest is acknowledged in the voice of strategic recommendation. It is also the only place where naming a recent competitor move (without naming the competitor) is warranted, because §IX is the recommendation section and recommendations have to respond to what changed.

---

## Change 05 · Masthead revision marker — **judgment call to flag**

**Location.** `/research/people-graph-360.html`, masthead, line 838: `<div><span class="k">Published</span><span class="v">2026-05-22 &middot; T+88d</span></div>`.

**Two options:**

1. **Edit silently.** Paper is only 5 days old; treating this as part of the initial scan rather than a revision is defensible. Cleanest for the casual reader.

2. **Add a revision marker.** Update the published line to `<span class="v">2026-05-22 &middot; rev 1.1 on 2026-05-27</span>` and add a small "Revision history" note at the end of §X (or in the closing footer) recording: "1.1 · 2026-05-27 · §III matrix updated with Cornerstone; §I gained a sixth anti-shape (single-vendor inference layer); §IX-01 acknowledges the contested-noun moment."

**Recommendation:** Option 2 (revision marker). The paper is positioned as the canonical reference; a continuously-maintained canonical reference is more credible than a one-shot brief. The discipline of marking revisions also creates the closed-loop research the O-2 objective calls for — future Eglin reading past Eglin sees that the document responded to a market event within a week.

**Why this is a judgment call I want the user's input on:** marking a revision this early might read as defensive ("they updated within a week of Cornerstone's launch"). Editing silently might read as more confident but loses the closed-loop signal. The call is editorial, not analytical. **Default to revision marker unless redirected.**

---

## What I did NOT propose, and why

- **A new section.** Reactive in shape; the paper is already 2,370 lines / ~6,400 words. The structural work is done by adding the sixth anti-shape in §I — that single bullet does the load-bearing defense, and a dedicated section ("How to read competing graph claims" or similar) would over-elevate Cornerstone's move.
- **Trademark / IP posture language.** Naming "Cornerstone People Graph™" and asserting that Stratum's prior use predates the trademark would be defensive and elevate the threat. The paper's voice is definitional, not legal.
- **Naming Cornerstone in §I or §IX.** The framing sections read more authoritatively when they describe shapes, not vendors. §III is the only section where naming Cornerstone is appropriate.
- **A comparative-architecture diagram.** Tessera may want to consider one, but it is not necessary content; the prose distinctions carry the argument. If Tessera adds visual treatment, that is her call.
- **An expanded Workday row in §III referencing "Workday Graph" / Illuminate / ASOR.** The landscape brief Eglin shipped this week mentions "Workday Graph" as the Illuminate substrate. The §III Workday row could be sharpened to reflect this. **Out of scope for this dispatch** — that is a Workday-specific refresh, not part of the Cornerstone response. Noted for future revision.

---

## Inline-only or new sections? — handoff to Tessera

**All five proposed changes are inline.** No new sections. No new component types. No comparison tables (the §III table already exists and is being extended by one row). No new callouts (the existing `.callout.eglin` callouts in §II and §III already do the framing work). **Low design impact.**

**Visual treatments to consider — Tessera's judgment, not Eglin's call:**

- **§I sixth anti-shape item:** Slots into the existing `<ul class="distlist">` pattern. The grid-template-columns is `12rem 1fr`, so the label "Not a single-vendor inference layer" may be tight at the 12rem reserved width. Tessera may want to verify the line-wrap behavior on the label cell at narrow viewports. Falling back to "Not a vendor inference layer" or "Not an inference layer" would be acceptable line-wrap remediations but lose a little precision.

- **§III Cornerstone row:** Uses the same row pattern as the other twelve. The "Inference layer" pill needs a class — the existing pill set is `.p-shipped`, `.p-partial`, `.p-claim`, `.p-graph`, `.p-row`. "Inference layer" most honestly maps to `.p-row` (it is not graph-storage) but the *label* should read "Inference layer" not "Row-store." A small visual choice — Tessera may want a new pill class (`.p-infer` or similar) in the same family as the existing row palette, or may decide reusing `.p-row` with a different label is enough. Eglin's preference: same color family, distinct label, no new class unless Tessera wants the visual separation.

- **§IX Implication 01 insertion:** Slots into the existing `<p>` inside the impl-card. No new visual treatment. The added sentence is ~70 words and the existing card already runs ~100 words; the card may need to grow slightly. Tessera should verify the grid balance in `.impl-grid` (three cards, currently roughly equal length).

- **Masthead revision marker (if Option 2):** A single character change in the published line plus a small "Revision history" entry. Tessera may want to introduce a `.rev-history` micro-style or fold it into the existing masthead-meta pattern.

- **Source [32]:** Appends to the existing `<ol>` in `.sources`. No new pattern. Count updates to `32 cited` and `32 sources`.

**No pull-quote, no sidebar, no comparison block recommended.** The existing pullquote between §III and §IV ("Most vendors call it a graph. A few have built one…") already does the work a Cornerstone-shaped pull-quote would do. Adding another would clutter; replacing it would lose the line.

---

## Summary table — what changes, where, why

| # | Section | Location (line range) | Change type | Cornerstone named? | Priority |
|---|---|---|---|---|---|
| 01 | §I | ~lines 1009–1021 (end of second distlist) | Add 6th anti-shape `<li>` | No — categorical | **Highest** (structural) |
| 02 | §I | ~lines 1024–1033 (summary paragraph) | Add em-dash clause to bolded summary | No | High (definitional) |
| 03 | §III | Inside compmat `<tbody>` between Microsoft and HiBob rows; +source [32]; +source count updates | Add `<tr>`; add `<li>`; update two count fields | **Yes** (appropriate here) | **Highest** (mandatory) |
| 04 | §IX Impl. 01 | ~lines 2041–2051 (body paragraph) | Add one sentence acknowledging contested noun | No — references "at least one major incumbent" | High (closes loop) |
| 05 | Masthead + §X | Lines 838 (published meta); end of §X | Revision marker + revision-history note | No | **Judgment call — user decision** |

---

## Briefback for parent

- **Headline:** Sharpening pass, not surgery. The paper's architecture survives Cornerstone's launch; what it needs is one new anti-shape in §I, a Cornerstone row in §III, and a half-sentence in §IX acknowledging the noun is now contested.
- **Most important single change:** §I gains a sixth "what it is not" item — "Not a single-vendor inference layer" — framed categorically without naming Cornerstone. This is the structural defense that ages past the news cycle.
- **Judgment call flagged for the user:** Whether to mark the paper as **rev 1.1, 2026-05-27** in the masthead (with a brief revision-history note) or edit silently. Default recommendation: revision marker — paper is positioned as canonical reference, and continuously-maintained beats one-shot. But this is editorial, and the user may want to call it.
