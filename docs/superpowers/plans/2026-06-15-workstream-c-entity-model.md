# Workstream C — Entity Model (agent · location · org_unit recursion) · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generalize the substrate's entity model per spec §5/§7 — first-class the `agent` and `location` node types (proposed v6), formalize the `org_unit` recursion that mostly already exists, and **resolve the long-standing "does an agent get a node?" open question** (substrate §X + the schema-ref aside) — all documented coherently with the governance basis Workstream A already shipped.

**Architecture:** A schema-documentation + narrative change across three artifacts: the schema reference (new §VIII module + org_unit recursion note + open-question resolution), the whitepaper (v6 version-history row + taxonomy row), and the substrate post (§X resolution). No application code, no fixtures, no playground engine — those are an explicit deferred follow-up (the playground engine only knows `person`/`candidate`/`requisition`; new types follow the `proposed v5` Cairn precedent of being specced without fixtures). The new edge specs **carry the governance `basis` values Workstream A ratified in §II.a** (`agent → delegated_authority`, `location → authorization`) — this is A's machinery proving itself in C.

**Tech Stack:** Jekyll static site, hand-authored HTML. Verification is grep assertions + `make build` + `make audit`. Match the schema-reference HTML conventions exactly: `<h3><span class="n-kind">node|edge</span> name <span class="sbadge proposed">proposed v6</span></h3>`, `.prop`/`.prop-row`/`.p-name`/`.p-type`/`.p-req`/`.p-mean` tables, `.edge-spec` lines, `.sbadge`, `.inline-mono`, `.scope`.

## Rulings baked in (decisions made; Chairman can override)

- **R-LOC — location duality → COEXIST (option b).** `org_unit(unit_type=location)` stays an org/cost grouping; the new first-class `location` node is the physical/legal place (jurisdiction, data-residency, badge-zone, deterministic key). They answer different questions (reporting structure vs compliance geography). An explicit "how these differ" note ships in §VIII. *Alternatives:* (a) deprecate `unit_type=location` and migrate — heavier; (c) don't first-class location, just enrich the org_unit subtype — lowest churn but doesn't honor the ratified "first-class location."
- **R-DEV — device → DEFERRED.** The Chairman's ratified "go big" named *agent + location*; Pillar's argument holds (deterministic key, high-cardinality, false-merge = security incident). Device's `authorization` basis is already pre-specced in §II.a (Workstream A); C adds a one-line note that the device *node type* is deferred so the §II.a row isn't orphaned. *The committed spec §7 lists device under C — this deferral is the override; flag to Chairman.*
- **R-BADGE — `proposed v6`, not `ratified v6`, for the node shapes.** Mirrors Cairn's `proposed v5` (specced, no fixtures/production). v6 reads as: **governance basis = ratified (shipped in A); entity types = proposed.** The §X resolution says "decision ratified, shape proposed v6" — not "agents are live in the graph."

## A-coherence obligations (Workstream A is shipped — C must not contradict it)

1. **No "consent" for agents.** Both §X (substrate) and the schema-ref plum aside currently say the agent shares person's "identity/consent layers." A established the agent's basis is **delegated_authority**. Every resolution must say *identity + the governance-basis plane, species delegated_authority* — never "consent."
2. **Basis values match §II.a exactly:** `agent → delegated_authority`, `location → authorization`. The new edge specs carry precisely these (verify against the shipped §II.a table at schema-ref `id="basis"`).
3. **Device note keeps §II.a honest:** §II.a's `authorization` row names `device`; the deferral note explains the node is pending so the table isn't an orphan.

---

## Task 1: Schema reference — resolve the open-question aside + add §VIII (agent, location)

**Files:** Modify `engineering/people-graph-schema-reference.html` (plum aside ~line 1198; insert §VIII after it ~line 1210; TOC ~line 772)

- [ ] **Step 1: Verification (must fail now)**

