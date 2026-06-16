---
type: entity-type
group: "Skills & compliance"
basis: consent
---

> **Skills & compliance** · governance basis: `consent`

A completed training event for a worker.

## Properties

- `id`
- `person`
- `course`
- `completed`

## Relationships (edges)

- `of` → [[type-person]]
- `grants` → [[type-certification]]

## Governance

Edges from this type are gated by **consent** — the data subject grants scope. The traversal predicate refuses paths a purpose token cannot satisfy.

See the governance-basis model in the [[type-policy|policy]] note and the people-graph schema reference (§II.a).
