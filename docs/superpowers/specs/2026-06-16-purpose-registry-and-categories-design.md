# Fork & Flame — Purpose Registry + Expanded Categories (design)

**Date:** 2026-06-16
**Status:** approved for planning
**Builds on:** the consent/purpose query layer and the role-permission layer
**Location of work:** `data/sample/restaurant-chain/`

## Problem

Purpose is rigid: one purpose maps to exactly one consent scope, hardcoded in three
places that must stay in sync — `_generate.py` (`meta.purposes` + per-scope grants),
`ff-engine.js` (`gate()` matches `meta.purposes[purpose] === requiredScope`), and the
UI (four hardcoded `<option>`s). Adding a purpose means coordinated edits across all
three. We want (1) a **data-driven registry** so a purpose is one catalog entry, and
(2) **five new categories** on top of it.

## Goals

1. **Registry:** a single source-of-truth purpose list in the generator, emitted as a
   fixture catalog the engine and UI both read. Purpose still maps 1:1 to a scope
   (decoupling to scope-sets stays a separate future lever, out of scope here).
2. **Expand to 9 categories:** add `performance`, `learning`, `benefits`,
   `work_authorization`, `recruiting`.
3. **No regressions:** existing governance guarantees and the role layer keep working;
   `runSpec` stays backward-compatible (role optional).

Non-goals: decoupling purpose→multiple scopes; purpose attributes (retention, legal
basis, aggregate-only); per-candidate consent records.

## Core principle (unchanged)

Enforcement is deterministic and in the engine. Two gating classes now exist:
- **Person-subject records / props** (employees): role authority + population +
  per-person consent grant.
- **Institutional records** (candidates): role authority + purpose only (consent
  implied by application; population N/A).

## The 9 categories

Single source `PURPOSES` in `_generate.py` (id, label, scope), in this order:

| id | label | scope | gates | source |
|----|-------|-------|-------|--------|
| `scheduling` | scheduling | `hr.scheduling` | `time_off_request` | existing |
| `payroll` | payroll | `hr.payroll` | `pay_rate`, `pay_unit`, `distributes_to` | existing |
| `compliance` | compliance | `hr.certifications` | `certification` | existing |
| `employment` | employment | `hr.employment` | `employment_event` | existing |
| `performance` | performance | `hr.performance` | `performance_review` | **re-slice from employment** |
| `learning` | learning | `hr.learning` | `training_record` | **re-slice from compliance** |
| `benefits` | benefits | `hr.benefits` | person prop `benefits` | **new data** |
| `work_authorization` | work authorization | `hr.work_auth` | person prop `work_authorization` | **new data** |
| `recruiting` | recruiting | `hr.recruiting` | `candidate` records | **institutional (new gating class)** |

`EMPLOYEE_SCOPES` = the eight employee-data scopes (everything except `hr.recruiting`).
`ALL_SCOPES` = `EMPLOYEE_SCOPES` + `hr.recruiting`.

## Fixture changes (`_generate.py`)

1. **`PURPOSES` list** (source of truth). Emit `meta.purposeCatalog = PURPOSES`
   (ordered `[{id,label,scope}]`) and derive `meta.purposes = {id: scope}` from it.
2. **Re-slice gatedTargets:** `performance_review → hr.performance`,
   `training_record → hr.learning`. `certification → hr.certifications` and
   `employment_event → hr.employment` unchanged.
3. **New person props + gatedProps:**
   - `benefits` — a deterministic subset of the chain's benefit plan names per person;
     `gatedProps['benefits'] = 'hr.benefits'`.
   - `work_authorization` — a deterministic status per person from a small vocabulary
     (e.g. `citizen`, `permanent_resident`, `visa_h1b`, `tn`, `ead`); seeded so most
     are `citizen`; `gatedProps['work_authorization'] = 'hr.work_auth'`.
   These are person frontmatter props (rendered in notes + the profile drawer) so they
   are real, gateable data — never shown ungated.
4. **New gating class:** `meta.gatedTypes = { candidate: 'hr.recruiting' }`
   (institutional records: role + purpose, no per-subject consent, no population).
5. **Consent grants for all eight EMPLOYEE_SCOPES** (was four). Keep the existing
   deliberate minorities (declined `hr.payroll`, expired `hr.certifications`, revoked
   `hr.scheduling`) so refusals still fire; the four new employee scopes are granted
   `active/open` for everyone (a future iteration can add minorities there).
   `hr.recruiting` has **no** per-employee grant (candidates use implied consent).

## Engine changes (`ff-engine.js`)

