---
type: entity-type
group: "Systems & governance"
basis: consent
---

> **Systems & governance** · governance basis: `consent`

A recorded consent — the grantor, scope, purpose, validity. The traversal predicate reads these.

## Properties

- `id`
- `person`
- `scope`
- `purpose`
- `valid_to`

## Relationships (edges)

- `granted_by` → [[type-person]]

## Governance

Edges from this type are gated by **consent** — the data subject grants scope. The traversal predicate refuses paths a purpose token cannot satisfy.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
