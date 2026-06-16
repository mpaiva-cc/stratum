# Fork & Flame — HCM System of Understanding (design)

**Date:** 2026-06-16
**Status:** approved for planning
**Location of work:** `data/sample/restaurant-chain/`

## Problem

The `restaurant-chain` Obsidian vault is a worked sample of the Stratum contextual
map — a 20-store, 500-employee casual-dining chain ("Fork & Flame") where every
entity is a Markdown note and every relationship a wiki-link. Today it is
*static*: you can look at it in Obsidian's graph view, but you cannot ask it
anything. We want to turn it into a **system of understanding** — a layer that
answers plain-language HCM questions over the data, **governed**: it enforces the
vault's v6 governance-basis model rather than merely displaying it.

## Goal

A standalone, BYO-key page (`index.html`) co-located in the vault folder. The
user picks a **purpose**, asks a question in English, and gets a grounded answer
plus the deterministic query that produced it, the governance trace (what was
refused and why), and citations to the underlying notes.

Non-goals (v1): time-advancing simulation; agents that mutate the data; a
published site page; analytics dashboards. These can layer on later.

## Core principle: enforcement is deterministic

An LLM cannot be trusted to refuse a query. If "governance is enforced" is to
mean anything, the **engine** must apply the governance predicate in code. The
LLM only (a) translates English into a constrained query and (b) narrates rows it
is handed. It never sees ungated data and never decides governance. This is the
load-bearing decision of the whole design; do not soften it back into prompt
instructions.

## Architecture (4 components, each one job)

1. **Fixture builder** — *inside `_generate.py`*. After the generator builds the
   vault in memory, it emits `forkandflame.graph.json` from that in-memory data
   (no markdown parsing → zero drift). Shape:
   - `nodes`: `[{ "type", "id", "title", "props": {...}, "basis" }]`
   - `edges`: `[{ "src", "verb", "dst" }]` (title-keyed; includes reverse
     adjacency so person→shift is traversable even though the link lives on the
     shift's `crew`)
   - `grants`: consent-grant index keyed by person title →
     `[{ "scope", "status", "valid_to" }]`
   - `meta`: generation date (for expiry checks), purpose→scope table, schema
     edge directory.

2. **Graph engine** (`app.js`, pure JS, no deps) — loads the fixture into
   in-memory maps, executes a constrained **traversal spec**, applies the
   governance predicate, returns `{ rows, trace, citations }`. Fully
   deterministic; unit-testable in Node with no API key.

3. **NL translator + narrator** (the LLM, BYO-key in browser, Ember AI pattern) —
   two plain calls: question → traversal spec (validated against a JSON schema),
   then rows+trace → prose answer. Given an auto-generated edge directory and a
   few validated example queries. Aggregates are NEVER computed by the LLM.

4. **UI** (`index.html`) — purpose selector + question box; renders the answer,
   the spec that ran, the governance trace, and clickable note citations. Key is
   entered in-browser, validated transiently, never written to a served file.

## Governance model

Four purposes, mapped 1:1 to the scope vocabulary already in the vault:

| Purpose      | Required scope        | Consent-gated person edges            |
|--------------|-----------------------|---------------------------------------|
| `scheduling` | `hr.scheduling`       | time-off requests                     |
| `payroll`    | `hr.payroll`          | pay rate, tip distribution            |
| `compliance` | `hr.certifications`   | certifications, training records      |
| `employment` | `hr.employment`       | performance reviews, lifecycle events |

**Directory-level facts are always visible** under any purpose: name, status,
`works_at`, `in_department`, `position`, `reports_to`, `skills`. These are the
org-chart layer. **Authorization-basis** entities (store, shift, schedule,
device, position, tip_pool, region, department, organization) are never
consent-gated. **Agents** carry `delegated_authority` + a `policy_version`.

**Enforcement is default-deny.** To read a consent-gated field/edge for person P
under the active purpose's scope S, P must hold a grant with `scope == S`,
`status == active`, and `valid_to` open or ≥ the fixture's generation date.
Otherwise:
- in `select`: the value is **redacted** and a trace entry is recorded.
- in `filters`: the person is excluded from the candidate set and counted as
  "could not evaluate" in the trace.
Every refusal records a reason: `no-grant` | `revoked` | `expired`.

## Generator changes (in `_generate.py`)

1. **Comprehensive, purpose-aligned consent.** Replace the current
   `random.sample(all_people, 15)` one-random-scope block with a per-person
   baseline across all four scopes, plus a deliberate minority so refusals
   visibly fire on real questions:
   - ~85% of people: all four scopes, `status: active`, `valid_to: open`.
   - a slice that declined `hr.payroll` (no grant for that scope).
   - a slice with one **expired** grant (`valid_to` in the past).
   - a slice with one **revoked** grant (`status: revoked`).
   Grants gain `status` and real `valid_to` dates. Distribution is seeded
   (deterministic). The exact percentages are a planning detail; the invariant
   is: most queries return real data, and each refusal reason is reachable by at
   least one realistic question.

2. **Emit the fixture** `forkandflame.graph.json` at the end of a run, from
   in-memory data.

3. **Whitelist the app files** in the wipe step (which currently deletes
   everything except the generator). Preserve: `_generate.py` (already),
   `index.html`, `app.js`, `CLAUDE.md`. The vault notes, README, `.obsidian/`,
   and the fixture remain generated artifacts (wiped + rebuilt).

## Traversal spec (the constrained query language)

The only thing the LLM emits. Constrained JSON, validated before execution:

```json
{
  "from": "person",
  "filters": [
    {"field": "works_at", "op": "eq", "value": "Store 11 - Chicago Loop"},
    {"field": "position", "op": "eq", "value": "Bartender"}
  ],
  "traverse": [
    {"edge": "certifications", "as": "cert",
     "filters": [{"field": "title", "op": "eq", "value": "TIPS Alcohol Service"}]}
  ],
  "select": ["title", "position", "pay_rate"],
  "aggregate": {"op": "avg", "field": "pay_rate", "groupBy": "in_department"}
}
```

- `from`: anchor node type.
- `filters`: predicates on node props / direct edges. Ops: `eq`, `neq`, `in`,
  `contains`, `gt`, `lt`, `exists`.
- `traverse`: follow a named edge (forward or reverse) to related nodes, with
  optional nested filters.
- `select`: fields/edge-fields to return. Touching a consent-gated field triggers
  the governance check.
- `aggregate` (optional): `count` | `avg` | `sum` | `min` | `max`, with optional
  `groupBy`. Computed in the engine.

Engine resolution order: `from` → `filters` → `traverse` → governance check →
project / aggregate → `{rows, trace, citations}`.

## Query flow

1. User selects purpose, types a question.
2. LLM call #1: (system prompt = schema + edge directory + few-shot examples +
   active purpose) + question → traversal spec.
