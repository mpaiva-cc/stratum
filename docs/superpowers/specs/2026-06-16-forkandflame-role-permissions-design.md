# Fork & Flame — Role-Based Permission Layer (design)

**Date:** 2026-06-16
**Status:** approved for planning
**Builds on:** `2026-06-16-forkandflame-understanding-design.md` (the consent/purpose query layer)
**Location of work:** `data/sample/restaurant-chain/`

## Problem

The query app enforces **consent/purpose** governance (did the data subject grant
this scope, for this use). That answers "for what purpose," not "who is asking."
Real HCM access also depends on the viewer's **organizational authority**: a CHRO,
an HRBP, a line manager, an individual contributor, and a peer should each see
different things. We want to impersonate a role and have the system both **enforce**
and **display** what that role may see.

## Goal

Add a second, orthogonal, deterministically-enforced access axis — **role** — and a
UI that lets you impersonate a role and shows its permission level on selection.
Role and consent are **AND-combined**: a value is visible only if the consent-gate
allows it AND the role-gate allows it.

Non-goals (v1): editing roles in the UI; multi-role/delegation; per-field overrides
beyond the class level; population filtering of non-person org nodes (stores/shifts).

## Core principle (unchanged)

Enforcement is deterministic and lives in the engine, never the LLM. The role-gate
is a second predicate beside the consent-gate; the LLM still only translates and
narrates.

## The two axes

| Axis | Question | Basis | Source of truth |
|---|---|---|---|
| **Purpose** (existing) | "for what use?" | consent | data subject's `consent_grant` |
| **Role** (new) | "who is asking, over whom?" | authority | the viewer's role persona |

A gated field is visible iff **both** gates pass. Refusal trace entries carry a
`layer` (`consent` | `access`) so the UI explains which axis blocked, and why.

## Field classes

Reuse the existing scope vocabulary plus `directory`:

| Class | Backed by | Example fields |
|---|---|---|
| `directory` | ungated person props | name, status, position, works_at, in_department, reports_to, skills, email, hire_date |
| `scheduling` | scope `hr.scheduling` | time_off_request |
| `compensation` | scope `hr.payroll` | pay_rate, pay_unit, tip distribution |
| `compliance` | scope `hr.certifications` | certification, training_record |
| `employment` | scope `hr.employment` | performance_review, employment_event |

A role's authority is expressed as the **set of scopes** it may read (subset of the
four), plus directory (always allowed for a visible person). Scope→class is identity
(`hr.payroll`↔compensation, etc.), so the role-gate and consent-gate share one
vocabulary.

## Role personas (v1, illustrative anchors from real data)

Defined in a new `ff-roles.js` (dual-mode). Each: `{ id, label, anchor, anchorDesc,
population, scopes }`.

| Role | `population` rule | `scopes` (besides directory) |
|---|---|---|
| `chro` | `all` | scheduling, payroll, certifications, employment |
| `hrbp` | `region:West Region` | scheduling, payroll, certifications, employment |
| `manager` | `subtree:EMP-0001 Mateo Thomas` | scheduling, certifications, employment (**no payroll**) |
| `ic` | `self:EMP-0002 Samir Abara` | scheduling, payroll, certifications, employment (full on self) |
| `peer` | `store:Store 01 - Austin Domain` | (none — **directory only**) |