```bash
grep -c 'id="entities"' engineering/people-graph-schema-reference.html        # expect 0
grep -c 'n-kind">node</span> agent' engineering/people-graph-schema-reference.html  # expect 0
grep -c 'identity/consent layers' engineering/people-graph-schema-reference.html    # expect 1 (the stale aside)
```

- [ ] **Step 2: Resolve the plum "open question" aside (~lines 1198–1209)**

Replace the entire existing aside block:
```html
    <div class="aside plum">
      <p class="aside-h">Open question — does an agent get a node?</p>
      <p>Several Cairn FKs (<span class="inline-mono">attestor_id</span>, <span class="inline-mono">attested_by</span>)
      are typed <span class="inline-mono">fk(person.id)</span>, which collapses the AI-agent
      and human attestor cases. Whether agents become a sibling node type that shares
      the identity/consent layers with <span class="inline-mono">person</span> but
      diverges on the time layer is the question Post 05 §X opens. It carries an
      <span class="sbadge openq">open question</span> badge and is escalated to the
      Chairman; until it resolves, treat <span class="inline-mono">attestor_id</span> as
      person-or-agent, not person-only.</p>
    </div>
```
with (resolution — note `openq`→`ratified`, and "identity/consent" → "identity + governance-basis plane, delegated_authority"):
```html
    <div class="aside plum">
      <p class="aside-h">Resolved — an agent gets a node <span class="sbadge ratified">decision ratified v6</span></p>
      <p>The question Post 05 §X opened is resolved: <span class="inline-mono">agent</span> is a
      first-class sibling node type (§VIII, <span class="sbadge proposed">proposed v6</span>). It
      shares <span class="inline-mono">person</span>&apos;s identity layer and the governance-basis
      plane (§II.a) but its species is <span class="inline-mono">delegated_authority</span>, not
      consent — an agent operates under authority the company extends, it does not consent — and it
      diverges on the time layer: an agent&apos;s lifetime is its policy version, not a tenure. The
      Cairn FKs (<span class="inline-mono">attestor_id</span>, <span class="inline-mono">attested_by</span>)
      that collapsed the AI-agent and human cases are now correctly typed person-or-agent.</p>
    </div>
```

- [ ] **Step 3: Insert §VIII immediately after that aside, before the section/footer that follows**

