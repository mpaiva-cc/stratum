---
type: entity-type
group: "Performance & lifecycle"
basis: consent
---

> **Performance & lifecycle** · governance basis: `consent`

A periodic review of a worker.

## Properties

- `id`
- `person`
- `period`
- `rating`
- `reviewer`

## Relationships (edges)

- `of` → [[type-person]]
- `by` → [[type-person]]

## Governance

Edges from this type are gated by **consent** — the data subject grants scope. The traversal predicate refuses paths a purpose token cannot satisfy.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