3. Validate spec against JSON schema; reject + retry once on malformed output.
4. Engine executes spec, enforcing governance → `{rows, trace, citations}`.
5. LLM call #2: rows + trace → plain-English answer.
6. UI renders answer + spec + governance trace + citations.

## Starter / example questions (validated against the fixture during impl)

Used both as few-shot examples and as a clickable starter menu. Each must be
traced against the real fixture before shipping (not promised blind):

- "How many people work in the Kitchen department?" (count, groupBy)
- "Who are the bartenders at Store 11?" (filter; directory-level, no refusals)
- "What's the average server pay in the West Region?" (payroll-gated → refusals
  fire for opted-out/expired/revoked staff)
- "Whose certifications are expired or expiring?" (compliance-gated)
- "Who has a pending time-off request next month?" (scheduling-gated)

The multi-hop "who can bartend at Store 11 on Friday?" is a stretch goal:
position = Bartender + TIPS cert + a Friday shift at that store. Ship only if
traced as resolvable; otherwise keep as a documented example of spec expressivity.

## Verification

- **Engine unit tests (Node, no API key):** spec execution for each op;
  aggregates (count/avg/sum/min/max + groupBy) against hand-computed expected
  values from the seeded fixture; reverse-edge traversal (person→shift).
- **Governance tests (the core feature):** assert default-deny — a payroll
  `select` over people including an opted-out, an expired, and a revoked person
  redacts exactly those three and the trace names `no-grant` / `expired` /
  `revoked` respectively. Flip a grant and assert the redaction changes. This is
  the "watch it fail" gate: the refusal must be observable, not asserted.
- **LLM grounding (manual + scripted):** narrated numbers must equal engine rows
  (no invented figures); spot-check that aggregates never originate in the model.
- **BYO-key:** validate the key transiently in-browser; never write the real key
  to a served file (repo Ember AI rule).

## Risks / open questions for the plan

- **Spec coverage vs. question variety.** A constrained spec can't express every
  English question. Mitigation: the few-shot set teaches the common shapes; the
  translator returns a clear "I can't express that as a query" rather than
  guessing. Track which real questions fall outside the spec and widen
  deliberately.
- **Edge-directory accuracy.** The directory must be generated from the fixture,
  not hand-written, or the LLM will emit edges that don't exist.
- **Reverse edges.** person→shift, store→roster, position→holders must be
  materialized in the fixture's adjacency or the engine must index both
  directions at load.