After the closing `</div>` of the plum aside (and before whatever closes §VII / opens the page footer — confirm by reading ~lines 1210–1220 first), insert:
```html

    <!-- ── VIII ── -->
    <h2 id="entities"><span class="ord">§ VIII — Generalized entities</span>The substrate beyond people. <span class="sbadge proposed" style="vertical-align:middle">proposed v6</span></h2>
    <p>
      The substrate was always more than people (§10 of WP-01 names eight node types). v6
      generalises it explicitly for the entities an agent contextualises about (Post 05 §X):
      two new first-class node types, <span class="inline-mono">agent</span> and
      <span class="inline-mono">location</span>, each taking its governance species from §II.a —
      <span class="inline-mono">agent</span> is <span class="inline-mono">delegated_authority</span>,
      <span class="inline-mono">location</span> is <span class="inline-mono">authorization</span>. These
      shapes are <span class="sbadge proposed">proposed</span>: specced here, fixtures and production
      instances to follow (as <span class="inline-mono">cairn_stone</span> was at proposed v5).
    </p>

    <h3><span class="n-kind">node</span> agent <span class="sbadge proposed">proposed v6</span></h3>
    <p>An actor, not a data subject. It takes recorded, auditable actions and appears in audit logs as a counterparty; it operates under <span class="inline-mono">delegated_authority</span> (§II.a) the company extends, and can be revised mid-action by bumping its policy version — which no person can. This is the resolution of the §X open question.</p>
    <div class="prop">
      <div class="prop-row prop-head"><div>property</div><div>type</div><div>req</div><div>meaning</div></div>
      <div class="prop-row"><div class="p-name">id</div><div class="p-type">ulid</div><div class="p-req">req</div><div class="p-mean">Unique node identifier; stable, never reused.</div></div>
      <div class="prop-row"><div class="p-name">kind</div><div class="p-type">enum</div><div class="p-req">req</div><div class="p-mean"><span class="inline-mono">console</span> | <span class="inline-mono">recruiter</span> | <span class="inline-mono">tenure</span> | <span class="inline-mono">cairn</span> | <span class="inline-mono">customer</span> — the agent&apos;s class. <span class="inline-mono">customer</span> = an agent owned by a customer that interacts with ours.</div></div>
      <div class="prop-row"><div class="p-name">policy_version</div><div class="p-type">str</div><div class="p-req">req</div><div class="p-mean">The governing policy version, e.g. <span class="inline-mono">"console-014-T"</span>. The agent&apos;s lifetime is this version, not a tenure (§X).</div></div>
      <div class="prop-row"><div class="p-name">operator</div><div class="p-type">fk</div><div class="p-req">req</div><div class="p-mean">FK → <span class="inline-mono">org_unit.id</span>; the org/tenant under whose delegated authority the agent operates.</div></div>
      <div class="prop-row"><div class="p-name">created_at</div><div class="p-type">ts</div><div class="p-req">req</div><div class="p-mean">ISO 8601 UTC; when the agent node was first written.</div></div>
    </div>

    <h3><span class="n-kind">node</span> location <span class="sbadge proposed">proposed v6</span></h3>
    <p>The physical/legal place. <strong>Distinct from <span class="inline-mono">org_unit(unit_type=location)</span></strong>: that is an org/cost grouping people report into; this <span class="inline-mono">location</span> node is the place itself, carrying the jurisdiction, data-residency, and badge-zone facts that live on the location and nowhere else. A person may be <span class="inline-mono">employed_by</span> an org_unit-location <em>and</em> <span class="inline-mono">located_at</span> a location node — they answer different questions (reporting vs compliance geography). Resolved on its deterministic key, <strong>never</strong> via the probabilistic matcher — a false location merge is a compliance error, not a data-quality nudge.</p>
    <div class="prop">
      <div class="prop-row prop-head"><div>property</div><div>type</div><div>req</div><div>meaning</div></div>
      <div class="prop-row"><div class="p-name">id</div><div class="p-type">ulid</div><div class="p-req">req</div><div class="p-mean">Unique node identifier.</div></div>
      <div class="prop-row"><div class="p-name">code</div><div class="p-type">str</div><div class="p-req">req</div><div class="p-mean">Deterministic canonical key (campus/building code), e.g. <span class="inline-mono">"NYC-01"</span>. Resolution is by exact key, not τ-scored match.</div></div>
      <div class="prop-row"><div class="p-name">name</div><div class="p-type">str</div><div class="p-req">req</div><div class="p-mean">Display name, e.g. <span class="inline-mono">"New York · 200 Park"</span>.</div></div>
      <div class="prop-row"><div class="p-name">jurisdiction</div><div class="p-type">str</div><div class="p-req">req</div><div class="p-mean">Legal jurisdiction, e.g. <span class="inline-mono">"US-NY"</span>, <span class="inline-mono">"DE"</span>. Drives which laws govern records sited here.</div></div>
      <div class="prop-row"><div class="p-name">data_residency</div><div class="p-type">str</div><div class="p-req">req</div><div class="p-mean">Data-residency zone, e.g. <span class="inline-mono">"eu"</span>, <span class="inline-mono">"us"</span>.</div></div>
      <div class="prop-row"><div class="p-name">badge_zone</div><div class="p-type">str</div><div class="p-req opt">opt</div><div class="p-mean">Physical-access zone identifier, where badge data is connected.</div></div>
      <div class="prop-row"><div class="p-name">created_at</div><div class="p-type">ts</div><div class="p-req">req</div><div class="p-mean">ISO 8601 UTC.</div></div>
    </div>

    <h3><span class="n-kind">edges</span> operates_under · located_at <span class="sbadge proposed">proposed v6</span></h3>
    <div class="edge-spec"><span class="k">agent</span> <span class="ar">→</span> <span class="k">org_unit</span> · <b>operates_under</b> · the delegated-authority grant the agent acts within · basis: <span class="inline-mono">delegated_authority</span> · governance_scopes: <span class="scope">["governance.agent_policy"]</span></div>
    <div class="edge-spec"><span class="k">person</span> <span class="ar">→</span> <span class="k">location</span> · <b>located_at</b> · the envelope&apos;s valid interval carries the period based there · basis: <span class="inline-mono">authorization</span> · governance_scopes: <span class="scope">["facilities.location"]</span></div>
    <p>None carry fields beyond the universal envelope. Note the <span class="inline-mono">basis</span> values: these are the first edges to use §II.a&apos;s non-consent species in a spec.</p>

    <div class="aside">
      <p class="aside-h">Deferred — the device node</p>
      <p>§II.a names <span class="inline-mono">device</span> under the <span class="inline-mono">authorization</span> basis, but the device <em>node type</em> is deferred from v6. Devices carry deterministic keys (serial / asset tag) and are high-cardinality; a false device merge is a security incident, not a data-quality nudge. First-classing waits on a product driver and a registry-join evaluation. Until then, device context is a query-time join, not a graph node — and §II.a&apos;s <span class="inline-mono">authorization</span> row is instantiated by <span class="inline-mono">location</span>, with <span class="inline-mono">device</span> pending.</p>
    </div>
```
*(Before inserting, read ~lines 1210–1225 to confirm what element follows the aside — if §VII closes with a wrapper `</div></section>` or the page footer begins, insert §VIII before that boundary so it sits as a top-level page section like §§III–VII. If the structure differs, place §VIII as a sibling `<h2>` section and note the placement.)*