Anchors are concrete but configurable constants. `manager`/`ic`/`peer` anchors are
all in Store 01 so the personas are comparable. (Anchors must be validated against
the fixture during implementation; if Store 01's structure differs, pick equivalents.)

## Population computation (in `ff-engine.js`, from real edges)

`computePopulation(role, db)` returns a `Set` of person titles, or a sentinel `ALL`:
- `all` → `ALL` (no row restriction).
- `region:R` → person titles whose `works_at` store has `props.region === R`
  (person → works_at → store; the region→store edge lives on the store side).
- `subtree:E` → transitive closure of reverse `reports_to` from `E`, plus `E`.
- `self:E` → `{E}`.
- `store:S` → reverse `works_at` of `S`.

## Role-gate (deterministic, in the engine)

Two sub-gates, applied wherever person data is materialized:

1. **Population (row-level).** A person node — and a gated-record node via its
   subject (`props.person`) — outside the population is **dropped** from results,
   recorded once as `{layer:'access', reason:'out-of-population'}`. Non-person org
   nodes are not row-filtered.
2. **Class (field-level).** A gated field with scope `S` is **redacted** unless `S ∈
   role.scopes`, recorded as `{layer:'access', reason:'role-restricted'}`. Directory
   fields are always allowed for a visible person.

### Combination with the consent-gate
At every existing gated site (select/project, traverse target, aggregate field,
groupBy, hop filters, gated-type anchor), the engine now applies **both** gates:
- Row inclusion: person must pass population AND (for gated-type anchors) consent
  `nodeReadable`.
- Field read: scope must satisfy consent (`gate(...)`) AND role (`S ∈ role.scopes`).
  If the role blocks the class, report the **access** reason; else report the consent
  reason. (Access precedence: lacking authority for a class is reported regardless of
  the subject's consent.)

### API
`runSpec(spec, db, purpose, role)` — `role` optional. When `role` is `null`/omitted,
the role-gate is a no-op (preserves the existing 28 tests verbatim). When present,
both gates apply. The engine exports `computePopulation`, `roleAllowsScope`, and the
role-aware predicates for testing.

## UI (`index.html` + `app.js`)

- A **"Viewing as"** `<select>` (chro/hrbp/manager/ic/peer) beside the purpose
  selector. Default `chro`. The selected role object is passed to `runSpec`.
- A **permission panel** renders on change and on load, from the role config + a live
  `computePopulation(role, db).size` count (or "everyone (~N)" for `all`):
  > **Viewing as Manager** — Mateo Thomas (GM, Store 01).
  > Sees: directory · scheduling · compliance · employment, for **your team (N people)**.
  > Hidden: compensation · everyone outside your team (~M people).
- The result's governance trace is grouped **by layer**: e.g. *"Access: 475
  out-of-population · 50 role-restricted (compensation). Consent: 12 no-grant."*

## Components (one job each)

- `ff-roles.js` (new, dual-mode) — the 5 persona definitions + the class/scope
  vocabulary. Pure data + tiny helpers; no engine coupling.
- `ff-engine.js` — `computePopulation`, role-gate predicates, threaded through the
  existing gated sites; `runSpec` gains the optional `role` param.
- `app.js` — role selector, permission-panel renderer, layered trace display; passes
  role into `runSpec`.
- `index.html` — the selector + panel container.

## Verification

- **Engine unit tests** (`ff-engine.test.js`, no API key):
  - `computePopulation`: `all`→ALL; `self`→1; `subtree:EMP-0001`→matches the
    hand-computed reports subtree; `region:West Region`→only West people;
    `store:Store 01`→Store 01 headcount.
  - **Population row-drop:** as `manager`, a query over `from:person` returns only the
    ~25 subtree people; everyone else traced `out-of-population`.
  - **Class redaction:** as `manager` under purpose `payroll`, `pay_rate` is redacted
    with `role-restricted` (manager lacks compensation) even for in-population,
    consenting people — proving role-gate fires independently of consent.
  - **Peer:** directory visible for same-store coworkers; every sensitive class
    `role-restricted`.
  - **IC:** sees only self; full classes on self (subject to consent).
  - **AND with consent:** as `chro` under `scheduling`, `pay_rate` still
    `out-of-purpose` (consent layer) — role being permissive doesn't bypass consent.
  - **Backward-compat:** all prior tests (role omitted) stay green.
- `ff-roles.test.js`: each persona has a valid population rule + scopes subset; anchor
  titles exist in the fixture.
- **In-browser** (no key needed): selecting each role updates the permission panel
  with correct counts; running a fixed spec shows row-drops + class redactions in the
  layered trace. (LLM round-trip still needs the user's key.)

## Risks / open questions

- **Anchor validity.** The `manager`/`ic`/`peer` anchors must exist and have sensible
  structure in the seeded fixture; validated in `ff-roles.test.js`. If absent, swap to
  equivalents (deterministic seed makes this stable).
- **Population scope of non-person anchors.** v1 does not row-filter stores/shifts by
  role; a manager querying `from:store` sees all stores (org structure is directory-
  class). Documented; revisit if needs arise.
- **Trace precedence.** When both layers block a field, access is reported. This is a
  deliberate choice (authority dominates); noted so it isn't read as a consent bug.