1. **`nodeReadable`** handles both maps:
   - `meta.gatedTargets[node.type]` (person-subject): gate the subject via
     `readField(subject, scope, db, purpose, role, pop)` — role → population → consent
     (unchanged).
   - `meta.gatedTypes[node.type]` (institutional, e.g. candidate): require
     `roleAllowsScope(role, scope)` (else `access/role-restricted`) AND
     `meta.purposes[purpose] === scope` (else `consent/out-of-purpose`); **no grant, no
     population.** Refuse with the node's own title as subject.
   - Else: directory node, always readable.
2. **`neighbors`** already runs `nodeReadable` on traverse targets whose type is in
   `gatedTargets`; extend that check to also cover `gatedTypes` (so traversing *to* a
   candidate from a non-person anchor is gated too).
3. No change to `gate`, `readField`, `computePopulation`, `project`, `aggregate`
   signatures — the new scopes flow through `gatedProps`/`gatedTargets`/`gatedTypes`
   data and the role `scopes` arrays.

## Role authority (`ff-roles.js`)

Define `ALL_SCOPES` (9) and `EMPLOYEE_SCOPES` (8). Persona scopes:
- `chro`, `hrbp`: `ALL_SCOPES`.
- `manager`: `['hr.scheduling','hr.certifications','hr.employment','hr.performance','hr.learning']`.
- `ic`: `EMPLOYEE_SCOPES` (self-service: own scheduling/pay/certs/lifecycle/performance/
  learning/benefits/work_auth; not recruiting).
- `peer`: `[]` (directory only).
- Impersonation (in `app.js`): `EMPLOYEE_SCOPES` (a real employee's self view; not recruiting).

## UI changes (`index.html` + `app.js`)

1. **Data-driven purpose dropdown.** Remove the four hardcoded `<option>`s; on load,
   populate `#purpose` from `window.FF_GRAPH.meta.purposeCatalog` (`id` → `value`,
   `label` → text), preserving catalog order. Default to the first (`scheduling`).
2. **Permission panel** already maps scope→label via `SCOPE_LABEL`; extend
   `SCOPE_LABEL` with the five new scopes so the panel reads naturally.
3. **Profile drawer:** add Benefits and Work-authorization rows (gated via the same
   `readField`), and split the Compliance section so Performance and Learning show
   under their own gates. (Drawer stays governance-consistent.)
4. **Narrator** `SCOPE_TO_PURPOSE` map extended with the new scopes so "switch Purpose
   to X" guidance works for the new categories.

## Verification

Engine tests (`ff-engine.test.js`, no API key) — add:
- **Registry:** every `meta.purposeCatalog` entry's `scope` appears in `meta.purposes`;
  the catalog has 9 entries.
- **Re-slice:** `performance_review` is gated by `hr.performance` not `hr.employment`
  (a role with employment-but-not-performance scope is refused performance, and vice
  versa); same for `training_record` ↔ `hr.learning` vs `hr.certifications`.
- **New person props:** `benefits` / `work_authorization` are redacted for a viewer
  whose role lacks the scope (peer) and shown for one that has it under the matching
  purpose; out-of-purpose under a different purpose.
- **Recruiting (institutional):** `from:candidate` returns rows **only** under purpose
  `recruiting` AND a role with `hr.recruiting` (chro/hrbp); under any other purpose →
  `consent/out-of-purpose`; for a role without recruiting (manager/ic/peer) →
  `access/role-restricted`; traversing to a candidate from a non-person anchor is gated
  the same way. **No population leak** (candidates not row-filtered, but fully blocked
  without recruiting authority).
- **Backward-compat:** the existing 44 tests still pass (re-slice may require updating
  the few that assert `hr.employment`/`hr.certifications` cover performance/training).
- **Determinism:** regenerate; fixture is stable; all app source files survive the
  wipe (no new files needed — all changes are to existing whitelisted files).

In-browser (no key): the purpose dropdown lists 9 options; selecting `performance` /
`learning` / `benefits` / `work_authorization` / `recruiting` updates the panel; the
profile drawer shows the new gated sections; impersonation/role gating holds.

## Risks / open questions

- **Re-slice changes existing semantics.** Anything that relied on `hr.employment`
  implicitly covering performance, or `hr.certifications` covering training, changes.
  Mitigation: update the few affected tests; managers get both `hr.employment` and
  `hr.performance` so their effective view is unchanged.
- **Recruiting authority breadth.** Candidates aren't population-filtered, so any
  recruiting-authorized role sees the whole pipeline. This matches real recruiter
  scope and is documented; tighten later if needed.
- **New-data realism.** `benefits` and `work_authorization` are seeded sample values
  for demonstration; they are sensitive-by-design and always gated.