- [ ] **Step 4: Add §VIII to the TOC (~line 772, after the `#cairn` entry)**

After `<li><a href="#cairn">Cairn module</a></li>` insert:
```html
    <li><a href="#entities">§ VIII — Generalized entities</a></li>
```

- [ ] **Step 5: Verify (must pass now)**

```bash
grep -c 'id="entities"' engineering/people-graph-schema-reference.html              # expect 1
grep -c 'n-kind">node</span> agent' engineering/people-graph-schema-reference.html    # expect 1
grep -c 'n-kind">node</span> location' engineering/people-graph-schema-reference.html # expect 1
grep -c 'identity/consent layers' engineering/people-graph-schema-reference.html      # expect 0 (stale wording gone)
grep -c 'delegated_authority' engineering/people-graph-schema-reference.html          # expect >= 4 (aside + intro + agent node prose + edge spec)
grep -c 'href="#entities"' engineering/people-graph-schema-reference.html             # expect 1 (the TOC <li> link; id="entities" is a separate attribute, counted above)
```
Expected: `1`, `1`, `1`, `0`, `>=4`, `1`.

- [ ] **Step 6: Build**

```bash
make build
grep -c 'id="entities"' _site/engineering/people-graph-schema-reference.html   # expect 1
```
Expected: clean build; §VIII renders.

- [ ] **Step 7: Commit**

```bash
git add engineering/people-graph-schema-reference.html
git commit -m "Schema-ref · §VIII generalized entities (agent, location, proposed v6) + resolve agent-node open question

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Schema reference — formalize org_unit recursion

**Files:** Modify `engineering/people-graph-schema-reference.html` (org_unit node ~lines 957–975)

- [ ] **Step 1: Verification (must fail now)**

```bash
grep -c 'business_unit' engineering/people-graph-schema-reference.html   # expect 0
```

- [ ] **Step 2: Extend the `unit_type` enum (~line 971)**

The recursion already exists (`parent_id` self-FK + `unit_type`). Formalize the hierarchy levels. Replace the `unit_type` row:
```html
      <div class="prop-row"><div class="p-name">unit_type</div><div class="p-type">enum</div><div class="p-req">req</div><div class="p-mean"><span class="inline-mono">department</span> | <span class="inline-mono">team</span> | <span class="inline-mono">division</span> | <span class="inline-mono">cost_center</span> | <span class="inline-mono">location</span>.</div></div>
