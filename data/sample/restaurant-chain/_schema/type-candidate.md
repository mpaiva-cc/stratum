---
type: entity-type
group: "People & identity"
basis: consent
---

> **People & identity** · governance basis: `consent`

An applicant in the hiring pipeline (pre-hire person).

## Properties

- `id`
- `name`
- `stage`
- `applied_for`
- `source`

## Relationships (edges)

- `applied_to` → [[type-position]]
- `at` → [[type-store]]
- `screened_by` → [[type-agent]]

## Governance

Edges from this type are gated by **consent** — the data subject grants scope. The traversal predicate refuses paths a purpose token cannot satisfy.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
