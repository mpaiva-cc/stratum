# People-graph query playground — design spec

**Date:** 2026-06-11 (T+91d era)
**Status:** approved design, pre-implementation
**Authors:** Forge (architecture) · Pillar (data/seed queries) · Tessera (visual/interaction) — orchestrated
**Supports:** WP-01 (`engineering/people-graph-whitepaper.html`) and the schema reference

---

## 1. Purpose

An interactive, Postman-style query playground that lets a reader **enter a query and see the graph data it returns**, supporting the people-graph white-paper. It turns the static worked examples into something a visitor can run and edit themselves, over the real served fixtures.

It is a **prototype** in the product-narrative sense (a believable, working demo), not a production graph console.

## 2. Hard constraints

- **Static site.** The whole site is GitHub Pages served under `baseurl: /stratum`. There is no backend and no graph database. Everything runs **client-side in the browser**.
- **Real data only.** Queries execute over the already-served fixtures in `console/data/`. No invented outputs — same honesty discipline as the rest of the people-graph docs.
- **Baseurl discipline.** Any internal `href`/`src` in the page goes through `{{ '/path' | relative_url }}` (blocking CI guard `script/check-baseurl-links.sh`). JS fetches resolve via an injected base (see §5).
- **WCAG 2.2 AAA (O-1).** All UI, especially the dark console surfaces, clears AAA. Tessera owns this.
- **No `!important`** (project rule). Reuse existing tokens.

## 3. Locked decisions (from brainstorming)