```
with:
```html
      <div class="prop-row"><div class="p-name">unit_type</div><div class="p-type">enum</div><div class="p-req">req</div><div class="p-mean"><span class="inline-mono">organization</span> | <span class="inline-mono">business_unit</span> | <span class="inline-mono">division</span> | <span class="inline-mono">department</span> | <span class="inline-mono">team</span> | <span class="inline-mono">cost_center</span> | <span class="inline-mono">location</span>. Ordered roughly outermost→innermost; the recursion below carries the levels.</div></div>
```

- [ ] **Step 3: Add a recursion-formalization note after the org_unit prop table (after the `</div>` closing the org_unit `.prop`, ~line 975)**

```html
    <p>
      <strong>Recursion (formalised v6):</strong> <span class="inline-mono">parent_id</span> is a
      self-FK, so the team/department/division/business-unit/organization hierarchy is one recursive
      structure, not five node types — the &ldquo;contextualise about a team / a department / a
      business unit / the whole org&rdquo; cases (Post 05 §X) are all <span class="inline-mono">org_unit</span>
      traversals at a <span class="inline-mono">unit_type</span> level. The root unit
      (<span class="inline-mono">unit_type = organization</span>, <span class="inline-mono">parent_id =
      null</span>) is the organisation itself. <span class="inline-mono">unit_type = location</span>
      remains an org/cost grouping and is distinct from the first-class <span class="inline-mono">location</span>
      node (§VIII).
    </p>
```

- [ ] **Step 4: Verify**

```bash
grep -c 'business_unit' engineering/people-graph-schema-reference.html         # expect 1 (enum)
grep -c 'Recursion (formalised v6)' engineering/people-graph-schema-reference.html  # expect 1
```
Expected: `1`, `1`.

- [ ] **Step 5: Build + commit**

```bash
make build
git add engineering/people-graph-schema-reference.html
git commit -m "Schema-ref · formalise org_unit recursion (team→org levels, v6)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Whitepaper — v6 version-history row + module-taxonomy row

**Files:** Modify `engineering/people-graph-whitepaper.html` (version-history `.std-table` ~lines 1758–1762; module taxonomy `.tax-table` ~lines 1818–1834)

- [ ] **Step 1: Verification (must fail now)**

```bash
grep -c 'std-name">v6' engineering/people-graph-whitepaper.html   # expect 0
```

- [ ] **Step 2: Add the v6 version-history row (after the v5 `.std-row`, ~line 1762)**

After the closing `</div>` of the v5 row (the one whose note ends "not yet generally available."), insert:
```html
      <div class="std-row">
        <div class="std-name">v6<span class="std-ref">governance basis + generalized entities</span></div>
        <div class="std-stance adopt">Ratified (basis) · Proposed (entities)</div>
        <div class="std-note">Two parts. <strong>Governance basis — ratified, shipped:</strong> the consent plane re-grounded as a three-species basis (<span class="inline-mono">consent</span> / <span class="inline-mono">authorization</span> / <span class="inline-mono">delegated_authority</span>), §II.a of the companion reference. <strong>Generalized entities — proposed:</strong> the <span class="inline-mono">agent</span> and <span class="inline-mono">location</span> node types and the <span class="inline-mono">operates_under</span> / <span class="inline-mono">located_at</span> edges (companion §VIII), plus the formalised <span class="inline-mono">org_unit</span> recursion. The agent node resolves the Post 05 §X open question. Specced; fixtures and production instances to follow.</div>
      </div>
```

