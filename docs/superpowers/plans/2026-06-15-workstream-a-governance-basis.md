# Workstream A — Governance-Basis Re-grounding · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-ground the people-graph's consent plane as a three-species **governance basis** (`consent` / `authorization` / `delegated_authority`) across the four credibility artifacts, so non-person entities (device, location, org_unit, agent) can be governed without any edge being mislabeled "consent."

**Architecture:** A v6 revision of the *universal edge envelope*. Add one discriminator field, `basis enum {consent | authorization | delegated_authority}`, defaulting to `consent`; every existing v3 edge is consent-basis and unchanged in meaning. Rename the gating field `consent_scopes → governance_scopes`, keeping `consent_scopes` as a documented deprecated alias (mirrors the repo's `experienced`/`has_event` and `applied_for` alias precedents — zero query breakage). The traversal-predicate *mechanism* (substrate §VI) is unchanged; only its vocabulary generalizes. This is a documentation + schema-vocabulary change — no application code, no fixture/generator change (consent edges live in the graph, not the flat fixtures, per WP-01 §10).

**Tech Stack:** Jekyll static site (Ruby/`bundle`), hand-authored HTML. Verification is grep-based consistency assertions + `make build` (clean Jekyll build) + `make audit` (CSS-leak report). No unit-test framework touches these pages; the playground's node tests do not model consent.

**Canonical surface (authoritative → derived):**
1. `engineering/people-graph-schema-reference.html` — the canonical envelope definition (§II, line ~824). **Edit first; it is the source of truth.**
2. `engineering/people-graph-whitepaper.html` — WP-01 §4 (Consent) + the envelope dataframe (line ~1770).
3. `engineering/people-graph-substrate.html` — §VI narrative (line ~1030).
4. `engineering/people-graph-standards.html` — §7 conformance posture / envelope references.
5. `index.html` — live ticker entry on landing (project convention; both `.ticker-strip` blocks).

---

## Task 1: Define the governance basis in the schema reference (canonical)

**Files:**
- Modify: `engineering/people-graph-schema-reference.html` (envelope §II, lines 832–846; add §II.a after 846)

- [ ] **Step 1: Write the verification assertion (it must fail now)**

Run:
```bash
grep -c 'p-name">basis<' engineering/people-graph-schema-reference.html
grep -c 'governance_scopes' engineering/people-graph-schema-reference.html
```
Expected now: both print `0` (the field doesn't exist yet). This is the "failing test."

- [ ] **Step 2: Add the `basis` row to the envelope property table**

In `engineering/people-graph-schema-reference.html`, immediately AFTER the `confidence` row (line 844) and BEFORE the `consent_scopes` row (line 845), insert:

```html
      <div class="prop-row"><div class="p-name">basis</div><div class="p-type">enum</div><div class="p-req">req</div><div class="p-mean">Governance species that gates this edge: <span class="inline-mono">consent</span> (a person / data subject), <span class="inline-mono">authorization</span> (device, location, org_unit, external_org), or <span class="inline-mono">delegated_authority</span> (agent). Defaults to <span class="inline-mono">consent</span>; every canonical-v3 edge is consent-basis and unchanged. See §&nbsp;II.a.</div></div>
```

- [ ] **Step 3: Rename `consent_scopes → governance_scopes` in the envelope (with alias note)**

Replace the existing `consent_scopes` row (line 845):

```html
      <div class="prop-row"><div class="p-name">consent_scopes</div><div class="p-type">[str]</div><div class="p-req">req</div><div class="p-mean">Traversal predicate (§4 of WP-01): an edge whose scopes the caller&apos;s purpose token cannot satisfy is structurally unreachable.</div></div>
```

with:

```html
      <div class="prop-row"><div class="p-name">governance_scopes</div><div class="p-type">[str]</div><div class="p-req">req</div><div class="p-mean">Traversal predicate (§4 of WP-01): an edge whose scopes the caller&apos;s purpose token cannot satisfy is structurally unreachable. Read under the edge&apos;s <span class="inline-mono">basis</span>. <span class="inline-mono">consent_scopes</span> is retained as a <span class="sbadge openq">deprecated alias</span> so existing v3 queries do not break — write <span class="inline-mono">governance_scopes</span>.</div></div>
```

- [ ] **Step 4: Add §II.a — the governance-basis species table**

Immediately AFTER the closing `</div>` of the envelope `prop` block (line 846), insert:

```html

    <h2 id="basis"><span class="ord">§ II.a — Governance basis</span>The species the predicate reads. <span class="sbadge ratified" style="vertical-align:middle">ratified v6</span></h2>
    <p>
      The consent plane (§4 of WP-01) was person-shaped: it gated traversals on a
      data subject&apos;s consent. As the graph admits non-person entities, the plane is
      re-grounded as a <strong>governance basis</strong> with three species. The
      predicate <em>mechanism</em> is unchanged; only the vocabulary generalises. We
      never label an edge &ldquo;consent&rdquo; where no subject consented.
    </p>
    <div class="prop">
      <div class="prop-row prop-head"><div>basis</div><div>applies to</div><div>grantor</div><div>scope validity</div></div>
      <div class="prop-row"><div class="p-name">consent</div><div class="p-mean">person</div><div class="p-mean">the data subject</div><div class="p-mean">consent-grant validity</div></div>
      <div class="prop-row"><div class="p-name">authorization</div><div class="p-mean">device, location, org_unit, external_org</div><div class="p-mean">the institution</div><div class="p-mean">policy validity</div></div>
      <div class="prop-row"><div class="p-name">delegated_authority</div><div class="p-mean">agent</div><div class="p-mean">the company extending it</div><div class="p-mean">the agent&apos;s policy-version lifetime</div></div>
    </div>
    <p>
      A caveat the DPO keeps on the record: a <span class="inline-mono">device&nbsp;&rarr;&nbsp;assigned_to&nbsp;&rarr;&nbsp;person</span>
      edge still carries the <em>person&apos;s</em> consent. Non-person entities therefore add a
      <em>second</em> basis an edge must satisfy — they do not simplify the plane.
    </p>
```

- [ ] **Step 5: Add §II.a to the page's table of contents**

Find the TOC entry for the envelope (line 762, `<li><a href="#envelope">The universal edge envelope</a></li>`) and insert directly after it:

```html
    <li><a href="#basis">§ II.a — Governance basis</a></li>
```

- [ ] **Step 6: Run the verification assertions (must pass now)**

Run:
```bash
grep -c 'p-name">basis<' engineering/people-graph-schema-reference.html              # expect 1 (envelope row only; species rows are p-name consent/authorization/delegated_authority)
grep -c 'p-name">delegated_authority<' engineering/people-graph-schema-reference.html # expect 1 (species table)
grep -c 'governance_scopes' engineering/people-graph-schema-reference.html            # expect 2 (envelope row + "write governance_scopes")
grep -c 'id="basis"' engineering/people-graph-schema-reference.html                   # expect 1
```
Expected: `1`, `1`, `2`, `1`.

- [ ] **Step 7: Commit**

```bash
git add engineering/people-graph-schema-reference.html
git commit -m "Schema-ref · governance basis (v6) — add basis discriminator + §II.a species table

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Re-ground WP-01 §4 and the envelope dataframe

**Files:**
- Modify: `engineering/people-graph-whitepaper.html` (envelope dataframe lines 1765–1782; §4 prose — locate via grep below)

- [ ] **Step 1: Confirm WP-01 §4 anchors**

§4 (Consent) body heading is at line 1355 (`<h2 id="s4">…§ 4 — Consent…`); §5 begins at line 1387 (`<h2 id="s5">…§ 5 — Entity resolution…`). The §4 body is lines 1356–1386. Read it before editing:
```bash
sed -n '1355,1387p' engineering/people-graph-whitepaper.html
```

- [ ] **Step 2: Add `basis` to the envelope dataframe and rename the scopes line**

In the dataframe (lines 1770–1782), replace the final `consent_scopes` line (1782):

```html
<span class="k">consent_scopes</span>    <span class="s">[str]</span>       <span class="c">// traversal gated on these — required</span></div>
```

with these two lines:

```html
<span class="k">basis</span>             <span class="s">enum</span>        <span class="c">// consent | authorization | delegated_authority — default consent</span>
<span class="k">governance_scopes</span> <span class="s">[str]</span>       <span class="c">// traversal gated on these, read under basis — required (alias: consent_scopes)</span></div>
```

- [ ] **Step 3: Update the envelope prose sentence**

Replace the sentence in the paragraph at lines 1765–1767:

```
      <span class="inline-mono">consent_scopes</span> is a traversal predicate,
      not a filter (§4): an edge whose scopes the caller&apos;s purpose token
      cannot satisfy is structurally unreachable during path expansion.
```

with:

```
      <span class="inline-mono">governance_scopes</span> is a traversal predicate,
      not a filter (§4): an edge whose scopes the caller&apos;s purpose token
      cannot satisfy is structurally unreachable during path expansion. The scopes
      are read under the edge&apos;s <span class="inline-mono">basis</span> — consent for a
      person, authorization for an institutional entity, delegated authority for an agent.
```

- [ ] **Step 4: Add a basis paragraph to §4 body**

At the end of the §4 (Consent) section body — directly before line 1387 (the `<h2 id="s5">` heading that opens §5) — insert this paragraph (match the surrounding `<p>` style):

```html
    <p>
      One generalisation §4 now carries: as the graph admits non-person entities, the
      plane is re-grounded as a <strong>governance basis</strong> with three species —
      <span class="inline-mono">consent</span> (person), <span class="inline-mono">authorization</span>
      (device, location, org_unit), <span class="inline-mono">delegated_authority</span> (agent).
      The predicate is unchanged; the vocabulary stops calling everything &ldquo;consent.&rdquo;
      The full species table is §&nbsp;II.a of the companion schema reference.
    </p>
```

- [ ] **Step 5: Verify**

Run:
```bash
grep -c 'governance_scopes' engineering/people-graph-whitepaper.html             # expect 2 (dataframe line + envelope prose sentence)
grep -oc 'k">basis</span>' engineering/people-graph-whitepaper.html               # dataframe field — expect 1
grep -c 'inline-mono">basis<' engineering/people-graph-whitepaper.html            # prose reference — expect 1
```
Expected: `2`, `1`, `1`.

- [ ] **Step 6: Commit**

```bash
git add engineering/people-graph-whitepaper.html
git commit -m "WP-01 §4 · governance basis — generalise consent plane to three species

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Align the substrate post §VI narrative

**Files:**
- Modify: `engineering/people-graph-substrate.html` (§VI, heading at line 1030; edit body that follows)

- [ ] **Step 1: Read §VI**

Run: `sed -n '1030,1110p' engineering/people-graph-substrate.html` — read the section so the inserted prose matches its voice (first-person, Forge's register).

- [ ] **Step 2: Append the governance-basis paragraph to §VI**

At the end of §VI's body (before the §VII heading), insert:

```html
    <p>
      A revision since this post first ran: the plane is no longer named for consent
      alone. An agent does not consent — it operates under authority the company extends
      to it; a device or a building does not consent at all. So the predicate now reads a
      <strong>governance basis</strong> — <span class="inline-mono">consent</span> for a person,
      <span class="inline-mono">authorization</span> for an institutional entity,
      <span class="inline-mono">delegated_authority</span> for an agent. The traversal
      mechanism in this section is exactly as described; what changed is that we stopped
      writing &ldquo;consent&rdquo; on edges no one consented to. That was a DPO&apos;s
      objection, and it was right.
    </p>
```

- [ ] **Step 3: Verify**

Run: `grep -c 'governance basis' engineering/people-graph-substrate.html`
Expected: `1`+.

- [ ] **Step 4: Commit**

```bash
git add engineering/people-graph-substrate.html
git commit -m "Substrate §VI · note the consent→governance-basis re-grounding

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Align the standards page envelope/conformance language

**Files:**
- Modify: `engineering/people-graph-standards.html` (envelope references — locate via grep)

- [ ] **Step 1: Read the four pinned references**

There are exactly four references (confirm with the grep, then read each in context):
```bash
grep -n -i 'consent_scopes\|consent plane' engineering/people-graph-standards.html
# Expected: line 706 (plane), 977 (plane + GDPR), 1032 (field, code comment), 1039 (field, code example)
sed -n '700,712p;973,981p;1028,1042p' engineering/people-graph-standards.html
```

- [ ] **Step 2: Apply the four edits**

**Line 706** — `four layers, one consent plane,` → `four layers, one governance-basis plane,` (architectural plane name).

**Line 977** — `GDPR informs the consent plane; it does not get` → `GDPR informs the consent basis of the governance plane; it does not get`. (Keep "GDPR" and the legal concept of *consent*; only generalise the plane's name — consent is now one basis of the plane, §II.a.)

**Line 1032** — the code comment `// / consent_scopes attach? to a reified statement node.` → `// / governance_scopes attach? to a reified statement node.` (definitional field name).

**Line 1039** — `consent_scopes: [<span class="s">"hr.org_structure"</span>]` → `governance_scopes: [<span class="s">"hr.org_structure"</span>]` (rename the field; leave the scope value and basis as-is — this org_structure edge remains consent-basis in Workstream A).

- [ ] **Step 3: Verify no stale field name remains in a definitional context**

Run:
```bash
grep -n 'consent_scopes' engineering/people-graph-standards.html
```
Expected: zero hits, OR only a hit explicitly marked as the deprecated alias. If a bare definitional `consent_scopes` remains, fix it.

- [ ] **Step 4: Commit**

```bash
git add engineering/people-graph-standards.html
git commit -m "Standards · align envelope field + plane name to governance basis

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Cross-artifact consistency sweep, build, and landing

**Files:**
- Modify: `index.html` (both `.ticker-strip` blocks)
- Verify: all four engineering artifacts

- [ ] **Step 1: Cross-artifact consistency sweep**

Run:
```bash
# Every artifact that defines the envelope must now name basis + governance_scopes:
for f in schema-reference whitepaper; do
  echo "== $f =="; grep -c 'governance_scopes' engineering/people-graph-$f.html
done
# No definitional 'consent_scopes' left except deprecated-alias notes (should be small, > 0 only as alias):
grep -rn 'consent_scopes' engineering/people-graph-*.html
```
Expected: `governance_scopes` present in schema-reference and whitepaper; remaining `consent_scopes` hits are only the alias notes authored in Tasks 1–2.

- [ ] **Step 2: Clean Jekyll build (the real integration test)**

Run: `make build`
Expected: build completes with no Liquid/markup errors; `_site/engineering/people-graph-schema-reference.html` exists and contains `id="basis"`. Confirm:
```bash
grep -c 'id="basis"' _site/engineering/people-graph-schema-reference.html
```
Expected: `1`.

- [ ] **Step 3: CSS-leak audit (catch any inline-style regressions from new rows)**

Run: `make audit`
Expected: no NEW duplicated-CSS warnings attributable to the edited files versus the pre-change baseline. The new rows reuse existing classes (`prop-row`, `p-name`, `p-mean`, `sbadge`), so the report should be unchanged.

- [ ] **Step 4: Add the landing ticker entry (project convention)**

In `index.html`, add to BOTH `.ticker-strip` blocks a new ticker item recording the milestone, matching the existing item markup in each strip. Content:

> Governance basis ratified (v6) — the consent plane now reads three species: consent, authorization, delegated authority. No edge labeled "consent" where no one consented.

Locate the strips:
```bash
grep -n 'ticker-strip' index.html
```
Read one existing `.ticker-item` (or equivalent) inside the first strip, copy its exact element structure, and add the new entry to both strips with the content above.

- [ ] **Step 5: Verify the ticker entry is in both strips**

Run:
```bash
grep -c 'Governance basis ratified' index.html
```
Expected: `2` (one per strip).

- [ ] **Step 6: Final commit**

```bash
git add index.html
git commit -m "Homepage ticker · governance basis ratified (v6) — Workstream A landed

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Definition of done

- Schema reference defines `basis` (envelope row + §II.a species table + TOC link) and `governance_scopes` (with `consent_scopes` as deprecated alias).
- WP-01 §4 and its envelope dataframe carry `basis` + `governance_scopes` and the species generalisation.
- Substrate §VI and the standards page name the governance basis, not consent-only.
- `make build` is clean; `make audit` shows no new CSS leaks.
- `index.html` records the milestone in both ticker strips.
- No definitional `consent_scopes` remains except documented deprecated-alias notes.

## Out of scope (other workstreams)

- The `context()` interface (Workstream B), new node types (C), repositioning (D), hotspot work (E), eval probes (F).
- Adding actual `basis: authorization` / `delegated_authority` edges — those arrive with the device/location/agent node types in Workstream C. Workstream A only makes the envelope *able* to express them.
- The next Briefing's prose entry — authored by Helm in the briefing cycle, not this plan.