1. **Query model: guided editor.** A query editor pre-seeded with real example queries, fully editable, executed by a constrained in-browser Cypher-subset interpreter. Unsupported syntax returns a friendly, specific error — never a crash.
2. **Results: code + data response (Postman-faithful).** The response area echoes the Cypher that ran and renders the returned rows as a data table. **No node-link graph visualization in v1.**
3. **Visual/interaction design owned by Tessera** (the Chairman trusts Tessera's design decisions). This spec defines structure and behavior, not pixels.

## 4. Architecture

Three layers, all client-side:

### 4.1 Data layer
On page load, fetch the served fixtures and build in-memory indexes (mirrors the Console's existing `loadData` + `reqIdByCandidate` pattern — reuse it, don't reinvent):

| Source | Node/edge it backs |
|---|---|
| `console/data/people.json` | `person` nodes; `reports_to` edges derived from `manager_id` |
| `console/data/requisitions.json` | `requisition` nodes |
| `console/data/candidates.json` | `candidate` nodes |
| `console/data/applied_for.json` | `applied_for` edges (real bitemporal edge fixture) |
| `console/data/orgs.json` | reference only in v1 (not queried) |

Indexes: `byId` per node type; `reportsTo` adjacency (person → manager person, from `manager_id`); `appliedFor` adjacency (candidate → requisition, from edge `from`/`to`). Total payload ≈ 6 MB; load behind a visible loading state.

### 4.2 Query engine (`people-graph-playground.js`)
A small, self-contained interpreter for a **defined Cypher subset** (§6). Pipeline: `parseQuery(text) → AST | QueryError`, then `runQuery(AST, data) → {columns, rows} | QueryError`. Pure functions, no DOM — independently unit-testable, importable in Node for tests and in the browser for the page.

### 4.3 Honesty layer
The flat fixtures are **valid-time projections** — they do not contain identity-as-edge resolution, bitemporal `tx_` history, or consent-gated traversal (the one real graph-edge fixture is `applied_for.json`). Therefore:
- **Every seeded, runnable query executes over real data and returns real rows.** The seed set is the verified use-cases (§7).
- The deep-graph layers (identity, bitemporal as-of, consent) are **not executable here**; the page says so plainly and points to the white-paper. Up to two "concept" seed queries may be tagged `runnable: false` and, if executed, return an explanatory message instead of fabricated data.
- The engine never invents rows. A query that parses but matches nothing returns an empty result with a "0 rows" notice.

## 5. Components & interfaces

### 5.1 Page — `engineering/people-graph-playground.html`
- Named **playground** to avoid colliding with the product **Console** (`/console/`) and the existing `/graph/` visualization.
- Legacy-layout standalone page; includes site-nav + footer; injects the baseurl for JS:
  `<script>window.STRATUM_BASE = "{{ '/' | relative_url }}";</script>`
- Layout (Tessera designs): a seed-query list/selector, an editable query editor (textarea or lightweight code field), a **Run** control, and a response panel with two regions — **code** (the executed Cypher) and **data** (the result table). Dark console aesthetic, reusing the `.gq-*` token system.
- Loading + error states.

### 5.2 Engine — `engineering/people-graph-playground.js` (co-located)
Exports (and guards for Node import):
- `loadFixtures(base) → Promise<Data>` — fetch + index; `base` from `window.STRATUM_BASE`.
- `parseQuery(text) → AST` — throws `QueryError(message)` on unsupported/invalid input.
- `runQuery(AST, data) → {columns: string[], rows: any[][]}` — throws `QueryError` on semantic errors (unknown label/edge/prop).
- `SEED_QUERIES → Array<{id, title, note, cypher, runnable}>`.
- `renderResponse(target, result | QueryError, queryText)` — browser-only; the one DOM function.

### 5.3 Data flow
`user picks/edits a query → Run → parseQuery → runQuery(over indexes) → renderResponse(rows + echoed code)`. Parse/semantic errors short-circuit to an inline error render styled like a Postman error response.

## 6. Supported Cypher subset (v1 — this bounds the build)

```
query      := MATCH pattern (WHERE conds)? RETURN projection (ORDER BY orderlist)? (LIMIT int)?
pattern    := nodepat (rel nodepat)?
nodepat    := "(" var (":" label)? ")"
rel        := "-[" (relvar)? (":" edgetype)? "]->"
conds      := cond (AND cond)*
cond       := ref op literal
ref        := var "." prop
op         := "=" | "!=" | ">" | ">=" | "<" | "<=" | "IN"
projection := item ("," item)*
item       := (ref | aggfn "(" (ref | "*") ")") (AS alias)?
aggfn      := count | avg | sum | min | max
orderlist  := (ref | alias) (ASC | DESC)? ("," ...)*
literal    := number | "string" | [list of literals]
```

- **Labels (v1):** `person`, `requisition`, `candidate`. **Edge types (v1):** `applied_for` (real), `reports_to` (derived from `manager_id`).
- **Properties:** any field present on the backing fixture record (e.g. `p.flight_risk`, `r.status`, `r.days_open`, `e.applied_at`, `e.valid_to`).
- **Implicit grouping (Cypher semantics):** when `RETURN` mixes non-aggregate keys with aggregates (e.g. `RETURN p.department, count(*)`), group by the non-aggregate keys.
- **Everything else is unsupported** and returns a specific `QueryError`, e.g.: `Unsupported clause "CALL" — the static demo supports MATCH/WHERE/RETURN/ORDER BY/LIMIT only.` / `Unknown label "foo" — supported: person, requisition, candidate.` / `Unknown edge "knows" — supported: applied_for, reports_to.`

## 7. Seed queries (runnable, outputs verified against current fixtures)

All six execute over the fixtures and return real rows. Expected results were recomputed from the live data on 2026-06-11.

1. **Retention risk** — `MATCH (p:person) WHERE p.department = "Engineering" RETURN p.id, p.display_name, p.flight_risk ORDER BY p.flight_risk DESC LIMIT 8` → top-8 incl. EMP-00962 (1.0), EMP-00964 (1.0), EMP-01622 (0.98)… (Engineering headcount 684.)
2. **Pipeline aging** — `MATCH (r:requisition) WHERE r.status = "open" RETURN r.id, r.title, r.days_open ORDER BY r.days_open DESC LIMIT 5` (125 of 140 open).
3. **Span of control** — `MATCH (p:person)-[:reports_to]->(m:person) WHERE m.id = "EMP-00457" RETURN p.id, p.display_name, p.title` → 9 reports (Anika Aguilar, span_of_control 9).
4. **Comp-ratio outliers** — `MATCH (p:person) WHERE p.department = "Operations" AND p.team = "Business Ops" RETURN p.id, p.display_name, p.comp_ratio ORDER BY p.comp_ratio DESC LIMIT 5` (team headcount 35).
5. **Application history** — `MATCH (c:candidate)-[e:applied_for]->(r:requisition) WHERE c.id = "CAND-00000001" RETURN e.applied_at, e.valid_to, r.id, r.title` → APPFOR-00000001 (closed valid_to 2026-04-24).
6. **Headcount by department** — `MATCH (p:person) RETURN p.department, count(*) AS headcount ORDER BY headcount DESC` (implicit grouping; Engineering 684 leads).

Optional concept (tagged `runnable: false`): an identity-resolution or consent-gated example that, if run, explains it executes only over the full graph, not the projection.

## 8. Error handling

- **Parse errors** (syntax outside the grammar) and **semantic errors** (unknown label/edge/property) both throw `QueryError` with a specific, friendly message naming what's supported.
- Rendered in the response panel as a distinct **error response** (Postman-style), not a browser console error or a crash.
- Empty matches render "0 rows" honestly.
- Fixture load failure renders a clear "could not load the demo data" state.

## 9. Testing

The interpreter is real logic and gets real tests (TDD on parse/execute):

- **Unit — parser:** valid seed queries → expected AST; invalid inputs → the specific `QueryError` messages.
- **Unit — executor against the live fixtures** (read JSON from disk in Node): assert known invariants — Engineering headcount 684, span under EMP-00457 = 9, open reqs 125 of 140, `applied_for` edges 3,756, CAND-00000001 → REQ-00001. These are the same numbers verified during the use-cases work, so the engine is checked against ground truth.
- **Runner:** `node --test` over `engineering/people-graph-playground.test.js`; `people-graph-playground.js` is written to import cleanly in Node (guarded export) and run in the browser.
- **Browser runtime verification:** load the page, run every seed query, confirm the rendered rows match the expected outputs; screenshot. Build/guard/proofer stay green.

## 10. Placement & entry points

- New page at `engineering/people-graph-playground.html`.
- Linked from **WP-01 §10** ("Try it — run these queries yourself") and the schema-reference **"See the live data"** callout. Not added to the primary site nav in v1 (it's a supporting tool for the paper).
- Per the homepage-freshness rule, ship with a ticker line.

## 11. v1 scope / YAGNI

**In:** constrained Cypher-subset interpreter; ~6 seed queries; editable editor; code + data response; friendly errors; dark console (Tessera); unit + browser tests; honesty notes.

**Out (fast-follows if wanted):** node-link graph visualization; save/share/permalink of queries; query history; multi-statement queries; autocomplete; the deep-graph (identity/bitemporal/consent) execution (documented, not run).

## 12. Risks

- **Parser scope creep / fragile failures.** Mitigation: the grammar in §6 is the contract; anything outside it errors clearly. Keep it tight.
- **Payload size (~6 MB) on load.** Mitigation: visible loading state; acceptable for a prototype. (Lazy per-fixture loading is a possible later optimization.)
- **Users expecting full Cypher.** Mitigation: the page frames it as a "supported subset," the seeds teach the grammar, errors name what's supported.