- [ ] **Step 3: Add a module-taxonomy row (after the Cairn `.tax-row`, before the Ember row)**

Read the taxonomy table (~lines 1810–1834) to find the Cairn row and the Ember row. Insert a new `.tax-row` after Cairn and before Ember:
```html
      <div class="tax-row">
        <div class="tax-mod">Substrate<span style="display:block;font-weight:400;color:var(--ink-mute);font-size:10px">generalized entities</span></div>
        <div class="tax-types"><span class="inline-mono">agent</span>, <span class="inline-mono">location</span> nodes; <span class="inline-mono">operates_under</span>, <span class="inline-mono">located_at</span> edges; <span class="inline-mono">org_unit</span> recursion formalised</div>
        <div class="tax-ver"><span class="sbadge proposed">proposed v6</span></div>
      </div>
```
*(Match the exact `.tax-row`/`.tax-mod`/`.tax-types`/`.tax-ver` structure of the sibling rows; the `var(--ink-mute)` sub-label inline style mirrors the other rows' module sub-labels — that is the existing pattern, not a new style.)*

- [ ] **Step 4: Verify**

```bash
grep -c 'std-name">v6' engineering/people-graph-whitepaper.html              # expect 1
grep -c 'tax-mod">Substrate' engineering/people-graph-whitepaper.html         # expect 1
grep -c 'operates_under' engineering/people-graph-whitepaper.html             # expect 2 (version note + taxonomy row)
```
Expected: `1`, `1`, `2`.

- [ ] **Step 5: Build + commit**

```bash
make build
git add engineering/people-graph-whitepaper.html
git commit -m "WP-01 §10 · v6 version-history + taxonomy rows (governance basis + generalized entities)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Substrate §X — resolve "does an agent get a node?"

**Files:** Modify `engineering/people-graph-substrate.html` (§X — heading at `§ X`, the closing section)

- [ ] **Step 1: Read §X**

```bash
grep -n 'Does an agent get a node\|§ X' engineering/people-graph-substrate.html
```
Read the section so the resolution matches its first-person (Forge) voice. §X ends with the "as of week 88" paragraph and the call-for-correspondence.

- [ ] **Step 2: Append a resolution paragraph**

At the END of §X's body — after the existing "as of week 88" / closing paragraph and before the page footer/correspondence block (read to find the exact boundary) — insert:
```html
    <p>
      <strong>Resolved, since.</strong> The decomposition held. An agent gets a node — a first-class
      sibling of <span class="inline-mono">person</span> (companion reference §VIII,
      <span class="sbadge proposed">proposed v6</span>). I guessed in this post that it would share
      person&apos;s &ldquo;identity and consent layers&rdquo;; that was half right, and the half I got
      wrong is the interesting half. It shares the identity layer and the governance-basis plane — but
      its species is <span class="inline-mono">delegated_authority</span>, not consent. An agent does
      not consent; it operates under authority the company extends, and that distinction is exactly why
      we re-grounded the consent plane as a governance basis (§VI) before we let the agent node land. It
      diverges on the time layer as predicted: its lifetime is its policy version, not a tenure. The
      device case I gestured at stays deferred — deterministic keys, security-grade merge stakes — and
      <span class="inline-mono">location</span> turned out to deserve its own node, distinct from the
      org-unit grouping that shares its name. The open question is closed; the shape it closed into is
      the one the four-layer model was built to admit.
    </p>
```

- [ ] **Step 3: Verify**

```bash
grep -c 'Resolved, since' engineering/people-graph-substrate.html         # expect 1
grep -c 'delegated_authority' engineering/people-graph-substrate.html      # expect >= 1
```
Expected: `1`, `>=1`.

- [ ] **Step 4: Build + commit**

```bash
make build
git add engineering/people-graph-substrate.html
git commit -m "Substrate §X · resolve the agent-node open question (delegated_authority, proposed v6)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Coherence sweep + build + homepage landing

**Files:** Verify the three artifacts; Modify `index.html` (both `.ticker-strip` blocks)

- [ ] **Step 1: A-coherence sweep (the obligations)**

```bash
# Obligation 1 — no "consent" framing left for the agent in either resolution:
grep -rin 'identity/consent\|identity and consent' engineering/people-graph-schema-reference.html engineering/people-graph-substrate.html
#   expect: ZERO hits (the substrate §X quote "identity and consent layers" is inside the resolution that explicitly corrects it — confirm by eye it is the corrective sentence, not an uncorrected claim)
# Obligation 2 — basis values present and correct in §VIII:
grep -c 'basis: <span class="inline-mono">delegated_authority' engineering/people-graph-schema-reference.html  # expect 1 (operates_under edge)
grep -c 'basis: <span class="inline-mono">authorization' engineering/people-graph-schema-reference.html        # expect 1 (located_at edge)
# Obligation 3 — device deferral note present:
grep -c 'Deferred — the device node' engineering/people-graph-schema-reference.html    # expect 1
# Version coherence — v6 in all three:
grep -lc 'v6\|proposed v6' engineering/people-graph-schema-reference.html engineering/people-graph-whitepaper.html engineering/people-graph-substrate.html
```
Resolve any miss before continuing. Note: the §X resolution intentionally quotes the words "identity and consent layers" to correct them — that single quoted occurrence is acceptable; what must NOT survive is any *uncorrected* claim that the agent's basis is consent.

- [ ] **Step 2: Clean build + audit**

```bash
make build
make audit
```
Expected: clean build; no NEW CSS leaks (§VIII reuses `prop`/`prop-row`/`edge-spec`/`aside`/`sbadge`; taxonomy/version rows reuse `tax-*`/`std-*`).

- [ ] **Step 3: Homepage ticker (both strips)**

Per the homepage-freshness convention, this is a major Stratum update. Read an existing `.t-item` in each strip and match its structure. Add to BOTH `.ticker-strip` blocks:

> v6 entity model (proposed) — the agent-node open question is resolved: an agent gets a node, sharing identity + the governance-basis plane (delegated_authority, not consent). location first-classed; org_unit recursion formalized; device deferred.

Match the existing `.t-item`/`.t-date` stamp convention used by the most recent neighboring item.

- [ ] **Step 4: Verify ticker + commit**

```bash
grep -c 'v6 entity model' index.html    # expect 2 (one per strip)
git add index.html
git commit -m "Homepage ticker · v6 entity model (proposed) — agent gets a node (§X resolved)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Definition of done

- Schema reference: §VIII ships `agent` + `location` node specs and the `operates_under`/`located_at` edges (proposed v6), the edges carrying §II.a basis values (`delegated_authority` / `authorization`); the open-question aside is resolved (no "identity/consent layers"); org_unit recursion formalized (enum + note); device deferral noted; §VIII in TOC.
- Whitepaper: v6 version-history row (basis ratified / entities proposed) + a generalized-entities taxonomy row.
- Substrate §X: resolved, in voice, with the consent→delegated_authority correction explicit.
- `make build` clean; `make audit` no new leaks; `index.html` ticker carries the v6 entity-model item in both strips.
- A-coherence: agent basis is delegated_authority everywhere; §II.a's authorization row instantiated by location, device noted as pending.

## Out of scope (deferred follow-ups, flagged)

- **Fixtures / generator / playground engine** for agent/location (the engine knows only person/candidate/requisition; Cairn's proposed-v5-without-fixtures is the precedent). A separate sub-workstream if/when these become queryable.
- **device node type** (R-DEV) — deferred to a registry-join evaluation + product driver.
- **Workstream B** (the `context()` interface) and the new-entity contextualization lenses.
- The next Briefing's prose entry (Helm, briefing cycle).
